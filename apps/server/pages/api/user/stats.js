const Publication = require("../../../models/Publication");
const { verifyToken, authenticateAdmin } = require("../../../middleware/auth");


const express = require("express");
const user = require("../admin/user");
const router = express.Router();



router.get("/", verifyToken, async (req, res) => {
  try {
    if (!Publication) {
      throw new Error("Модель Publication не определена.");
    }
    let publications = []
    if (req.user.role === 'admin') { // with admin
        publications = await Publication.find({ status: 'approved' });
    } else {
        publications = await Publication.find({ iin: req.user.iin, status: 'approved' });
    }
    const stats = {years: {}, types: {}}
    publications.forEach((pub) => {
        if (!stats.years[pub.year]) {
            stats.years[pub.year] = 0
        }
        if (!stats.types[pub.publicationType]) {
            stats.types[pub.publicationType] = 0
        }
        stats.years[pub.year] += 1
        stats.types[pub.publicationType] += 1
    })
    
    res.status(200).json(stats);
  } catch (error) {
    console.error("Ошибка при получении профиля пользователя:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

module.exports = router;
