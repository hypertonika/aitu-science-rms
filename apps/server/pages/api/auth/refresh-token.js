const jwt = require('jsonwebtoken');
const { User } = require('../../../models/index');

module.exports = async function handler(req, res) {
  // console.log('Request received: ', req.method, req.url); // Лог метода и URL запроса

  if (req.method !== 'POST') {
    // console.log('Invalid method:', req.method); // Лог неверного метода
    return res.status(405).json({ message: 'Метод не разрешен' });
  }

  const { refreshToken } = req.body;

  if (!refreshToken) {
    // console.log('Refresh Token not provided in the request body'); // Лог отсутствия токена
    return res.status(400).json({ message: 'Отсутствует Refresh Token' });
  }

  try {
    // console.log('Verifying Refresh Token:', refreshToken); // Лог проверяемого токена

    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'defaultRefreshSecret';

    const decoded = jwt.verify(refreshToken, refreshSecret);
    // console.log('Decoded Refresh Token:', decoded); // Лог расшифрованного токена

    const iin = decoded.iin;
    // console.log('Extracted IIN from token:', iin); // Лог извлечённого ИИН

    const user = await User.findOne({ iin });
    if (!user) {
      // console.log('User not found for IIN:', iin); // Лог, если пользователь не найден
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // console.log('User found:', user); // Лог найденного пользователя

    const accessToken = jwt.sign(
      { iin: user.iin, role: user.role },
      process.env.JWT_SECRET || 'defaultSecretKey',
      { expiresIn: '1h' }
    );

    // console.log('Generated Access Token:', accessToken); // Лог сгенерированного токена

    res.status(200).json({ success: true, accessToken });
  } catch (error) {
    console.error('Ошибка при обновлении токена:', error.message); // Лог ошибки
    res.status(403).json({ message: 'Недействительный Refresh Token' });
  }
};