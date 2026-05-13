const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../../../models');
// const dbConnect = require('../../middleware/dbConnect');
// const corsMiddleware = require('../../middleware/corsMiddleware');

module.exports = async function handler(req, res) {
  // await corsMiddleware(req, res);
  // await dbConnect();
  // console.log("Request method:", req.method);
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Метод не разрешен' });
  }

  const { iin, password } = req.body;

  try {
    const user = await User.findOne({ iin });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Пользователь не найден' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Неверный пароль' });
    }

    const secretKey = process.env.JWT_SECRET || 'defaultSecretKey';
    const accessToken = jwt.sign(
      { iin: user.iin, role: user.role, id:user._id }, 
      secretKey, 
      { expiresIn: '1h' }
    );

    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'defaultRefreshSecret';
    const refreshToken = jwt.sign(
      { iin: user.iin }, 
      refreshSecret,
      { expiresIn: '7d' }
    );

    res.status(200).json({ success: true, accessToken, refreshToken });
  } catch (error) {
    console.error('Ошибка при авторизации пользователя:', error);
    res.status(500).json({ message: 'Произошла ошибка на сервере. Попробуйте позже.' });
  }
}

// app.post('/api/auth/login', async (req, res) => {
//   const { iin, password } = req.body;
//   console.log("Received a request at /api/auth/login");


//   try {
//     const user = await User.findOne({ iin });
//     if (!user) {
//       return res.status(401).json({ success: false, message: 'User not found' });
//     }

//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) {
//       return res.status(401).json({ success: false, message: 'Invalid password' });
//     }

//     const secretKey = process.env.JWT_SECRET || 'defaultSecretKey';
//     const accessToken = jwt.sign(
//       { iin: user.iin, role: user.role },
//       secretKey,
//       { expiresIn: '15m' }
//     );

//     const refreshSecret = process.env.JWT_REFRESH_SECRET || 'defaultRefreshSecret';
//     const refreshToken = jwt.sign(
//       { iin: user.iin },
//       refreshSecret,
//       { expiresIn: '7d' }
//     );

//     res.status(200).json({ success: true, accessToken, refreshToken });
//   } catch (error) {
//     console.error('Error during user login:', error);
//     res.status(500).json({ message: 'Server error. Please try again later.' });
//   }
// });