// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const { verifyToken, authenticateUser } = require('../middleware/auth');
// const Publication = require('../models/Publication');

// const router = express.Router();

// // Ограничения для загрузки файлов: только PDF и размер не более 5 МБ
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/uploads/publications/');
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
//   },
// });

// const fileFilter = (req, file, cb) => {
//   const ext = path.extname(file.originalname).toLowerCase();
//   if (ext !== '.pdf') {
//     return cb(new Error('Файл должен быть формата PDF'), false);
//   }
//   cb(null, true);
// };

// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
//   fileFilter: fileFilter,
// });

// router.get('/user/publications', verifyToken, authenticateUser, async (req, res) => {
//   try {
//     const iin = req.user.iin;
//     const publications = await Publication.find({ iin });

//     res.json(publications);
//   } catch (error) {
//     console.error('Ошибка при загрузке публикаций:', error);
//     res.status(500).json({ message: 'Ошибка при загрузке публикаций' });
//   }
// });

// router.post('/user/publications', verifyToken, authenticateUser, upload.single('file'), async (req, res) => {
//   try {
//     const iin = req.user.iin;
//     const { authors, title, year, output, doi, isbn, scopus, wos, publicationType } = req.body;

//     const newPublication = new Publication({
//       iin,
//       authors,
//       title,
//       year,
//       output,
//       doi,
//       isbn,
//       scopus: scopus || false,
//       wos: wos || false,
//       publicationType,
//       file: req.file ? `public/uploads/publications/${req.file.filename}` : null, // Если файл был загружен
//     });

//     const savedPublication = await newPublication.save();
//     res.status(201).json(savedPublication);
//   } catch (error) {
//     console.error('Ошибка при добавлении публикации:', error);
//     res.status(500).json({ message: 'Ошибка при добавлении публикации' });
//   }
// });

// module.exports = router;