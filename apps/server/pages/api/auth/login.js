const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../../../models');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, login, iin, password } = req.body;
  const identifier = String(email || login || iin || '').trim().toLowerCase();

  if (!identifier || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { iin: identifier },
      ],
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    const accessToken = jwt.sign(
      { iin: user.iin, email: user.email, role: user.role, id: user._id },
      process.env.JWT_SECRET || 'defaultSecretKey',
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { iin: user.iin, email: user.email },
      process.env.JWT_REFRESH_SECRET || 'defaultRefreshSecret',
      { expiresIn: '7d' }
    );

    user.refreshToken = refreshToken;
    await user.save();

    return res.status(200).json({ success: true, accessToken, refreshToken });
  } catch (error) {
    console.error('Login failed:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
