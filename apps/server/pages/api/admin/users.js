const { User } = require('../../../models');
const { verifyToken } = require('../../../middleware/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await new Promise((resolve, reject) =>
      verifyToken(req, res, (err) => (err ? reject(err) : resolve()))
    );

    const requestingUser = await User.findById(req.user.id);
    if (!requestingUser || requestingUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const users = await User.find({})
      .select('-password -refreshToken -passwordResetTokenHash -passwordResetExpires')
      .sort({ role: 1, fullName: 1, email: 1 });

    return res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('Users loading failed:', error);
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Server error' });
    }
  }
};
