const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");
const Publication = require("./models/Publication");
const { addNormalizedPublicationFields } = require("./services/publicationUtils");

// auth
const authLogin = require("./pages/api/auth/login");
const authRegister = require("./pages/api/auth/register");
const authRefreshToken = require("./pages/api/auth/refresh-token");
const authForgotPassword = require("./pages/api/auth/forgot-password");
const authResetPassword = require("./pages/api/auth/reset-password");

// admin
const adminCreate = require("./pages/api/admin/create");
const adminGenerateAllPublicationsReport = require("./pages/api/admin/generateAllPublicationsReport");
const adminGenerateUserReport = require("./pages/api/admin/generateUserReport");
const adminPublications = require("./pages/api/admin/publications");
const adminUser = require("./pages/api/admin/user");
const adminUsers = require("./pages/api/admin/users");
const adminUpdateUserRole = require("./pages/api/admin/updateUserRole");
const adminCalculateStatistics = require("./pages/api/admin/statistics");

// user
const userDownloadResumeDocx = require("./pages/api/user/downloadResumeDocx");
const userDownloadResumePdf = require("./pages/api/user/downloadResumePdf");
const userGenerateResume = require("./pages/api/user/generateResume");
const userProfile = require("./pages/api/user/profile");
const userPublications = require("./pages/api/user/getPublications");
const userUpdate = require("./pages/api/user/update");
const userChangePassword = require("./pages/api/user/changePassword");
const userUploadPhoto = require("./pages/api/user/uploadPhoto");
const userEditPublication = require("./pages/api/user/editPublication");
const stats = require("./pages/api/user/stats");
const crossrefIntegration = require("./pages/api/integrations/crossref");

// user/publications
const userPublicationsUpload = require("./pages/api/user/upload");

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("combined"));
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  process.env.LOCAL_ORIGIN,
  process.env.PRODUCTION_ORIGIN,
].filter(Boolean);
const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: ["Content-Type", "Authorization", "Origin", "Accept"],
  credentials: true,
};

app.use(cors(corsOptions));

// Import routes
app.use("/api/auth/login", authLogin);
app.use("/api/auth/register", authRegister);
app.use("/api/auth/refresh-token", authRefreshToken);
app.use("/api/auth/forgot-password", authForgotPassword);
app.use("/api/auth/reset-password", authResetPassword);

app.use("/api/integrations/crossref", crossrefIntegration);

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/admin/create", adminCreate);
app.use(
  "/api/admin/generateAllPublicationsReport",
  adminGenerateAllPublicationsReport
);
app.use("/api/admin/generateUserReport", adminGenerateUserReport);
app.use("/api/admin/publications", adminPublications);
app.use("/api/admin/user/:iin", adminUser);
app.use("/api/admin/users/:id/role", adminUpdateUserRole);
app.use("/api/admin/users", adminUsers);
app.use("/api/admin/statistics", adminCalculateStatistics);

app.use("/api/user/downloadResumeDocx", userDownloadResumeDocx);
app.use("/api/user/downloadResumePdf", userDownloadResumePdf);
app.use("/api/user/generateResume", userGenerateResume);
app.use("/api/user/profile", userProfile);
app.use("/api/user/getPublications", userPublications);
app.use("/api/user/update", userUpdate);
app.use("/api/user/changePassword", userChangePassword);
app.use("/api/user/uploadPhoto", userUploadPhoto);
app.use("/api/user/editPublication/:id", userEditPublication);
app.use("/api/user/stats", stats);

// app.use('/api/user/publications/upload', userPublicationsUpload);
app.use("/api/user", userPublicationsUpload);

const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB successfully");
    await backfillPublicationMvpFields();
  })
  .catch((error) => console.error("MongoDB connection error:", error));

async function backfillPublicationMvpFields() {
  const legacyPublications = await Publication.find({
    $or: [
      { status: { $exists: false } },
      { visibility: { $exists: false } },
      { titleNormalized: { $in: [null, ""] } },
    ],
  });

  for (const publication of legacyPublications) {
    const normalized = addNormalizedPublicationFields(publication.toObject());
    publication.status = publication.status || "approved";
    publication.visibility = publication.visibility || "institutional";
    publication.source = publication.source || "manual";
    publication.doiNormalized = normalized.doiNormalized || "";
    publication.titleNormalized = normalized.titleNormalized || "";
    publication.authorsNormalized = normalized.authorsNormalized || "";
    await publication.save();
  }

  if (legacyPublications.length > 0) {
    console.log(`Backfilled ${legacyPublications.length} legacy publications`);
  }
}

app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ message: "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

app.all("*", (req, res, next) => {
  // console.log("Request received:", req.method, req.url);
  next();
});

// const bcrypt = require('bcryptjs');
// bcrypt.hash('', 10).then(console.log);
