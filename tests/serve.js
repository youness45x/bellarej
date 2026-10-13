// Tiny local web server for the checks: offline mode and installing only work on a real address
// (http://localhost), never on a plain file. Usage: const srv = await serve(rootDir); srv.url; srv.close()
const http = require('http');
const fs = require('fs');
const path = require('path');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css',
  '.webmanifest': 'application/manifest+json', '.json': 'application/json', '.png': 'image/png',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
};

function serve(root, port = 0) {
  const hits = [];
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(root, p);
    hits.push(p);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => {
    const url = `http://localhost:${server.address().port}/`;
    resolve({ url, hits, close: () => new Promise((r) => { server.closeAllConnections && server.closeAllConnections(); server.close(r); }) });
  }));
}
module.exports = { serve };
