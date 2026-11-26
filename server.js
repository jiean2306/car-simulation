const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8480;
const ROOT = path.resolve(__dirname);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.hdr': 'application/octet-stream',
  '.wasm': 'application/wasm',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

const LONG_CACHE_EXTS = new Set(['.glb', '.hdr', '.wasm', '.png', '.jpg', '.jpeg']);

function getCacheControl(ext) {
  if (LONG_CACHE_EXTS.has(ext)) return 'public, max-age=86400';
  if (ext === '.html' || ext === '.js' || ext === '.css') return 'no-cache';
  return 'no-cache';
}

function sendResponse(res, statusCode, headers, body, isHead) {
  res.writeHead(statusCode, headers);
  if (isHead || body == null) {
    res.end();
  } else {
    res.end(body);
  }
}

const server = http.createServer((req, res) => {
  const method = (req.method || 'GET').toUpperCase();
  const isHead = method === 'HEAD';

  if (method !== 'GET' && !isHead) {
    return sendResponse(res, 405, { 'Content-Type': 'text/plain; charset=utf-8', Allow: 'GET, HEAD' }, 'Method Not Allowed', isHead);
  }

  let pathname;
  try {
    pathname = decodeURIComponent((req.url || '/').split('?')[0]);
  } catch {
    return sendResponse(res, 400, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Bad Request', isHead);
  }

  if (pathname === '/health') {
    const payload = JSON.stringify({ status: 'ok', uptime: process.uptime() });
    return sendResponse(res, 200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache' }, payload, isHead);
  }

  const relPath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = path.resolve(ROOT, relPath);

  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
    return sendResponse(res, 403, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Forbidden', isHead);
  }

  fs.stat(filePath, (statErr, stats) => {
    if (statErr || !stats.isFile()) {
      return sendResponse(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Not found', isHead);
    }

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        return sendResponse(res, 500, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Internal Server Error', isHead);
      }
      const ext = path.extname(filePath).toLowerCase();
      sendResponse(
        res,
        200,
        {
          'Content-Type': MIME[ext] || 'application/octet-stream',
          'Cache-Control': getCacheControl(ext),
          'Content-Length': data.length,
        },
        data,
        isHead
      );
    });
  });
});

server.listen(PORT, () => {
  console.log(`Zootopia Velocity 3D Server running at http://localhost:${PORT}`);
});
