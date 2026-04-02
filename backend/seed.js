/**
 * Kyro Social -- Database Seed Script
 * Inserts permanent demo users and posts into MongoDB
 * Run: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    const db = mongoose.connection.db;

    // Clear existing data
    await db.collection('users').deleteMany({});
    await db.collection('posts').deleteMany({});
    console.log('Cleared existing users and posts.');

    // Hash a shared demo password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('Demo@123', salt);

    // ─── USERS ───────────────────────────────────────────────
    const usersToInsert = [
      {
        name: 'Reshmi Ray Karmakar',
        username: 'reshmi_ray',
        email: 'reshmi@kyrosocial.app',
        password: hashedPassword,
        bio: 'Full-stack developer. Building Kyro Social with React and Node.js.',
        profilePicture: 'https://api.dicebear.com/9.x/initials/svg?seed=RR&backgroundColor=ff6154&textColor=ffffff',
        coverPhoto: '',
        isVerified: true,
        authProvider: 'local',
        followers: ['tech_niloy', 'sarah_codes', 'dev_alex'],
        following: ['tech_niloy', 'sarah_codes', 'dev_alex', 'mike_torres'],
        joinedDate: new Date('2026-03-01'),
        lastLogin: new Date(),
        loginHistory: [],
      },
      {
        name: 'Niloy Mallik',
        username: 'tech_niloy',
        email: 'niloy@kyrosocial.app',
        password: hashedPassword,
        bio: 'Tech enthusiast. Full-stack dev building cool things.',
        profilePicture: 'https://api.dicebear.com/9.x/initials/svg?seed=NM&backgroundColor=2d3142&textColor=ffffff',
        coverPhoto: '',
        isVerified: true,
        authProvider: 'local',
        followers: ['reshmi_ray', 'sarah_codes', 'mike_torres'],
        following: ['reshmi_ray', 'sarah_codes'],
        joinedDate: new Date('2026-02-15'),
        lastLogin: new Date(),
        loginHistory: [],
      },
      {
        name: 'Sarah Chen',
        username: 'sarah_codes',
        email: 'sarah@kyrosocial.app',
        password: hashedPassword,
        bio: 'Frontend developer who loves clean, pixel-perfect UI design.',
        profilePicture: 'https://api.dicebear.com/9.x/initials/svg?seed=SC&backgroundColor=10b981&textColor=ffffff',
        coverPhoto: '',
        isVerified: true,
        authProvider: 'local',
        followers: ['reshmi_ray', 'tech_niloy', 'dev_alex', 'mike_torres'],
        following: ['reshmi_ray', 'tech_niloy', 'dev_alex'],
        joinedDate: new Date('2026-01-20'),
        lastLogin: new Date(),
        loginHistory: [],
      },
      {
        name: 'Alex Developer',
        username: 'dev_alex',
        email: 'alex@kyrosocial.app',
        password: hashedPassword,
        bio: 'Backend architect. Node.js, Express, MongoDB. Open source contributor.',
        profilePicture: 'https://api.dicebear.com/9.x/initials/svg?seed=AD&backgroundColor=f59e0b&textColor=ffffff',
        coverPhoto: '',
        isVerified: true,
        authProvider: 'local',
        followers: ['reshmi_ray', 'sarah_codes'],
        following: ['reshmi_ray', 'sarah_codes', 'tech_niloy'],
        joinedDate: new Date('2026-02-01'),
        lastLogin: new Date(),
        loginHistory: [],
      },
      {
        name: 'Mike Torres',
        username: 'mike_torres',
        email: 'mike@kyrosocial.app',
        password: hashedPassword,
        bio: 'DevOps engineer. Cloud, CI/CD, and infrastructure as code.',
        profilePicture: 'https://api.dicebear.com/9.x/initials/svg?seed=MT&backgroundColor=6366f1&textColor=ffffff',
        coverPhoto: '',
        isVerified: true,
        authProvider: 'local',
        followers: ['reshmi_ray'],
        following: ['reshmi_ray', 'tech_niloy', 'sarah_codes'],
        joinedDate: new Date('2026-03-10'),
        lastLogin: new Date(),
        loginHistory: [],
      },
    ];

    const insertedUsers = await db.collection('users').insertMany(usersToInsert);
    const userIds = Object.values(insertedUsers.insertedIds);
    console.log(`Inserted ${userIds.length} users.`);

    // Map usernames to ObjectIds for posts
    const userMap = {};
    usersToInsert.forEach((u, i) => {
      userMap[u.username] = userIds[i];
    });

    // ─── POSTS ───────────────────────────────────────────────
    const now = Date.now();
    const HOUR = 3600000;
    const DAY = 86400000;

    const postsToInsert = [
      {
        author: userMap['reshmi_ray'],
        authorUsername: 'reshmi_ray',
        authorName: 'Reshmi Ray Karmakar',
        authorAvatar: 'https://api.dicebear.com/9.x/initials/svg?seed=RR&backgroundColor=ff6154&textColor=ffffff',
        content: 'Just launched Kyro Social! Excited to build a platform where developers can truly connect. Built with React, Node.js, and MongoDB. Let me know what features you want to see next!',
        image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&auto=format&fit=crop&q=80',
        likes: [
          { userId: userMap['tech_niloy'], username: 'tech_niloy', likedAt: new Date(now - 2 * HOUR) },
          { userId: userMap['sarah_codes'], username: 'sarah_codes', likedAt: new Date(now - 1 * HOUR) },
          { userId: userMap['dev_alex'], username: 'dev_alex', likedAt: new Date(now - 30 * 60000) },
          { userId: userMap['mike_torres'], username: 'mike_torres', likedAt: new Date(now - 15 * 60000) },
        ],
        likeCount: 4,
        comments: [
          {
            userId: userMap['sarah_codes'],
            username: 'sarah_codes',
            userName: 'Sarah Chen',
            userAvatar: 'https://api.dicebear.com/9.x/initials/svg?seed=SC&backgroundColor=10b981&textColor=ffffff',
            text: 'This looks amazing! The UI feels so polished. Great work!',
            createdAt: new Date(now - 3 * HOUR),
          },
          {
            userId: userMap['tech_niloy'],
            username: 'tech_niloy',
            userName: 'Niloy Mallik',
            userAvatar: 'https://api.dicebear.com/9.x/initials/svg?seed=NM&backgroundColor=2d3142&textColor=ffffff',
            text: 'The animations are so smooth. Love the attention to detail!',
            createdAt: new Date(now - 2 * HOUR),
          },
          {
            userId: userMap['dev_alex'],
            username: 'dev_alex',
            userName: 'Alex Developer',
            userAvatar: 'https://api.dicebear.com/9.x/initials/svg?seed=AD&backgroundColor=f59e0b&textColor=ffffff',
            text: 'Would love to see dark mode support in the next update.',
            createdAt: new Date(now - 1 * HOUR),
          },
        ],
        commentCount: 3,
        interactedUsers: ['tech_niloy', 'sarah_codes', 'dev_alex', 'mike_torres'],
        createdAt: new Date(now - 4 * HOUR),
        updatedAt: new Date(now - 4 * HOUR),
      },
      {
        author: userMap['tech_niloy'],
        authorUsername: 'tech_niloy',
        authorName: 'Niloy Mallik',
        authorAvatar: 'https://api.dicebear.com/9.x/initials/svg?seed=NM&backgroundColor=2d3142&textColor=ffffff',
        content: 'Working on some exciting full-stack projects lately. The developer community is incredible -- always inspiring to see what people are building!\n\nWhat are you all working on this week? Drop your projects below!',
        image: '',
        likes: [
          { userId: userMap['reshmi_ray'], username: 'reshmi_ray', likedAt: new Date(now - 6 * HOUR) },
          { userId: userMap['sarah_codes'], username: 'sarah_codes', likedAt: new Date(now - 5 * HOUR) },
        ],
        likeCount: 2,
        comments: [
          {
            userId: userMap['reshmi_ray'],
            username: 'reshmi_ray',
            userName: 'Reshmi Ray Karmakar',
            userAvatar: 'https://api.dicebear.com/9.x/initials/svg?seed=RR&backgroundColor=ff6154&textColor=ffffff',
            text: 'Building Kyro Social! You should definitely try it out.',
            createdAt: new Date(now - 5 * HOUR),
          },
        ],
        commentCount: 1,
        interactedUsers: ['reshmi_ray', 'sarah_codes'],
        createdAt: new Date(now - 8 * HOUR),
        updatedAt: new Date(now - 8 * HOUR),
      },
      {
        author: userMap['sarah_codes'],
        authorUsername: 'sarah_codes',
        authorName: 'Sarah Chen',
        authorAvatar: 'https://api.dicebear.com/9.x/initials/svg?seed=SC&backgroundColor=10b981&textColor=ffffff',
        content: 'Beautiful sunset from my workspace today. Sometimes the best inspiration comes when you step away from the code for a moment and just breathe.',
        image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
        likes: [
          { userId: userMap['reshmi_ray'], username: 'reshmi_ray', likedAt: new Date(now - 10 * HOUR) },
          { userId: userMap['tech_niloy'], username: 'tech_niloy', likedAt: new Date(now - 9 * HOUR) },
          { userId: userMap['dev_alex'], username: 'dev_alex', likedAt: new Date(now - 8 * HOUR) },
          { userId: userMap['mike_torres'], username: 'mike_torres', likedAt: new Date(now - 7 * HOUR) },
        ],
        likeCount: 4,
        comments: [
          {
            userId: userMap['mike_torres'],
            username: 'mike_torres',
            userName: 'Mike Torres',
            userAvatar: 'https://api.dicebear.com/9.x/initials/svg?seed=MT&backgroundColor=6366f1&textColor=ffffff',
            text: 'Absolutely stunning view! Nature is the best debugger.',
            createdAt: new Date(now - 9 * HOUR),
          },
          {
            userId: userMap['reshmi_ray'],
            username: 'reshmi_ray',
            userName: 'Reshmi Ray Karmakar',
            userAvatar: 'https://api.dicebear.com/9.x/initials/svg?seed=RR&backgroundColor=ff6154&textColor=ffffff',
            text: 'Wish my workspace had a view like that!',
            createdAt: new Date(now - 8 * HOUR),
          },
        ],
        commentCount: 2,
        interactedUsers: ['reshmi_ray', 'tech_niloy', 'dev_alex', 'mike_torres'],
        createdAt: new Date(now - 12 * HOUR),
        updatedAt: new Date(now - 12 * HOUR),
      },
      {
        author: userMap['dev_alex'],
        authorUsername: 'dev_alex',
        authorName: 'Alex Developer',
        authorAvatar: 'https://api.dicebear.com/9.x/initials/svg?seed=AD&backgroundColor=f59e0b&textColor=ffffff',
        content: 'Pro tip for backend developers: Always write your API error handlers first. It saves hours of debugging time later.\n\nHere is the pattern I use for every Express controller:\n\n1. Validate input early\n2. Try the core operation\n3. Catch and format errors consistently\n4. Send uniform response shapes\n\nThis single habit has saved me countless hours over the years.',
        image: '',
        likes: [
          { userId: userMap['sarah_codes'], username: 'sarah_codes', likedAt: new Date(now - 1 * DAY) },
          { userId: userMap['reshmi_ray'], username: 'reshmi_ray', likedAt: new Date(now - 20 * HOUR) },
          { userId: userMap['tech_niloy'], username: 'tech_niloy', likedAt: new Date(now - 18 * HOUR) },
        ],
        likeCount: 3,
        comments: [
          {
            userId: userMap['mike_torres'],
            username: 'mike_torres',
            userName: 'Mike Torres',
            userAvatar: 'https://api.dicebear.com/9.x/initials/svg?seed=MT&backgroundColor=6366f1&textColor=ffffff',
            text: 'Great advice! I also add request logging middleware for every route. Makes debugging in production so much easier.',
            createdAt: new Date(now - 22 * HOUR),
          },
          {
            userId: userMap['reshmi_ray'],
            username: 'reshmi_ray',
            userName: 'Reshmi Ray Karmakar',
            userAvatar: 'https://api.dicebear.com/9.x/initials/svg?seed=RR&backgroundColor=ff6154&textColor=ffffff',
            text: 'Using try-catch wrappers with a custom AppError class changed my life.',
            createdAt: new Date(now - 20 * HOUR),
          },
        ],
        commentCount: 2,
        interactedUsers: ['sarah_codes', 'reshmi_ray', 'tech_niloy', 'mike_torres'],
        createdAt: new Date(now - 1 * DAY),
        updatedAt: new Date(now - 1 * DAY),
      },
      {
        author: userMap['mike_torres'],
        authorUsername: 'mike_torres',
        authorName: 'Mike Torres',
        authorAvatar: 'https://api.dicebear.com/9.x/initials/svg?seed=MT&backgroundColor=6366f1&textColor=ffffff',
        content: 'Just deployed my portfolio site using Vercel. The DX is unmatched -- push to main and it is live in seconds. Highly recommend it for any frontend project!',
        image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80',
        likes: [
          { userId: userMap['reshmi_ray'], username: 'reshmi_ray', likedAt: new Date(now - 2 * DAY) },
        ],
        likeCount: 1,
        comments: [],
        commentCount: 0,
        interactedUsers: ['reshmi_ray'],
        createdAt: new Date(now - 2 * DAY),
        updatedAt: new Date(now - 2 * DAY),
      },
      {
        author: userMap['reshmi_ray'],
        authorUsername: 'reshmi_ray',
        authorName: 'Reshmi Ray Karmakar',
        authorAvatar: 'https://api.dicebear.com/9.x/initials/svg?seed=RR&backgroundColor=ff6154&textColor=ffffff',
        content: 'Design tip: Never underestimate the power of whitespace. A clean layout with proper spacing always beats a cramped, feature-heavy interface.\n\nThe best apps feel like they have room to breathe.',
        image: '',
        likes: [
          { userId: userMap['sarah_codes'], username: 'sarah_codes', likedAt: new Date(now - 2.5 * DAY) },
          { userId: userMap['dev_alex'], username: 'dev_alex', likedAt: new Date(now - 2.3 * DAY) },
          { userId: userMap['tech_niloy'], username: 'tech_niloy', likedAt: new Date(now - 2.2 * DAY) },
          { userId: userMap['mike_torres'], username: 'mike_torres', likedAt: new Date(now - 2.1 * DAY) },
        ],
        likeCount: 4,
        comments: [
          {
            userId: userMap['sarah_codes'],
            username: 'sarah_codes',
            userName: 'Sarah Chen',
            userAvatar: 'https://api.dicebear.com/9.x/initials/svg?seed=SC&backgroundColor=10b981&textColor=ffffff',
            text: 'This is so true! Whitespace is a feature, not a bug.',
            createdAt: new Date(now - 2.4 * DAY),
          },
        ],
        commentCount: 1,
        interactedUsers: ['sarah_codes', 'dev_alex', 'tech_niloy', 'mike_torres'],
        createdAt: new Date(now - 3 * DAY),
        updatedAt: new Date(now - 3 * DAY),
      },
      {
        author: userMap['tech_niloy'],
        authorUsername: 'tech_niloy',
        authorName: 'Niloy Mallik',
        authorAvatar: 'https://api.dicebear.com/9.x/initials/svg?seed=NM&backgroundColor=2d3142&textColor=ffffff',
        content: 'Just finished reading "Clean Code" by Robert C. Martin for the second time. Some key takeaways that are worth repeating:\n\n- Functions should do one thing\n- Meaningful variable names save hours\n- Comments should explain WHY, not WHAT\n- Tests are not optional\n\nHighly recommend for every developer.',
        image: '',
        likes: [
          { userId: userMap['dev_alex'], username: 'dev_alex', likedAt: new Date(now - 3.5 * DAY) },
          { userId: userMap['reshmi_ray'], username: 'reshmi_ray', likedAt: new Date(now - 3.2 * DAY) },
        ],
        likeCount: 2,
        comments: [
          {
            userId: userMap['dev_alex'],
            username: 'dev_alex',
            userName: 'Alex Developer',
            userAvatar: 'https://api.dicebear.com/9.x/initials/svg?seed=AD&backgroundColor=f59e0b&textColor=ffffff',
            text: 'The naming convention chapter alone is worth the entire book.',
            createdAt: new Date(now - 3.3 * DAY),
          },
        ],
        commentCount: 1,
        interactedUsers: ['dev_alex', 'reshmi_ray'],
        createdAt: new Date(now - 4 * DAY),
        updatedAt: new Date(now - 4 * DAY),
      },
      {
        author: userMap['sarah_codes'],
        authorUsername: 'sarah_codes',
        authorName: 'Sarah Chen',
        authorAvatar: 'https://api.dicebear.com/9.x/initials/svg?seed=SC&backgroundColor=10b981&textColor=ffffff',
        content: 'Spent the morning refactoring a legacy component from a class component to hooks. The result? 60% less code, 100% more readable.\n\nReact hooks truly changed the game.',
        image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
        likes: [
          { userId: userMap['reshmi_ray'], username: 'reshmi_ray', likedAt: new Date(now - 4.5 * DAY) },
          { userId: userMap['tech_niloy'], username: 'tech_niloy', likedAt: new Date(now - 4.2 * DAY) },
          { userId: userMap['mike_torres'], username: 'mike_torres', likedAt: new Date(now - 4.1 * DAY) },
        ],
        likeCount: 3,
        comments: [],
        commentCount: 0,
        interactedUsers: ['reshmi_ray', 'tech_niloy', 'mike_torres'],
        createdAt: new Date(now - 5 * DAY),
        updatedAt: new Date(now - 5 * DAY),
      },
    ];

    await db.collection('posts').insertMany(postsToInsert);
    console.log(`Inserted ${postsToInsert.length} posts.`);

    console.log('\n--- Seed Complete ---');
    console.log('Demo accounts (password for all: Demo@123):');
    console.log('  reshmi_ray  / reshmi@kyrosocial.app');
    console.log('  tech_niloy  / niloy@kyrosocial.app');
    console.log('  sarah_codes / sarah@kyrosocial.app');
    console.log('  dev_alex    / alex@kyrosocial.app');
    console.log('  mike_torres / mike@kyrosocial.app');
    console.log('---');

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
