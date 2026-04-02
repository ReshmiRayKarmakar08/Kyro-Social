require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');

const User = require('./models/User');
const Post = require('./models/Post');

const seed = async () => {
  await connectDB();

  await Promise.all([User.deleteMany({}), Post.deleteMany({})]);

  const hashedPassword = await bcrypt.hash('Demo@123', 12);

  const users = await User.insertMany([
    {
      name: 'Reshmi Ray Karmakar',
      username: 'reshmi_ray',
      email: 'reshmi@kyrosocial.app',
      password: hashedPassword,
      profilePicture: 'https://api.dicebear.com/9.x/initials/svg?seed=RR',
      bio: 'Full-stack developer building Kyro Social.',
      isVerified: true,
    },
    {
      name: 'Niloy Mallik',
      username: 'tech_niloy',
      email: 'niloy@kyrosocial.app',
      password: hashedPassword,
      profilePicture: 'https://api.dicebear.com/9.x/initials/svg?seed=NM',
      bio: 'Node.js enthusiast.',
      isVerified: true,
    },
    {
      name: 'Sarah Chen',
      username: 'sarah_codes',
      email: 'sarah@kyrosocial.app',
      password: hashedPassword,
      profilePicture: 'https://api.dicebear.com/9.x/initials/svg?seed=SC',
      bio: 'Frontend engineer.',
      isVerified: true,
    },
  ]);

  const byUsername = Object.fromEntries(users.map((user) => [user.username, user]));

  await Post.insertMany([
    {
      author: byUsername.reshmi_ray._id,
      textContent: 'Just launched Kyro Social. Built with React, Express, and MongoDB Atlas.',
      imageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1000&auto=format&fit=crop&q=80',
      likes: ['tech_niloy', 'sarah_codes'],
      comments: [
        {
          username: 'tech_niloy',
          text: 'Congrats! This is clean work.',
          timestamp: new Date(),
        },
      ],
    },
    {
      author: byUsername.tech_niloy._id,
      textContent: 'What backend feature should we prioritize next: notifications or saved posts?',
      likes: ['reshmi_ray'],
      comments: [
        {
          username: 'sarah_codes',
          text: 'Notifications first would be great.',
          timestamp: new Date(),
        },
      ],
    },
    {
      author: byUsername.sarah_codes._id,
      textContent: 'Designing mobile-first feed interactions today.',
      imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1000&auto=format&fit=crop&q=80',
      likes: ['reshmi_ray', 'tech_niloy'],
      comments: [],
    },
  ]);

  console.log('Seed completed successfully');
  console.log('Demo login password for seeded users: Demo@123');

  await mongoose.connection.close();
};

seed().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
