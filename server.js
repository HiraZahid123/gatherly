require('dotenv').config();

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

// Force production mode if not in dev
if (process.env.NODE_ENV !== 'development') {
  process.env.NODE_ENV = 'production';
}

// 🩺 Diagnostic Checks for Hostinger
const requiredEnv = ['DATABASE_URL', 'AUTH_SECRET'];
const missingEnv = requiredEnv.filter(k => !process.env[k]);
if (missingEnv.length > 0) {
  console.error(`[CRITICAL] Missing Environment Variables: ${missingEnv.join(', ')}`);
  console.error('[Server] Please set these in your Hostinger dashboard to prevent crash loops.');
}

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0'; // Changed from localhost to listen on all interfaces
const port = process.env.PORT || 3000;
const app = next({ dev, hostname, port, dir: __dirname });
const handle = app.getRequestHandler();

console.log(`[Server] Starting in ${process.env.NODE_ENV} mode...`);
console.log(`[Server] Port: ${port}`);
console.log(`[Server] Directory: ${__dirname}`);

app.prepare().then(() => {
  console.log('[Server] Next.js prepared');
  const httpServer = createServer(async (req, res) => {
    try {
      if (req.url === '/health') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('OK');
        return;
      }
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err.stack || err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Global reference for API routes to access if needed
  global.io = io;

  io.on('connection', (socket) => {
    console.log('[Socket] Client connected:', socket.id);

    socket.on('join-event', (eventId) => {
      socket.join(`event-${eventId}`);
      console.log(`[Socket] Client ${socket.id} joined room: event-${eventId}`);
    }); 

    socket.on('join-user', (userId) => {
      socket.join(`user-${userId}`);
      console.log(`[Socket] Client ${socket.id} joined private room: user-${userId}`);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Client disconnected:', socket.id);
    });
  });

  httpServer.once('error', (err) => {
    console.error('[Server Error]', err);
    process.exit(1);
  }).listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`[Server] Startup complete at ${new Date().toISOString()}`);
  });
}).catch((err) => {
  console.error('[Fatal Error] Failed to prepare Next.js app:', err);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});