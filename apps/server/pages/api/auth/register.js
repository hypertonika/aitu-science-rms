const bcrypt = require('bcryptjs');
const { User } = require('../../../models');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, fullName, password } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!fullName || !normalizedEmail || !password) {
    return res.status(400).json({ message: 'Full name, email and password are required' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ message: 'Use a valid email address' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must contain at least 8 characters' });
  }

  try {
    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { iin: normalizedEmail },
      ],
    });

    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      iin: normalizedEmail,
      email: normalizedEmail,
      fullName,
      password: hashedPassword,
      role: 'user',
    });

    await newUser.save();

    return res.status(201).json({ message: 'Account created successfully' });
  } catch (error) {
    console.error('Registration failed:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
