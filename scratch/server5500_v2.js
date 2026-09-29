/**
 * Smart School Static File Server - Port 5500
 * Properly serves JS, CSS, HTML, and other static files with correct MIME types.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5500;
const ROOT = path.join(__dirname, '..'); // Project root = parent of scratch/

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.txt':  'text/plain; charset=utf-8',
  '.pdf':  'application/pdf',
};

const server = http.createServer((req, res) => {
  // Strip query string for file lookup
  const urlPath = req.url.split('?')[0];
  
  // Resolve the file path
  let filePath = path.join(ROOT, decodeURIComponent(urlPath));
  
  // Security: prevent directory traversal
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Check if it's a directory - try index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // If file doesn't exist, try serving frontend/index.html for SPA routing
  if (!fs.existsSync(filePath)) {
    // Try prepending frontend/ if it looks like an SPA route
    const frontendIndex = path.join(ROOT, 'frontend', 'index.html');
    if (fs.existsSync(frontendIndex)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(frontendIndex));
      return;
    }
    res.writeHead(404);
    res.end('Not Found: ' + urlPath);
    return;
  }

  // Get MIME type from extension
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // Read and serve the file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end('Server Error: ' + err.message);
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Smart School static server running on http://127.0.0.1:${PORT}`);
  console.log(`Serving files from: ${ROOT}`);
});
