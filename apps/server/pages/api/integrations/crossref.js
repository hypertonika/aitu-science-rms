const express = require("express");
const { getWorkByDoi } = require("../../../services/crossrefService");
const { normalizeDoi } = require("../../../services/publicationUtils");

const router = express.Router();

router.get("/work", async (req, res) => {
  const doi = normalizeDoi(req.query.doi);

  if (!doi) {
    return res.status(400).json({ message: "DOI is required" });
  }

  try {
    const publication = await getWorkByDoi(doi);
    return res.status(200).json(publication);
  } catch (error) {
    console.error("Crossref lookup failed:", error);
    return res
      .status(error.status || 502)
      .json({ message: "Could not fetch DOI metadata from Crossref" });
  }
});

module.exports = router;
