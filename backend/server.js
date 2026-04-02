require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const app = express();

// Security
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { message: 'Too many requests. Please try again later.' },
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Seed endpoint (development only)
app.get('/api/seed', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Seed disabled in production' });
  }
  try {
    const bcrypt = require('bcryptjs');
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;

    await db.collection('users').deleteMany({});
    await db.collection('posts').deleteMany({});

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('Demo@123', salt);

    const users = [
      { name: 'Reshmi Ray Karmakar', username: 'reshmi_ray', email: 'reshmi@kyrosocial.app', password: hashedPassword, bio: 'Full-stack developer. Building Kyro Social with React and Node.js.', profilePicture: 'https://api.dicebear.com/9.x/initials/svg?seed=RR&backgroundColor=ff6154&textColor=ffffff', coverPhoto: '', isVerified: true, authProvider: 'local', followers: ['tech_niloy', 'sarah_codes', 'dev_alex'], following: ['tech_niloy', 'sarah_codes', 'dev_alex', 'mike_torres'], joinedDate: new Date('2026-03-01'), lastLogin: new Date(), loginHistory: [] },
      { name: 'Niloy Mallik', username: 'tech_niloy', email: 'niloy@kyrosocial.app', password: hashedPassword, bio: 'Tech enthusiast. Full-stack dev building cool things.', profilePicture: 'https://api.dicebear.com/9.x/initials/svg?seed=NM&backgroundColor=2d3142&textColor=ffffff', coverPhoto: '', isVerified: true, authProvider: 'local', followers: ['reshmi_ray', 'sarah_codes', 'mike_torres'], following: ['reshmi_ray', 'sarah_codes'], joinedDate: new Date('2026-02-15'), lastLogin: new Date(), loginHistory: [] },
      { name: 'Sarah Chen', username: 'sarah_codes', email: 'sarah@kyrosocial.app', password: hashedPassword, bio: 'Frontend developer who loves clean, pixel-perfect UI design.', profilePicture: 'https://api.dicebear.com/9.x/initials/svg?seed=SC&backgroundColor=10b981&textColor=ffffff', coverPhoto: '', isVerified: true, authProvider: 'local', followers: ['reshmi_ray', 'tech_niloy', 'dev_alex', 'mike_torres'], following: ['reshmi_ray', 'tech_niloy', 'dev_alex'], joinedDate: new Date('2026-01-20'), lastLogin: new Date(), loginHistory: [] },
      { name: 'Alex Developer', username: 'dev_alex', email: 'alex@kyrosocial.app', password: hashedPassword, bio: 'Backend architect. Node.js, Express, MongoDB. Open source contributor.', profilePicture: 'https://api.dicebear.com/9.x/initials/svg?seed=AD&backgroundColor=f59e0b&textColor=ffffff', coverPhoto: '', isVerified: true, authProvider: 'local', followers: ['reshmi_ray', 'sarah_codes'], following: ['reshmi_ray', 'sarah_codes', 'tech_niloy'], joinedDate: new Date('2026-02-01'), lastLogin: new Date(), loginHistory: [] },
      { name: 'Mike Torres', username: 'mike_torres', email: 'mike@kyrosocial.app', password: hashedPassword, bio: 'DevOps engineer. Cloud, CI/CD, and infrastructure as code.', profilePicture: 'https://api.dicebear.com/9.x/initials/svg?seed=MT&backgroundColor=6366f1&textColor=ffffff', coverPhoto: '', isVerified: true, authProvider: 'local', followers: ['reshmi_ray'], following: ['reshmi_ray', 'tech_niloy', 'sarah_codes'], joinedDate: new Date('2026-03-10'), lastLogin: new Date(), loginHistory: [] },
    ];

    const inserted = await db.collection('users').insertMany(users);
    const ids = Object.values(inserted.insertedIds);
    const m = {}; users.forEach((u, i) => { m[u.username] = ids[i]; });

    const now = Date.now();
    const H = 3600000;
    const D = 86400000;

    const posts = [
      { author: m['reshmi_ray'], authorUsername: 'reshmi_ray', authorName: 'Reshmi Ray Karmakar', authorAvatar: users[0].profilePicture, content: 'Just launched Kyro Social! Excited to build a platform where developers can truly connect. Built with React, Node.js, and MongoDB. Let me know what features you want to see next!', image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&auto=format&fit=crop&q=80', likes: [{ userId: m['tech_niloy'], username: 'tech_niloy', likedAt: new Date(now-2*H) }, { userId: m['sarah_codes'], username: 'sarah_codes', likedAt: new Date(now-H) }, { userId: m['dev_alex'], username: 'dev_alex', likedAt: new Date(now-30*60000) }, { userId: m['mike_torres'], username: 'mike_torres', likedAt: new Date(now-15*60000) }], likeCount: 4, comments: [{ userId: m['sarah_codes'], username: 'sarah_codes', userName: 'Sarah Chen', userAvatar: users[2].profilePicture, text: 'This looks amazing! The UI feels so polished. Great work!', createdAt: new Date(now-3*H) }, { userId: m['tech_niloy'], username: 'tech_niloy', userName: 'Niloy Mallik', userAvatar: users[1].profilePicture, text: 'The animations are so smooth. Love the attention to detail!', createdAt: new Date(now-2*H) }, { userId: m['dev_alex'], username: 'dev_alex', userName: 'Alex Developer', userAvatar: users[3].profilePicture, text: 'Would love to see dark mode support in the next update.', createdAt: new Date(now-H) }], commentCount: 3, interactedUsers: ['tech_niloy','sarah_codes','dev_alex','mike_torres'], createdAt: new Date(now-4*H), updatedAt: new Date(now-4*H) },
      { author: m['tech_niloy'], authorUsername: 'tech_niloy', authorName: 'Niloy Mallik', authorAvatar: users[1].profilePicture, content: 'Working on some exciting full-stack projects lately. The developer community is incredible -- always inspiring to see what people are building!\n\nWhat are you all working on this week? Drop your projects below!', image: '', likes: [{ userId: m['reshmi_ray'], username: 'reshmi_ray', likedAt: new Date(now-6*H) }, { userId: m['sarah_codes'], username: 'sarah_codes', likedAt: new Date(now-5*H) }], likeCount: 2, comments: [{ userId: m['reshmi_ray'], username: 'reshmi_ray', userName: 'Reshmi Ray Karmakar', userAvatar: users[0].profilePicture, text: 'Building Kyro Social! You should definitely try it out.', createdAt: new Date(now-5*H) }], commentCount: 1, interactedUsers: ['reshmi_ray','sarah_codes'], createdAt: new Date(now-8*H), updatedAt: new Date(now-8*H) },
      { author: m['sarah_codes'], authorUsername: 'sarah_codes', authorName: 'Sarah Chen', authorAvatar: users[2].profilePicture, content: 'Beautiful sunset from my workspace today. Sometimes the best inspiration comes when you step away from the code for a moment and just breathe.', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80', likes: [{ userId: m['reshmi_ray'], username: 'reshmi_ray', likedAt: new Date(now-10*H) }, { userId: m['tech_niloy'], username: 'tech_niloy', likedAt: new Date(now-9*H) }, { userId: m['dev_alex'], username: 'dev_alex', likedAt: new Date(now-8*H) }, { userId: m['mike_torres'], username: 'mike_torres', likedAt: new Date(now-7*H) }], likeCount: 4, comments: [{ userId: m['mike_torres'], username: 'mike_torres', userName: 'Mike Torres', userAvatar: users[4].profilePicture, text: 'Absolutely stunning view! Nature is the best debugger.', createdAt: new Date(now-9*H) }, { userId: m['reshmi_ray'], username: 'reshmi_ray', userName: 'Reshmi Ray Karmakar', userAvatar: users[0].profilePicture, text: 'Wish my workspace had a view like that!', createdAt: new Date(now-8*H) }], commentCount: 2, interactedUsers: ['reshmi_ray','tech_niloy','dev_alex','mike_torres'], createdAt: new Date(now-12*H), updatedAt: new Date(now-12*H) },
      { author: m['dev_alex'], authorUsername: 'dev_alex', authorName: 'Alex Developer', authorAvatar: users[3].profilePicture, content: 'Pro tip for backend developers: Always write your API error handlers first. It saves hours of debugging time later.\n\nHere is the pattern I use for every Express controller:\n\n1. Validate input early\n2. Try the core operation\n3. Catch and format errors consistently\n4. Send uniform response shapes', image: '', likes: [{ userId: m['sarah_codes'], username: 'sarah_codes', likedAt: new Date(now-D) }, { userId: m['reshmi_ray'], username: 'reshmi_ray', likedAt: new Date(now-20*H) }, { userId: m['tech_niloy'], username: 'tech_niloy', likedAt: new Date(now-18*H) }], likeCount: 3, comments: [{ userId: m['mike_torres'], username: 'mike_torres', userName: 'Mike Torres', userAvatar: users[4].profilePicture, text: 'Great advice! I also add request logging middleware for every route.', createdAt: new Date(now-22*H) }], commentCount: 1, interactedUsers: ['sarah_codes','reshmi_ray','tech_niloy','mike_torres'], createdAt: new Date(now-D), updatedAt: new Date(now-D) },
      { author: m['mike_torres'], authorUsername: 'mike_torres', authorName: 'Mike Torres', authorAvatar: users[4].profilePicture, content: 'Just deployed my portfolio site using Vercel. The DX is unmatched -- push to main and it is live in seconds!', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80', likes: [{ userId: m['reshmi_ray'], username: 'reshmi_ray', likedAt: new Date(now-2*D) }], likeCount: 1, comments: [], commentCount: 0, interactedUsers: ['reshmi_ray'], createdAt: new Date(now-2*D), updatedAt: new Date(now-2*D) },
      { author: m['reshmi_ray'], authorUsername: 'reshmi_ray', authorName: 'Reshmi Ray Karmakar', authorAvatar: users[0].profilePicture, content: 'Design tip: Never underestimate the power of whitespace. A clean layout with proper spacing always beats a cramped, feature-heavy interface.\n\nThe best apps feel like they have room to breathe.', image: '', likes: [{ userId: m['sarah_codes'], username: 'sarah_codes', likedAt: new Date(now-2.5*D) }, { userId: m['dev_alex'], username: 'dev_alex', likedAt: new Date(now-2.3*D) }, { userId: m['tech_niloy'], username: 'tech_niloy', likedAt: new Date(now-2.2*D) }, { userId: m['mike_torres'], username: 'mike_torres', likedAt: new Date(now-2.1*D) }], likeCount: 4, comments: [{ userId: m['sarah_codes'], username: 'sarah_codes', userName: 'Sarah Chen', userAvatar: users[2].profilePicture, text: 'This is so true! Whitespace is a feature, not a bug.', createdAt: new Date(now-2.4*D) }], commentCount: 1, interactedUsers: ['sarah_codes','dev_alex','tech_niloy','mike_torres'], createdAt: new Date(now-3*D), updatedAt: new Date(now-3*D) },
      { author: m['tech_niloy'], authorUsername: 'tech_niloy', authorName: 'Niloy Mallik', authorAvatar: users[1].profilePicture, content: 'Just finished reading "Clean Code" by Robert C. Martin for the second time. Key takeaways:\n\n- Functions should do one thing\n- Meaningful variable names save hours\n- Comments should explain WHY, not WHAT\n- Tests are not optional', image: '', likes: [{ userId: m['dev_alex'], username: 'dev_alex', likedAt: new Date(now-3.5*D) }, { userId: m['reshmi_ray'], username: 'reshmi_ray', likedAt: new Date(now-3.2*D) }], likeCount: 2, comments: [{ userId: m['dev_alex'], username: 'dev_alex', userName: 'Alex Developer', userAvatar: users[3].profilePicture, text: 'The naming convention chapter alone is worth the entire book.', createdAt: new Date(now-3.3*D) }], commentCount: 1, interactedUsers: ['dev_alex','reshmi_ray'], createdAt: new Date(now-4*D), updatedAt: new Date(now-4*D) },
      { author: m['sarah_codes'], authorUsername: 'sarah_codes', authorName: 'Sarah Chen', authorAvatar: users[2].profilePicture, content: 'Spent the morning refactoring a legacy component from a class component to hooks. The result? 60% less code, 100% more readable.\n\nReact hooks truly changed the game.', image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80', likes: [{ userId: m['reshmi_ray'], username: 'reshmi_ray', likedAt: new Date(now-4.5*D) }, { userId: m['tech_niloy'], username: 'tech_niloy', likedAt: new Date(now-4.2*D) }, { userId: m['mike_torres'], username: 'mike_torres', likedAt: new Date(now-4.1*D) }], likeCount: 3, comments: [], commentCount: 0, interactedUsers: ['reshmi_ray','tech_niloy','mike_torres'], createdAt: new Date(now-5*D), updatedAt: new Date(now-5*D) },
    ];

    await db.collection('posts').insertMany(posts);

    res.json({
      success: true,
      message: 'Database seeded successfully!',
      users: users.length,
      posts: posts.length,
      accounts: users.map(u => ({ username: u.username, email: u.email, password: 'Demo@123' })),
    });
  } catch (err) {
    console.error('Seed error:', err);
    res.status(500).json({ message: 'Seed failed', error: err.message });
  }
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size cannot exceed 5MB' });
    }
    return res.status(400).json({ message: err.message });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Kyro Social API running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer();

module.exports = app;
