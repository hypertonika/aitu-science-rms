const jwt = require('jsonwebtoken');
const { User } = require('../../../models');

module.exports = async function handler(req, res) {
  // await corsMiddleware(req, res);
  // await dbConnect();
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Отсутствует токен авторизации' });
    }

    const token = authHeader.split(' ')[1];
    const secretKey = process.env.JWT_SECRET || 'defaultSecretKey';
    const decoded = jwt.verify(token, secretKey);

    const requestingUser = await User.findOne({ iin: decoded.iin });
    if (requestingUser.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    const users = await User.find({});
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('Ошибка при получении пользователей:', error);
    res.status(500).json({ message: 'Произошла ошибка на сервере. Попробуйте позже.' });
  }
}

// app.get('/api/admin/users', async (req, res) => {
//     try {
//       const authHeader = req.headers.authorization;
//       if (!authHeader || !authHeader.startsWith('Bearer ')) {
//         return res.status(401).json({ message: 'Отсутствует токен авторизации' });
//       }
  
//       const token = authHeader.split(' ')[1];
//       const secretKey = process.env.JWT_SECRET || 'defaultSecretKey';
//       const decoded = jwt.verify(token, secretKey);
  
//       const requestingUser = await User.findOne({ iin: decoded.iin });
//       if (requestingUser.role !== 'admin') {
//         return res.status(403).json({ message: 'Доступ запрещен' });
//       }
  
//       const users = await User.find({});
//       res.status(200).json({ success: true, users });
//     } catch (error) {
//       console.error('Ошибка при получении пользователей:', error);
//       res.status(500).json({ message: 'Произошла ошибка на сервере. Попробуйте позже.' });
//     }
//   });