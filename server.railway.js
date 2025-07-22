import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// Trust proxy for Railway
app.set('trust proxy', 1);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS for Railway
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check - critical for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    platform: 'railway',
    version: '2.0.0-railway',
    port: process.env.PORT || 3000
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Money Management Pro API',
    status: 'running',
    platform: 'railway',
    endpoints: ['/health', '/api/auth/user', '/api/sessions']
  });
});

// API Routes
app.get('/api/auth/user', (req, res) => {
  res.json({
    id: 'railway-user-123',
    email: 'railway@example.com',
    firstName: 'Railway',
    lastName: 'User',
    profileImageUrl: 'https://via.placeholder.com/150',
    subscription: 'premium',
    subscriptionActive: true,
    platform: 'railway'
  });
});

// In-memory storage for Railway
let sessions = [];
let bets = [];
let nextSessionId = 1;
let nextBetId = 1;

// Sessions endpoints
app.get('/api/sessions', (req, res) => {
  console.log('GET /api/sessions - returning:', sessions.length, 'sessions');
  res.json(sessions);
});

app.post('/api/sessions', (req, res) => {
  const newSession = {
    id: nextSessionId++,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    platform: 'railway'
  };
  sessions.push(newSession);
  console.log('POST /api/sessions - created session:', newSession.id);
  res.status(201).json(newSession);
});

app.get('/api/sessions/:id', (req, res) => {
  const session = sessions.find(s => s.id === parseInt(req.params.id));
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json(session);
});

app.put('/api/sessions/:id', (req, res) => {
  const sessionIndex = sessions.findIndex(s => s.id === parseInt(req.params.id));
  if (sessionIndex === -1) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  sessions[sessionIndex] = {
    ...sessions[sessionIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  res.json(sessions[sessionIndex]);
});

app.delete('/api/sessions/:id', (req, res) => {
  const sessionIndex = sessions.findIndex(s => s.id === parseInt(req.params.id));
  if (sessionIndex === -1) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  sessions.splice(sessionIndex, 1);
  res.status(204).send();
});

// Bets endpoints
app.get('/api/sessions/:id/bets', (req, res) => {
  const sessionBets = bets.filter(bet => bet.sessionId === parseInt(req.params.id));
  res.json(sessionBets);
});

app.post('/api/sessions/:id/bets', (req, res) => {
  const newBet = {
    id: nextBetId++,
    sessionId: parseInt(req.params.id),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  bets.push(newBet);
  res.status(201).json(newBet);
});

// Serve static files from dist if available
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  console.log('Serving static files from:', distPath);
  app.use(express.static(distPath));
  
  // SPA fallback for React Router
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ error: 'API endpoint not found' });
    } else {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
} else {
  console.log('Dist folder not found, serving API only');
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ error: 'API endpoint not found' });
    } else {
      res.json({ 
        error: 'Frontend not built',
        message: 'This is API-only mode. Frontend needs to be built.',
        available_endpoints: ['/health', '/api/auth/user', '/api/sessions']
      });
    }
  });
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message,
    platform: 'railway'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Railway Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;