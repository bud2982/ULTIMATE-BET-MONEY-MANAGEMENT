import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// Trust proxy for Render
app.set('trust proxy', 1);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS for Render
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://money-management-pro.onrender.com',
    process.env.RENDER_EXTERNAL_URL
  ].filter(Boolean);

  if (allowedOrigins.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
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

// Health check - critical for Render
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    platform: 'render',
    version: '2.0.0-render',
    service: 'Money Management Pro'
  });
});

// Root endpoint removed - will be handled by static file serving or catch-all

// API Routes
app.get('/api/auth/user', (req, res) => {
  res.json({
    id: 'render-user-123',
    email: 'render@example.com',
    firstName: 'Render',
    lastName: 'User',
    profileImageUrl: 'https://via.placeholder.com/150',
    subscription: 'premium',
    subscriptionActive: true,
    platform: 'render'
  });
});

// In-memory storage for Render
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
    platform: 'render'
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

// Try multiple possible paths for static files
const possiblePaths = [
  path.join(__dirname, 'dist', 'public'),
  path.join(__dirname, 'dist'),
  path.join(__dirname, 'public'),
  path.join(__dirname, 'build'),
  path.join(__dirname, 'client', 'dist'),
  path.join(__dirname, 'client', 'build')
];

let distPath = null;
let indexPath = null;

console.log('🔍 STATIC FILES SEARCH:');
console.log('- __dirname:', __dirname);
console.log('- process.cwd():', process.cwd());

// List all files in root directory for debugging
try {
  const rootFiles = fs.readdirSync(__dirname);
  console.log('- Root directory files:', rootFiles.slice(0, 10), rootFiles.length > 10 ? '...' : '');
} catch (err) {
  console.log('- Error reading root directory:', err.message);
}

for (const testPath of possiblePaths) {
  const testIndex = path.join(testPath, 'index.html');
  const pathExists = fs.existsSync(testPath);
  const indexExists = fs.existsSync(testIndex);
  
  console.log(`- Testing: ${testPath}`);
  console.log(`  - Directory exists: ${pathExists}`);
  console.log(`  - index.html exists: ${indexExists}`);
  
  if (pathExists) {
    try {
      const files = fs.readdirSync(testPath);
      console.log(`  - Files in directory: ${files.slice(0, 5).join(', ')}${files.length > 5 ? '...' : ''}`);
    } catch (err) {
      console.log(`  - Error reading directory: ${err.message}`);
    }
  }
  
  if (pathExists && indexExists) {
    distPath = testPath;
    indexPath = testIndex;
    console.log(`✅ FOUND STATIC FILES AT: ${distPath}`);
    break;
  }
}

if (distPath && indexPath) {
  console.log('✅ Serving static files from:', distPath);
  app.use(express.static(distPath));
  
  // SPA fallback for React Router
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ error: 'API endpoint not found' });
    } else {
      console.log('Serving SPA for path:', req.path);
      res.sendFile(indexPath);
    }
  });
} else {
  console.log('❌ FRONTEND FILES NOT FOUND');
  console.log('This means the build process may have failed or files are in a different location.');
  
  try {
    const rootFiles = fs.readdirSync(__dirname);
    console.log('Available files in root:', rootFiles);
    
    // Check if dist directory exists but is empty or has different structure
    const distDir = path.join(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
      console.log('dist/ directory exists, contents:', fs.readdirSync(distDir));
    }
  } catch (err) {
    console.log('Error listing files:', err.message);
  }
  
  console.log('Checked paths:', possiblePaths);
  
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ error: 'API endpoint not found' });
    } else {
      // Serve a basic HTML page instead of JSON for better UX
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Money Management Pro - Build Error</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .error { color: #e74c3c; }
            .info { color: #3498db; margin-top: 20px; }
            pre { background: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">⚠️ Frontend Build Error</h1>
            <p>The frontend files were not found. This usually means:</p>
            <ul>
              <li>The build process failed during deployment</li>
              <li>Files are in a different location than expected</li>
              <li>The build command didn't complete successfully</li>
            </ul>
            
            <div class="info">
              <h3>🔧 Debug Information:</h3>
              <p><strong>Checked paths:</strong></p>
              <pre>${possiblePaths.join('\n')}</pre>
              
              <h3>📡 Available API Endpoints:</h3>
              <ul>
                <li><a href="/health">/health</a> - Health check</li>
                <li><a href="/api/auth/user">/api/auth/user</a> - User info</li>
                <li><a href="/api/sessions">/api/sessions</a> - Sessions</li>
              </ul>
            </div>
          </div>
        </body>
        </html>
      `);
    }
  });
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message,
    platform: 'render'
  });
});

// Start server
const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Render Server running on port ${PORT}`);
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