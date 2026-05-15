const express = require("express");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const { verifyToken } = require("../../../middleware/auth");
const { User } = require("../../../models");

const router = express.Router();
const uploadPath = path.join(__dirname, "../../../public/uploads");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

router.post("/", verifyToken, upload.single("profilePhoto"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File was not uploaded" });
    }

    const user = await User.findOne({ iin: req.user.iin });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const filePath = `/uploads/${req.file.filename}`;
    user.profilePhoto = filePath;
    await user.save();

    return res.status(200).json({
      message: "Profile photo uploaded successfully",
      profilePhoto: filePath,
    });
  } catch (error) {
    console.error("Profile photo upload failed:", error);
    return res.status(500).json({ message: "Could not upload profile photo" });
  }
});

module.exports = router;
