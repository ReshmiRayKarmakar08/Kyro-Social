const express = require('express');
const User = require('../models/User');
const { optionalProtect } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalProtect, async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 10, 30));

    if (!q) {
      return res.status(200).json({ users: [] });
    }

    const regex = new RegExp(q, 'i');
    const users = await User.find({
      $or: [{ name: regex }, { username: regex }],
    })
      .select('name username profilePicture bio isVerified')
      .limit(limit);

    return res.status(200).json({ users });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
