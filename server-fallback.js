import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API endpoints
app.get('/api/auth/user', (req, res) => {
  res.json({
    id: 'render-user',
    email: 'user@render.com',
    firstName: 'Render',
    lastName: 'User',
    subscription: 'premium'
  });
});

app.get('/api/sessions', (req, res) => {
  res.json([]);
});

// Try multiple static file locations
const possiblePaths = [
  path.join(__dirname, 'dist', 'public'),
  path.join(__dirname, 'dist'),
  path.join(__dirname, 'client', 'dist'),
  path.join(__dirname, 'build'),
  path.join(__dirname, 'public')
];

let staticPath = null;
let indexPath = null;

for (const testPath of possiblePaths) {
  const testIndex = path.join(testPath, 'index.html');
  if (fs.existsSync(testIndex)) {
    staticPath = testPath;
    indexPath = testIndex;
    console.log(`✅ Found static files at: ${staticPath}`);
    break;
  }
}

if (staticPath && indexPath) {
  app.use(express.static(staticPath));
  
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ error: 'API endpoint not found' });
    } else {
      res.sendFile(indexPath);
    }
  });
} else {
  console.log('❌ No static files found, serving fallback HTML');
  console.log('Checked paths:', possiblePaths);
  
  const fallbackPath = path.join(__dirname, 'fallback.html');
  
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ error: 'API endpoint not found' });
    } else if (fs.existsSync(fallbackPath)) {
      res.sendFile(fallbackPath);
    } else {
      res.json({
        message: 'Frontend not found',
        checkedPaths: possiblePaths,
        availableEndpoints: ['/health', '/api/auth/user', '/api/sessions']
      });
    }
  });
}

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Fallback server running on port ${PORT}`);
  console.log(`Static path: ${staticPath || 'Not found'}`);
  console.log(`Index path: ${indexPath || 'Not found'}`);
});

export default app;