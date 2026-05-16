const jwt = require('jsonwebtoken');

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

function authenticateUser(req, res, next) {
  if (!req.user || req.user.role !== 'user') {
    return res.status(403).json({ message: 'Access denied' });
  }
  return next();
}

function authenticateAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  return next();
}

module.exports = {
  verifyToken,
  authenticateUser,
  authenticateAdmin,
};
