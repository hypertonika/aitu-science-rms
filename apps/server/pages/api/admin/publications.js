const express = require("express");
const Publication = require("../../../models/Publication");
const ApprovalRecord = require("../../../models/ApprovalRecord");
const { verifyToken, authenticateAdmin } = require("../../../middleware/auth");
const { buildPublicationFilters, findDuplicatePublication, addNormalizedPublicationFields } = require("../../../services/publicationUtils");
const { sendCsv, sendPdf } = require("../../../services/exportUtils");

const router = express.Router();

router.get("/export", verifyToken, authenticateAdmin, async (req, res) => {
  try {
    const format = req.query.format === "pdf" ? "pdf" : "csv";
    const filter = {
      status: "approved",
      ...buildPublicationFilters(req.query),
    };
    const userFilter = {};
    if (req.query.school) {
      userFilter.higherSchool = req.query.school;
    }
    const publications = await Publication.find(filter)
      .populate({ path: "userId", match: userFilter })
      .sort({ year: -1, title: 1 });
    const exportPublications = Object.keys(userFilter).length > 0
      ? publications.filter((pub) => pub.userId)
      : publications;

    if (format === "pdf") {
      return sendPdf(res, exportPublications, "approved_publications.pdf", "Approved Publications");
    }
    return sendCsv(res, exportPublications, "approved_publications.csv");
  } catch (error) {
    console.error("Admin export failed:", error);
    return res.status(500).json({ message: "Export failed" });
  }
});

router.get("/", verifyToken, authenticateAdmin, async (req, res) => {
  try {
    const { school } = req.query;
    const filter = buildPublicationFilters(req.query);
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
  } catch (error) {
    console.error("Admin publication fetch failed:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.patch("/:id/approve", verifyToken, authenticateAdmin, async (req, res) => {
  try {
    const publication = await Publication.findById(req.params.id);
    if (!publication) {
      return res.status(404).json({ message: "Publication not found" });
    }
    if (publication.status !== "submitted") {
      return res.status(400).json({ message: "Only submitted publications can be approved" });
    }

    await recordDecision(publication, req.user, "approved", req.body.comment || "");
    publication.status = "approved";
    publication.visibility = publication.visibility === "private" ? "institutional" : publication.visibility;
    publication.reviewComment = req.body.comment || "";
    publication.reviewedAt = new Date();
    publication.reviewedBy = req.user.id;
    await publication.save();

    return res.status(200).json(publication);
  } catch (error) {
    console.error("Approve publication failed:", error);
    return res.status(500).json({ message: "Could not approve publication" });
  }
});

router.patch("/:id/reject", verifyToken, authenticateAdmin, async (req, res) => {
  try {
    const publication = await Publication.findById(req.params.id);
    if (!publication) {
      return res.status(404).json({ message: "Publication not found" });
    }
    if (publication.status !== "submitted") {
      return res.status(400).json({ message: "Only submitted publications can be rejected" });
    }

    await recordDecision(publication, req.user, "rejected", req.body.comment || "");
    publication.status = "rejected";
    publication.reviewComment = req.body.comment || "";
    publication.reviewedAt = new Date();
    publication.reviewedBy = req.user.id;
    await publication.save();

    return res.status(200).json(publication);
  } catch (error) {
    console.error("Reject publication failed:", error);
    return res.status(500).json({ message: "Could not reject publication" });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const publication = await Publication.findById(req.params.id);
    if (!publication) {
      return res.status(404).json({ message: "Publication not found" });
    }
    if (publication.iin !== req.user.iin && req.user.role !== "admin") {
      return res.status(403).json({ message: "FORBIDDEN" });
    }

    await Publication.deleteOne({ _id: req.params.id });
    return res.status(200).json({ success: req.params.id });
  } catch (error) {
    console.error("Delete publication failed:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.patch("/:id", verifyToken, async (req, res) => {
  try {
    const publication = await Publication.findById(req.params.id);
    if (!publication) {
      return res.status(404).json({ message: "Publication not found" });
    }
    if (publication.iin !== req.user.iin && req.user.role !== "admin") {
      return res.status(403).json({ message: "FORBIDDEN" });
    }

    const updateObject = addNormalizedPublicationFields(req.body);
    const duplicate = await findDuplicatePublication(
      { ...publication.toObject(), ...updateObject },
      publication._id
    );
    if (duplicate) {
      return res.status(409).json({
        message: "Duplicate publication found",
        duplicateId: duplicate._id,
      });
    }

    await Publication.updateOne({ _id: req.params.id }, updateObject, { runValidators: true });
    return res.status(200).json({ success: req.params.id });
  } catch (error) {
    console.error("Update publication failed:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

async function recordDecision(publication, admin, toStatus, comment) {
  await ApprovalRecord.create({
    publicationId: publication._id,
    adminId: admin.id,
    adminIin: admin.iin,
    fromStatus: publication.status,
    toStatus,
    comment,
  });
}

module.exports = router;
