require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/error');
const { setIO } = require('./utils/socket');
const { pushNotification } = require('./utils/notifications');

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const path = req.path || '';
    return path === '/google' || path === '/guest' || path === '/me';
  },
  message: { message: 'Too many authentication requests. Please try again later.' },
});

// Comprehensive Health Route - Pings both Server process and MongoDB Database
app.get('/api/health', async (req, res) => {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  let dbPingMs = null;
  let dbError = null;

  try {
    const readyState = mongoose.connection.readyState;
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (readyState === 1 && mongoose.connection.db) {
      const dbPingStart = Date.now();
      // Actively touch MongoDB database to keep Atlas connection hot and prevent idling
      await mongoose.connection.db.command({ ping: 1 });
      dbPingMs = Date.now() - dbPingStart;
      dbStatus = 'connected';
    } else {
      const stateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
      dbStatus = stateMap[readyState] || 'unknown';
    }
  } catch (err) {
    dbStatus = 'error';
    dbError = err.message;
  }

  const isHealthy = dbStatus === 'connected';
  const totalResponseTimeMs = Date.now() - startTime;

  const payload = {
    status: isHealthy ? 'ok' : 'degraded',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    server: {
      status: 'up',
      environment: process.env.NODE_ENV || 'production',
      memory: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
      },
    },
    database: {
      status: dbStatus,
      latency: dbPingMs !== null ? `${dbPingMs}ms` : undefined,
      error: dbError || undefined,
    },
    totalResponseTime: `${totalResponseTimeMs}ms`,
  };

  return res.status(isHealthy ? 200 : 503).json(payload);
});

app.use('/api/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));

app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT || 5000);

const start = async () => {
  await connectDB();
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  setIO(io);

  io.on('connection', (socket) => {
    const username = String(socket.handshake.query?.username || '').toLowerCase();
    if (username) {
      socket.join(`user:${username}`);
    }

    // Typing indicators for messaging
    socket.on('typing:start', ({ toUsername }) => {
      if (toUsername) {
        io.to(`user:${String(toUsername).toLowerCase()}`).emit('typing:start', {
          fromUsername: username,
        });
      }
    });

    socket.on('typing:stop', ({ toUsername }) => {
      if (toUsername) {
        io.to(`user:${String(toUsername).toLowerCase()}`).emit('typing:stop', {
          fromUsername: username,
        });
      }
    });

    // Legacy DM support
    socket.on('dm:send', async ({ toUsername, text }) => {
      if (!toUsername || !text) return;
      io.to(`user:${String(toUsername).toLowerCase()}`).emit('dm:message', {
        fromUsername: username || null,
        text: String(text).slice(0, 500),
        createdAt: new Date().toISOString(),
      });
      await pushNotification({
        toUsername: String(toUsername).toLowerCase(),
        type: 'message',
        fromUsername: username || 'unknown',
        text: String(text).slice(0, 120),
      });
    });
  });

  server.listen(PORT, () => {
    console.log(`Kyro Social API running on port ${PORT}`);

    // Layer 1: Self-ping system to keep Render web service & MongoDB Atlas hot
    const rawPingUrl = process.env.SELF_PING_URL || process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL;
    if (rawPingUrl) {
      const cleanUrl = rawPingUrl.replace(/\/+$/, '');
      const healthUrl = cleanUrl.endsWith('/api/health') ? cleanUrl : `${cleanUrl}/api/health`;
      const pingInterval = Number(process.env.PING_INTERVAL_MS) || 10 * 60 * 1000; // 10 minutes

      console.log(`[Keep-Alive] Layer 1 self-ping initialized: ${healthUrl} (interval: ${Math.round(pingInterval / 60000)}m)`);

      const triggerPing = async () => {
        try {
          const response = await fetch(healthUrl);
          const data = await response.json().catch(() => ({}));
          console.log(
            `[Keep-Alive] Ping sent to ${healthUrl} | Status: ${response.status} | DB: ${data.database?.status || 'unknown'} | Latency: ${data.database?.latency || 'N/A'}`
          );
        } catch (error) {
          console.error(`[Keep-Alive] Ping failed: ${error.message}`);
        }
      };

      // Initial ping after 30 seconds to verify startup connectivity
      setTimeout(triggerPing, 30 * 1000);

      // Recurring ping interval
      setInterval(triggerPing, pingInterval);
    } else {
      console.log('[Keep-Alive] No RENDER_EXTERNAL_URL or SELF_PING_URL configured. Self-ping idle.');
    }
  });
};

start().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});

module.exports = app;

