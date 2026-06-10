const express = require("express");
const jwt = require("jsonwebtoken");
const { verifyToken, authenticateUser } = require("../../../middleware/auth");
const { User } = require("../../../models");
const {
  buildOrcidAuthorizeUrl,
  exchangeOrcidAuthorizationCode,
  getWorksByOrcid,
  normalizeOrcidId,
} = require("../../../services/orcidService");
const { getWorksByWosId, normalizeWosId } = require("../../../services/wosService");
const { importPublicationDrafts } = require("../../../services/profilePublicationImport");

const router = express.Router();

router.post("/orcid/import", verifyToken, authenticateUser, async (req, res) => {
  try {
    const user = req.currentUser;
    const orcid = normalizeOrcidId(req.body.orcid || user.orcid);
    if (!orcid) {
      return res.status(400).json({ message: "Valid ORCID iD is required" });
    }

    const works = await getWorksByOrcid(orcid);
    const result = await importPublicationDrafts({ user, publications: works, source: "orcid" });

    user.orcid = orcid;
    user.orcidUrl = `https://orcid.org/${orcid}`;
    await user.save();

    return res.status(200).json({
      ...summarizeImportResult(result),
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("ORCID import failed:", error);
    return res.status(error.status || 500).json({ message: error.message || "Could not import ORCID works" });
  }
});

router.get("/orcid/authorize", verifyToken, authenticateUser, async (req, res) => {
  try {
    const redirectUri = getOrcidRedirectUri(req);
    const state = jwt.sign(
      {
        iin: req.user.iin,
        id: req.user.id,
      },
      getJwtSecret(),
      { expiresIn: "15m" }
    );
    const authorizationUrl = buildOrcidAuthorizeUrl({ state, redirectUri });

    return res.status(200).json({ authorizationUrl });
  } catch (error) {
    console.error("ORCID authorization URL failed:", error);
    return res.status(error.status || 500).json({ message: error.message || "Could not start ORCID authorization" });
  }
});

router.get("/orcid/callback", async (req, res) => {
  const frontendUrl = getFrontendUrl();

  try {
    if (req.query.error) {
      return redirectToDashboard(res, frontendUrl, { profileImportError: String(req.query.error) });
    }

    const code = String(req.query.code || "");
    const state = String(req.query.state || "");
    if (!code || !state) {
      return redirectToDashboard(res, frontendUrl, { profileImportError: "missing_orcid_code" });
    }

    const payload = jwt.verify(state, getJwtSecret());
    const user = payload.id ? await User.findById(payload.id) : await User.findOne({ iin: payload.iin });
    if (!user) {
      return redirectToDashboard(res, frontendUrl, { profileImportError: "user_not_found" });
    }

    const tokenData = await exchangeOrcidAuthorizationCode({
      code,
      redirectUri: getOrcidRedirectUri(req),
    });
    const orcid = normalizeOrcidId(tokenData.orcid);
    if (!orcid) {
      return redirectToDashboard(res, frontendUrl, { profileImportError: "orcid_not_returned" });
    }

    const works = await getWorksByOrcid(orcid, tokenData.access_token);
    const result = await importPublicationDrafts({ user, publications: works, source: "orcid" });

    user.orcid = orcid;
    user.orcidUrl = `https://orcid.org/${orcid}`;
    await user.save();

    return redirectToDashboard(res, frontendUrl, {
      profileImport: "orcid",
      imported: result.importedCount,
      skipped: result.skippedCount,
      total: result.total,
    });
  } catch (error) {
    console.error("ORCID callback failed:", error);
    return redirectToDashboard(res, frontendUrl, { profileImportError: "orcid_import_failed" });
  }
});

router.post("/wos/import", verifyToken, authenticateUser, async (req, res) => {
  try {
    const user = req.currentUser;
    const wosId = normalizeWosId(req.body.wosId || user.wosId);
    if (!wosId) {
      return res.status(400).json({ message: "Web of Science ResearcherID is required" });
    }

    const works = await getWorksByWosId(wosId);
    const result = await importPublicationDrafts({ user, publications: works, source: "wos" });

    user.wosId = wosId;
    user.wosUrl = `https://www.webofscience.com/wos/author/record/${encodeURIComponent(wosId)}`;
    await user.save();

    return res.status(200).json({
      ...summarizeImportResult(result),
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Web of Science import failed:", error);
    return res.status(error.status || 500).json({ message: error.message || "Could not import Web of Science works" });
  }
});

function summarizeImportResult(result) {
  return {
    total: result.total,
    importedCount: result.importedCount,
    skippedCount: result.skippedCount,
    skipped: result.skipped,
  };
}

function sanitizeUser(user) {
  const data = user.toObject();
  delete data.password;
  delete data.refreshToken;
  delete data.passwordResetTokenHash;
  delete data.passwordResetExpires;
  return data;
}

function getOrcidRedirectUri(req) {
  if (process.env.ORCID_REDIRECT_URI) {
    return process.env.ORCID_REDIRECT_URI;
  }

  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
  const host = req.headers["x-forwarded-host"] || req.get("host");
  return `${protocol}://${host}/api/integrations/research-profiles/orcid/callback`;
}

function getFrontendUrl() {
  return (process.env.FRONTEND_URL || process.env.LOCAL_ORIGIN || "http://localhost:5173").replace(/\/$/, "");
}

function redirectToDashboard(res, frontendUrl, params) {
  const search = new URLSearchParams(params);
  return res.redirect(`${frontendUrl}/dashboard?${search.toString()}`);
}

function getJwtSecret() {
  return process.env.JWT_SECRET || "defaultSecretKey";
}

module.exports = router;
