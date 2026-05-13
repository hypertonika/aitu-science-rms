const { User } = require('../../../models');
const jwt = require('jsonwebtoken');

module.exports = async function handler(req, res) {
  // await corsMiddleware(req, res);
  // await dbConnect();
  
  // console.log('Запрос на обновление информации получен');

  if (req.method !== 'PUT') {
    console.error('Метод не разрешен');
    return res.status(405).json({ message: 'Метод не разрешен' });
  }

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

    const user = await User.findOne({ iin });
    if (!user) {
      console.error('Пользователь не найден');
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const { fullName, scopusId, wosId, orcid, birthDate, phone, email, researchArea, higherSchool, profileVisibility } = req.body;
    // console.log('Данные для обновления:', req.body);

    user.fullName = fullName || user.fullName;
    user.scopusId = scopusId || user.scopusId;
    user.wosId = wosId || user.wosId;
    user.orcid = orcid || user.orcid;
    user.birthDate = birthDate || user.birthDate;
    user.phone = phone || user.phone;
    user.email = email || user.email;
    user.researchArea = researchArea || user.researchArea;
    user.higherSchool = higherSchool || user.higherSchool;
    if (['private', 'institutional', 'public'].includes(profileVisibility)) {
      user.profileVisibility = profileVisibility;
    }

    await user.save();

    console.log('Информация пользователя успешно обновлена');
    res.status(200).json({ message: 'Данные успешно обновлены' });
  } catch (error) {
    console.error('Ошибка при обновлении данных пользователя:', error);
    res.status(500).json({ message: 'Произошла ошибка на сервере. Попробуйте позже.' });
  }
}


// app.put('/api/user/update', async (req, res) => {
//   console.log('Запрос на обновление информации получен');

//   const authHeader = req.headers.authorization;
//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     console.error('Ошибка авторизации: токен отсутствует или некорректный');
//     return res.status(401).json({ message: 'Отсутствует токен авторизации' });
//   }

//   const token = authHeader.split(' ')[1];

//   try {
//     const secretKey = process.env.JWT_SECRET || 'defaultSecretKey';
//     const decoded = jwt.verify(token, secretKey);
//     const iin = decoded.iin;

//     console.log('Токен успешно верифицирован. ИИН:', iin);

//     const user = await User.findOne({ iin });
//     if (!user) {
//       console.error('Пользователь не найден');
//       return res.status(404).json({ message: 'Пользователь не найден' });
//     }

//     const { fullName, scopusId, wosId, orcid, birthDate, phone, email, researchArea, higherSchool } = req.body;
//     console.log('Данные для обновления:', req.body);

//     user.fullName = fullName || user.fullName;
//     user.scopusId = scopusId || user.scopusId;
//     user.wosId = wosId || user.wosId;
//     user.orcid = orcid || user.orcid;
//     user.birthDate = birthDate || user.birthDate;
//     user.phone = phone || user.phone;
//     user.email = email || user.email;
//     user.researchArea = researchArea || user.researchArea;
//     user.higherSchool = higherSchool || user.higherSchool;

//     await user.save();

//     console.log('Информация пользователя успешно обновлена');
//     res.status(200).json({ message: 'Данные успешно обновлены' });
//   } catch (error) {
//     console.error('Ошибка при обновлении данных пользователя:', error);
//     res.status(500).json({ message: 'Произошла ошибка на сервере. Попробуйте позже.' });
//   }
// });
