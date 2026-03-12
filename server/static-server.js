import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import { promises as fsp } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const STATIC_HOST = process.env.STATIC_HOST || '0.0.0.0';
const STATIC_PORT = Number(process.env.STATIC_PORT || 4173);
const DIST_DIR = path.resolve(projectRoot, process.env.STATIC_DIST_DIR || 'dist');
const AI_PROXY_BASE_PATH = '/api/ai';
const AI_PROXY_TARGET = new URL(
  process.env.AI_PROXY_TARGET || `http://127.0.0.1:${process.env.AI_BRIDGE_PORT || 8787}`
);

const CONTENT_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, message) {
  res.writeHead(statusCode, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(message);
}

function isSafeRelativePath(relativePath) {
  const normalized = path.posix.normalize(relativePath);
  return !normalized.startsWith('..') && !path.isAbsolute(normalized);
}

async function serveFile(res, filePath, statusCode = 200) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';
  const fileBuffer = await fsp.readFile(filePath);
  res.writeHead(statusCode, {
    'Content-Type': contentType,
    'Cache-Control': filePath.endsWith('index.html') ? 'no-cache' : 'public, max-age=31536000, immutable',
  });
  res.end(fileBuffer);
}

function proxyToAi(req, res) {
  const incomingUrl = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);
  const upstreamPath = incomingUrl.pathname.replace(/^\/api\/ai/, '') || '/';
  const upstreamUrl = new URL(`${upstreamPath}${incomingUrl.search}`, AI_PROXY_TARGET);
  const client = upstreamUrl.protocol === 'https:' ? https : http;

  const proxyReq = client.request(
    {
      protocol: upstreamUrl.protocol,
      hostname: upstreamUrl.hostname,
      port: upstreamUrl.port,
      method: req.method,
      path: `${upstreamUrl.pathname}${upstreamUrl.search}`,
      headers: {
        ...req.headers,
        host: upstreamUrl.host,
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', (error) => {
    sendJson(res, 502, {
      error: 'AI_PROXY_ERROR',
      message: error.message,
      target: AI_PROXY_TARGET.toString(),
    });
  });

  req.pipe(proxyReq);
}

async function handleStaticRequest(req, res) {
  if (!fs.existsSync(DIST_DIR)) {
    sendText(res, 503, 'dist 目录不存在，请先执行 npm run build');
    return;
  }

  const incomingUrl = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);
  const pathname = decodeURIComponent(incomingUrl.pathname);
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');

  if (!isSafeRelativePath(relativePath)) {
    sendText(res, 403, 'Forbidden');
    return;
  }

  const targetPath = path.join(DIST_DIR, relativePath);

  try {
    const stat = await fsp.stat(targetPath);
    if (stat.isFile()) {
      await serveFile(res, targetPath);
      return;
    }
  } catch {
    // fallback to index.html for SPA routing
  }

  await serveFile(res, path.join(DIST_DIR, 'index.html'));
}

const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`).pathname;

  if (pathname === '/health') {
    sendJson(res, 200, {
      ok: true,
      staticHost: STATIC_HOST,
      staticPort: STATIC_PORT,
      distDir: DIST_DIR,
      aiProxyTarget: AI_PROXY_TARGET.toString(),
      distReady: fs.existsSync(DIST_DIR),
    });
    return;
  }

  if (pathname.startsWith(AI_PROXY_BASE_PATH)) {
    proxyToAi(req, res);
    return;
  }

  try {
    await handleStaticRequest(req, res);
  } catch (error) {
    sendJson(res, 500, {
      error: 'STATIC_SERVER_ERROR',
      message: error.message,
    });
  }
});

server.listen(STATIC_PORT, STATIC_HOST, () => {
  console.log(`Static server ready at http://${STATIC_HOST}:${STATIC_PORT}`);
  console.log(`Serving dist from ${DIST_DIR}`);
  console.log(`Proxying ${AI_PROXY_BASE_PATH} -> ${AI_PROXY_TARGET.toString()}`);
});
