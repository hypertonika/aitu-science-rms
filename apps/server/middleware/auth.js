const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  console.log('verifyToken вызван');
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Нет токена, авторизация отклонена' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultSecretKey');
    req.user = decoded; // Добавляем декодированного пользователя в запрос
    return next(); // Переход к следующему middleware
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Токен истек', error });
    }
    return res.status(401).json({ message: 'Неверный токен' });
  }
}

// Аутентификация обычного пользователя
function authenticateUser(req, res, next) {
  console.log('authenticateUser вызван');

  if (!req.user || req.user.role !== 'user') {
    return res.status(403).json({ message: 'Доступ запрещен' });
  }
  return next(); // Переход к следующему middleware
}

// Аутентификация администратора
function authenticateAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Доступ запрещен' });
  }
  return next(); // Переход к следующему middleware
}

module.exports = {
  verifyToken,
  authenticateUser,
  authenticateAdmin,
};