const mongoose = require('mongoose');
const { User } = require('../../../models');
const { verifyToken } = require('../../../middleware/auth');

const allowedRoles = ['user', 'admin'];

module.exports = async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { id } = req.params;
  const role = String(req.body.role || '').trim();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user id' });
  }

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    await new Promise((resolve, reject) =>
      verifyToken(req, res, (err) => (err ? reject(err) : resolve()))
    );

    const requestingUser = await User.findById(req.user.id);
    if (!requestingUser || requestingUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (String(requestingUser._id) === id && role !== 'admin') {
      return res.status(400).json({ message: 'You cannot remove your own admin role' });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser.role === 'admin' && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'At least one admin account is required' });
      }
    }

    targetUser.role = role;
    targetUser.refreshToken = undefined;
    await targetUser.save();

    const user = targetUser.toObject();
    delete user.password;
    delete user.refreshToken;
    delete user.passwordResetTokenHash;
    delete user.passwordResetExpires;

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('User role update failed:', error);
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Server error' });
    }
  }
};
