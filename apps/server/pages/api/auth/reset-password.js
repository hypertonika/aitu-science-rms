const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User } = require('../../../models');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const token = String(req.body.token || '').trim();
  const password = String(req.body.password || '');

  if (!token || !password) {
    return res.status(400).json({ message: 'Reset token and new password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must contain at least 8 characters' });
  }

  try {
    const user = await User.findOne({
      passwordResetTokenHash: hashToken(token),
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Password reset link is invalid or expired' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.refreshToken = undefined;
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password reset failed:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
