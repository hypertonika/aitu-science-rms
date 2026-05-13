const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { verifyToken, authenticateUser } = require("../../../middleware/auth");
const Publication = require("../../../models/Publication");
const {
  addNormalizedPublicationFields,
  buildPublicationFilters,
  findDuplicatePublication,
} = require("../../../services/publicationUtils");
const { sendCsv, sendPdf } = require("../../../services/exportUtils");

const router = express.Router();

const uploadDir = path.join(__dirname, "../../../public/uploads/publications");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/publications/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const allowedExtensions = new Set([".pdf", ".doc", ".docx"]);
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.has(extension)) {
      return cb(new Error("Only PDF/DOC/DOCX files are allowed"));
    }
    cb(null, true);
  },
}).fields([
  { name: "file", maxCount: 1 },
  { name: "authors", maxCount: 1 },
  { name: "title", maxCount: 1 },
  { name: "year", maxCount: 1 },
  { name: "output", maxCount: 1 },
  { name: "doi", maxCount: 1 },
  { name: "isbn", maxCount: 1 },
  { name: "patentDoi", maxCount: 1 },
  { name: "scopus", maxCount: 1 },
  { name: "wos", maxCount: 1 },
  { name: "publicationType", maxCount: 1 },
  { name: "visibility", maxCount: 1 },
  { name: "journal", maxCount: 1 },
  { name: "citations", maxCount: 1 },
  { name: "source", maxCount: 1 },
]);

router.get("/publications/export", verifyToken, authenticateUser, async (req, res) => {
  try {
    const format = req.query.format === "pdf" ? "pdf" : "csv";
    const filter = {
      iin: req.user.iin,
      status: "approved",
      ...buildPublicationFilters(req.query),
    };
    const publications = await Publication.find(filter).sort({ year: -1, title: 1 });

    if (format === "pdf") {
      return sendPdf(res, publications, "my_publications.pdf", "My Approved Publications");
    }
    return sendCsv(res, publications, "my_publications.csv");
  } catch (error) {
    console.error("User export failed:", error);
    return res.status(500).json({ message: "Export failed" });
  }
});

router.post("/upload", verifyToken, authenticateUser, (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    const data = flattenBody(req.body);
    const publicationData = addNormalizedPublicationFields({
      userId: req.user.id,
      iin: req.user.iin,
      authors: data.authors,
      title: data.title,
      year: data.year,
      output: data.output || data.journal || "",
      doi: data.doi || "",
      isbn: data.isbn || "",
      patentDoi: data.patentDoi || "",
      scopus: data.scopus === "true" || data.scopus === true,
      wos: data.wos === "true" || data.wos === true,
      publicationType: data.publicationType,
      visibility: data.visibility || "private",
      journal: data.journal || "",
      citations: Number(data.citations || 0),
      source: data.source === "crossref" ? "crossref" : "manual",
      status: "draft",
      file: req.files?.file?.[0]
        ? `public/uploads/publications/${req.files.file[0].filename}`
        : "",
    });

    if (!publicationData.authors || !publicationData.title || !publicationData.year || !publicationData.publicationType) {
      return res.status(400).json({ message: "Authors, title, year, and publication type are required." });
    }

    try {
      const duplicate = await findDuplicatePublication(publicationData);
      if (duplicate) {
        return res.status(409).json({
          message: "Duplicate publication found",
          duplicateId: duplicate._id,
        });
      }

      const savedPublication = await new Publication(publicationData).save();
      return res.status(201).json(savedPublication);
    } catch (error) {
      console.error("Publication save failed:", error);
      return res.status(500).json({ message: "Could not save publication." });
    }
  });
});

router.patch("/upload/:id/submit", verifyToken, authenticateUser, async (req, res) => {
  try {
    const publication = await Publication.findById(req.params.id);
    if (!publication) {
      return res.status(404).json({ message: "Publication not found" });
    }
    if (publication.iin !== req.user.iin) {
      return res.status(403).json({ message: "FORBIDDEN" });
    }
    if (!["draft", "rejected"].includes(publication.status)) {
      return res.status(400).json({ message: "Only draft or rejected publications can be submitted" });
    }

    publication.status = "submitted";
    publication.reviewComment = "";
    await publication.save();

    return res.status(200).json(publication);
  } catch (error) {
    console.error("Submit publication failed:", error);
    return res.status(500).json({ message: "Could not submit publication" });
  }
});

router.patch("/upload/:id", verifyToken, authenticateUser, (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("multipart/form-data")) {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      try {
        const updateData = await buildUpdateData(req, res);
        if (!updateData) return;

        const updated = await Publication.findByIdAndUpdate(req.params.id, updateData, {
          new: true,
          runValidators: true,
        });
        return res.json(updated);
      } catch (error) {
        console.error("Multipart publication update failed:", error);
        return res.status(500).json({ message: "Could not update publication" });
      }
    });
  } else {
    next();
  }
});

router.patch("/upload/:id", verifyToken, authenticateUser, async (req, res) => {
  try {
    const updateData = await buildUpdateData(req, res);
    if (!updateData) return;

    const updated = await Publication.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    return res.json(updated);
  } catch (error) {
    console.error("JSON publication update failed:", error);
    return res.status(500).json({ message: "Could not update publication" });
  }
});

async function buildUpdateData(req, res) {
  const publication = await Publication.findById(req.params.id);
  if (!publication) {
    res.status(404).json({ message: "Publication not found" });
    return null;
  }
  if (publication.iin !== req.user.iin) {
    res.status(403).json({ message: "FORBIDDEN" });
    return null;
  }
  if (publication.status === "approved") {
    res.status(400).json({ message: "Approved publications cannot be edited by users" });
    return null;
  }

  const data = flattenBody(req.body);
  const allowed = [
    "authors",
    "title",
    "year",
    "output",
    "doi",
    "isbn",
    "patentDoi",
    "publicationType",
    "visibility",
    "journal",
    "citations",
    "source",
  ];
  const updateData = {};

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      updateData[key] = data[key];
    }
  }

  if (Object.prototype.hasOwnProperty.call(data, "scopus")) {
    updateData.scopus = data.scopus === "true" || data.scopus === true;
  }
  if (Object.prototype.hasOwnProperty.call(data, "wos")) {
    updateData.wos = data.wos === "true" || data.wos === true;
  }
  if (Object.prototype.hasOwnProperty.call(updateData, "citations")) {
    updateData.citations = Number(updateData.citations || 0);
  }
  if (req.files?.file?.[0]) {
    updateData.file = `public/uploads/publications/${req.files.file[0].filename}`;
  }
  if (publication.status === "rejected") {
    updateData.status = "draft";
  }

  const normalized = addNormalizedPublicationFields({
    ...publication.toObject(),
    ...updateData,
  });
  Object.assign(updateData, {
    doiNormalized: normalized.doiNormalized || "",
    titleNormalized: normalized.titleNormalized || "",
    authorsNormalized: normalized.authorsNormalized || "",
  });

  const duplicate = await findDuplicatePublication({ ...publication.toObject(), ...updateData }, publication._id);
  if (duplicate) {
    res.status(409).json({
      message: "Duplicate publication found",
      duplicateId: duplicate._id,
    });
    return null;
  }

  return updateData;
}

function flattenBody(body = {}) {
  const result = {};
  for (const [key, value] of Object.entries(body)) {
    result[key] = Array.isArray(value) ? value[0] : value;
  }
  return result;
}

module.exports = router;
