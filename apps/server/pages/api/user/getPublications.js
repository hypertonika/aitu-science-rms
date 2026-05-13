const Publication = require("../../../models/Publication");
const { verifyToken } = require("../../../middleware/auth");
const { buildPublicationFilters } = require("../../../services/publicationUtils");

module.exports = async function handler(req, res) {
  try {
    verifyToken(req, res, async () => {
      const { school } = req.query;
      const targetIin = req.user.role === "admin" && req.query.iin ? req.query.iin : req.user.iin;
      const filter = {
        iin: targetIin,
        ...buildPublicationFilters(req.query),
      };

      const userFilter = {};
      if (school) {
        userFilter.higherSchool = school;
      }

      const publications = await Publication.find(filter)
        .populate({
          path: "userId",
          match: userFilter,
        })
        .sort({ updatedAt: -1, year: -1 })
        .exec();

      if (Object.keys(userFilter).length > 0) {
        return res.status(200).json(publications.filter((pub) => pub.userId));
      }

      return res.status(200).json(publications);
    });
  } catch (error) {
    console.error("Publication fetch failed:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
