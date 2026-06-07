const jwt = require('jsonwebtoken');
const { User } = require('../models');

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authorization token is missing' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'defaultSecretKey');
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
}

async function getCurrentUser(req) {
  if (req.currentUser) {
    return req.currentUser;
  }

  const user = req.user?.id
    ? await User.findById(req.user.id)
    : await User.findOne({ iin: req.user?.iin });

  req.currentUser = user;

  if (user) {
    req.user.role = user.role;
    req.user.iin = user.iin;
    req.user.email = user.email;
    req.user.id = String(user._id);
  }

  return user;
}

function authenticateUser(req, res, next) {
  getCurrentUser(req)
    .then((user) => {
      if (!user || user.role !== 'user') {
        return res.status(403).json({ message: 'Access denied' });
      }
      return next();
    })
    .catch((error) => {
      console.error('User authorization failed:', error);
      return res.status(500).json({ message: 'Server error' });
    });
}

function authenticateAdmin(req, res, next) {
  getCurrentUser(req)
    .then((user) => {
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
      return next();
    })
    .catch((error) => {
      console.error('Admin authorization failed:', error);
      return res.status(500).json({ message: 'Server error' });
    });
}

module.exports = {
  verifyToken,
  authenticateUser,
  authenticateAdmin,
};
