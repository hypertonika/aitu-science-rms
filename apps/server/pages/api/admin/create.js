const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../../../models');

module.exports = async function handler(req, res) {
  // await corsMiddleware(req, res);
  // await dbConnect();

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { iin, password } = req.body;

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

    const existingUser = await User.findOne({ iin });
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь с таким ИИН уже зарегистрирован' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new User({ iin, password: hashedPassword, role: 'admin' });
    await newAdmin.save();

    res.status(201).json({ message: 'Администратор успешно создан' });
  } catch (error) {
    console.error('Ошибка при создании администратора:', error);
    res.status(500).json({ message: 'Произошла ошибка на сервере. Попробуйте позже.' });
  }
}

// app.post('/api/admin/create', async (req, res) => {
//     const { iin, password } = req.body;
  
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
  
//       const existingUser = await User.findOne({ iin });
//       if (existingUser) {
//         return res.status(400).json({ message: 'Пользователь с таким ИИН уже зарегистрирован' });
//       }
  
//       const hashedPassword = await bcrypt.hash(password, 10);
//       const newAdmin = new User({ iin, password: hashedPassword, role: 'admin' });
//       await newAdmin.save();
  
//       res.status(201).json({ message: 'Администратор успешно создан' });
//     } catch (error) {
//       console.error('Ошибка при создании администратора:', error);
//       res.status(500).json({ message: 'Произошла ошибка на сервере. Попробуйте позже.' });
//     }
//   });