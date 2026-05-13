// const { User } = require('../../../models'); // Импортируем модель User
// const jwt = require('jsonwebtoken');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// // Настройка multer для сохранения файлов
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadPath = path.join(process.cwd(), 'public/uploads');
//     if (!fs.existsSync(uploadPath)) {
//       fs.mkdirSync(uploadPath, { recursive: true });
//     }
//     cb(null, uploadPath);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
//   },
// });

// const upload = multer({ storage });

// module.exports = async function handler(req, res) {
//   // console.log('Запрос на загрузку фотографии получен');

//   if (req.method !== 'POST') {
//     return res.status(405).json({ message: 'Метод не разрешен' });
//   }

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

//     // console.log('Токен успешно верифицирован. ИИН:', iin);

//     // Используем multer для обработки загрузки файла
//     upload.single('profilePhoto')(req, res, async (err) => {
//       if (err) {
//         console.error('Ошибка при загрузке файла:', err);
//         return res.status(500).json({ message: 'Ошибка при загрузке фотографии' });
//       }

//       if (!req.file) {
//         console.error('Файл не был загружен');
//         return res.status(400).json({ message: 'Файл не был загружен' });
//       }

//       console.log('Файл успешно загружен:', req.file.filename);
//       const filePath = `/uploads/${req.file.filename}`;

//       // Найти пользователя и обновить URL фотографии
//       const user = await User.findOne({ iin });
//       if (!user) {
//         console.error('Пользователь не найден');
//         return res.status(404).json({ message: 'Пользователь не найден' });
//       }

//       user.profilePhoto = filePath;
//       await user.save();

//       // console.log('Фотография успешно сохранена в базе данных');
//       res.status(200).json({ message: 'Фотография успешно загружена', profilePhoto: filePath });
//     });
//   } catch (error) {
//     console.error('Ошибка при обработке запроса:', error);
//     res.status(500).json({ message: 'Произошла ошибка на сервере. Попробуйте позже.' });
//   }
// }

const express = require('express');
const { User } = require('../../../models'); // Импортируем модель User
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router(); // Используем Router() вместо Next.js API
const uploadPath = path.join(__dirname, '../../../public/uploads');

// Создаём папку, если её нет
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

// Настройка `multer` для сохранения файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadPath),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
});

const upload = multer({ storage });

// 🔥 Отключаем bodyParser в Next.js (только если используется Next.js API)
// export const config = { api: { bodyParser: false } };

// 🛠 API маршрут для загрузки фото
router.post('/uploadPhoto', upload.single('profilePhoto'), async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.error('Ошибка авторизации: токен отсутствует или некорректный');
            return res.status(401).json({ message: 'Отсутствует токен авторизации' });
        }

        const token = authHeader.split(' ')[1];
        const secretKey = process.env.JWT_SECRET || 'defaultSecretKey';
        const decoded = jwt.verify(token, secretKey);
        const iin = decoded.iin;

        // Проверяем, был ли загружен файл
        if (!req.file) {
            console.error('Файл не был загружен');
            return res.status(400).json({ message: 'Файл не был загружен' });
        }

        console.log('Файл успешно загружен:', req.file.filename);
        const filePath = `/uploads/${req.file.filename}`;

        // Найти пользователя и обновить URL фотографии
        const user = await User.findOne({ iin });
        if (!user) {
            console.error('Пользователь не найден');
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        user.profilePhoto = filePath;
        await user.save();

        console.log('Фотография успешно сохранена в базе данных');
        res.status(200).json({ message: 'Фотография успешно загружена', profilePhoto: filePath });

    } catch (error) {
        console.error('Ошибка при обработке запроса:', error);
        res.status(500).json({ message: 'Произошла ошибка на сервере. Попробуйте позже.' });
    }
});

// Подключаем этот `router` в `server.js`
module.exports = router;


// app.post('/api/user/uploadPhoto', upload.single('profilePhoto'), async (req, res) => {
//   console.log('Запрос на загрузку фотографии получен');

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

//     if (!req.file) {
//       console.error('Файл не был загружен');
//       return res.status(400).json({ message: 'Файл не был загружен' });
//     }

//     console.log('Файл успешно загружен:', req.file.filename);
//     const filePath = `/uploads/${req.file.filename}`;

//     const user = await User.findOne({ iin });
//     if (!user) {
//       console.error('Пользователь не найден');
//       return res.status(404).json({ message: 'Пользователь не найден' });
//     }

//     user.profilePhoto = filePath;
//     await user.save();

//     console.log('Фотография успешно сохранена в базе данных');
//     res.status(200).json({ message: 'Фотография успешно загружена', profilePhoto: filePath });
//   } catch (error) {
//     console.error('Ошибка при обработке запроса:', error);
//     res.status(500).json({ message: 'Произошла ошибка на сервере. Попробуйте позже.' });
//   }
// });