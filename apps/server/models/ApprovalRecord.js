const mongoose = require("mongoose");

const approvalRecordSchema = new mongoose.Schema(
  {
    publicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Publication",
      required: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    adminIin: {
      type: String,
    },
    fromStatus: {
      type: String,
      enum: ["draft", "submitted", "approved", "rejected"],
    },
    toStatus: {
      type: String,
      enum: ["draft", "submitted", "approved", "rejected"],
      required: true,
    },
    comment: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ApprovalRecord", approvalRecordSchema);
