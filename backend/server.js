require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

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

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
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

    // keep awake on render free tier
    const renderUrl = process.env.RENDER_EXTERNAL_URL;
    if (renderUrl) {
      setInterval(async () => {
        try {
          const response = await fetch(`${renderUrl}/api/health`);
          console.log(`keep-awake ping sent. status: ${response.status}`);
        } catch (error) {
          console.error(`keep-awake ping failed: ${error.message}`);
        }
      }, 10 * 60 * 1000); // 10 minutes
    }
  });
};

start().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});

module.exports = app;

