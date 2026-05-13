// const express = require('express');
// const { verifyToken, authenticateAdmin } = require('../middleware/auth');
// const Publication = require('../models/Publication');

// const router = express.Router();

// router.get('/admin/publications', verifyToken, authenticateAdmin, async (req, res) => {
//   try {
//     const publications = await Publication.find();
//     res.json(publications);
//   } catch (error) {
//     console.error('Ошибка при загрузке всех публикаций:', error);
//     res.status(500).json({ message: 'Ошибка при загрузке всех публикаций' });
//   }
// });

// module.exports = router;