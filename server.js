const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// Simple in-memory store for demo (replace with DB for production)
const users = [];

// MIME types for static file serving
const MIME_TYPES = {
    '.html': 'text/html',
    '.css':  'text/css',
    '.js':   'application/javascript',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.svg':  'image/svg+xml',
    '.ico':  'image/x-icon',
};

function serveStatic(res, filePath) {
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'text/plain';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h2>404 - File Not Found</h2>');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => (body += chunk));
        req.on('end', () => {
            try { resolve(JSON.parse(body)); }
            catch (e) { resolve({}); }
        });
        req.on('error', reject);
    });
}

const server = http.createServer(async (req, res) => {
    // CORS headers (handy for local dev)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const url = req.url === '/' ? '/index.html' : req.url;

    // ── API: Handle login / signup ──────────────────────────────────────────
    if (req.method === 'POST' && url === '/send-login-alert') {
        const body = await readBody(req);
        const { email, password, type = 'LOGIN' } = body;

        if (!email || !password) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Email and password required.' }));
            return;
        }

        const entry = {
            type,
            email,
            timestamp: new Date().toISOString(),
        };

        users.push(entry);

        console.log(`[${entry.timestamp}] ${type} — ${email}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: `${type} recorded.` }));
        return;
    }

    // ── Static file serving ─────────────────────────────────────────────────
    const filePath = path.join(__dirname, url.split('?')[0]);

    // Only serve files inside the project directory
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    serveStatic(res, filePath);
});

server.listen(PORT, () => {
    console.log(`\n  Sniper dev server running at http://localhost:${PORT}`);
    console.log(`  Landing page : http://localhost:${PORT}/`);
    console.log(`  Login        : http://localhost:${PORT}/login.html`);
    console.log(`  Signup       : http://localhost:${PORT}/signup.html\n`);
});
