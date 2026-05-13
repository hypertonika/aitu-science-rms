const { User } = require('../../../models');
const jwt = require('jsonwebtoken');

module.exports = async function handler(req, res) {
  // await corsMiddleware(req, res);
  // await dbConnect();
  
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Ошибка авторизации: токен отсутствует или некорректный');
      return res.status(401).json({ message: 'Отсутствует токен авторизации' });
    }
  
    const token = authHeader.split(' ')[1];
  
    try {
      const secretKey = process.env.JWT_SECRET || 'defaultSecretKey';
      const decoded = jwt.verify(token, secretKey);
      const iin = decoded.iin;
  
      // console.log('Токен успешно верифицирован. ИИН:', iin);
  
      const user = await User.findOne({ iin }).select('-password');
      if (!user) {
        console.error('Пользователь не найден');
        return res.status(404).json({ message: 'Пользователь не найден' });
      }
  
      // console.log('Данные пользователя найдены:', user);
      res.status(200).json(user);
    } catch (error) {
      console.error('Ошибка при получении данных пользователя:', error);
      res.status(500).json({ message: 'Произошла ошибка на сервере. Попробуйте позже.' });
    }
}


// app.get('/api/user/profile', async (req, res) => {
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       console.error('Ошибка авторизации: токен отсутствует или некорректный');
//       return res.status(401).json({ message: 'Отсутствует токен авторизации' });
//     }
  
//     const token = authHeader.split(' ')[1];
  
//     try {
//       const secretKey = process.env.JWT_SECRET || 'defaultSecretKey';
//       const decoded = jwt.verify(token, secretKey);
//       const iin = decoded.iin;
  
//       console.log('Токен успешно верифицирован. ИИН:', iin);
  
//       const user = await User.findOne({ iin }).select('-password');
//       if (!user) {
//         console.error('Пользователь не найден');
//         return res.status(404).json({ message: 'Пользователь не найден' });
//       }
  
//       console.log('Данные пользователя найдены:', user);
//       res.status(200).json(user);
//     } catch (error) {
//       console.error('Ошибка при получении данных пользователя:', error);
//       res.status(500).json({ message: 'Произошла ошибка на сервере. Попробуйте позже.' });
//     }
//   });