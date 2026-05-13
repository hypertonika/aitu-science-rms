const bcrypt = require('bcryptjs');
const { User } = require('../../../models');

module.exports = async function handler(req, res) {
  // await corsMiddleware(req, res);
  // await dbConnect();
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Метод не разрешен' });
  }

  const { iin, password, role = 'user' } = req.body;

  // Проверка наличия обязательных данных
  if (!iin || !password) {
    return res.status(400).json({ message: 'IIN и пароль обязательны' });
  }
  
  try {
    const existingUser = await User.findOne({ iin });
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь с таким ИИН уже зарегистрирован' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ iin, password: hashedPassword, role });
    await newUser.save();

    res.status(201).json({ message: 'Пользователь успешно зарегистрирован' });
  } catch (error) {
    console.error('Ошибка при регистрации пользователя:', error);
    res.status(500).json({ message: 'Произошла ошибка на сервере. Попробуйте позже.' });
  }
}

// app.post('/api/auth/register', async (req, res) => {
//   const { iin, password } = req.body;

//   try {
//     const existingUser = await User.findOne({ iin });
//     if (existingUser) {
//       return res.status(400).json({ message: 'User with this IIN already registered' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const newUser = new User({ iin, password: hashedPassword });
//     await newUser.save();

//     res.status(201).json({ message: 'User registered successfully' });
//   } catch (error) {
//     console.error('Error during user registration:', error);
//     res.status(500).json({ message: 'Server error. Please try again later.' });
//   }
// });