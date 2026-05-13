const mongoose = require("mongoose");

const publicationSchema = new mongoose.Schema(
  {
    iin: {
      type: String,
      required: true,
    },
    authors: {
      type: String,
      required: true,
    },
    authorsNormalized: {
      type: String,
      default: "",
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    titleNormalized: {
      type: String,
      default: "",
      index: true,
    },
    year: {
      type: String,
      required: true,
      index: true,
    },
    output: {
      type: String,
      default: "",
    },
    doi: {
      type: String,
      default: "",
    },
    doiNormalized: {
      type: String,
      default: "",
      index: true,
    },
    source: {
      type: String,
      enum: ["manual", "crossref"],
      default: "manual",
    },
    journal: {
      type: String,
      default: "",
    },
    citations: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "approved", "rejected"],
      default: "draft",
      index: true,
    },
    visibility: {
      type: String,
      enum: ["private", "institutional", "public"],
      default: "private",
      index: true,
    },
    reviewComment: {
      type: String,
      default: "",
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    scopus: {
      type: Boolean,
      default: false,
    },
    wos: {
      type: Boolean,
      default: false,
    },
    isbn: {
      type: String,
      default: "",
    },
    patentDoi: {
      type: String,
      default: "",
    },
    file: {
      type: String,
      default: "",
    },
    publicationType: {
      type: String,
      enum: ["scopus_wos", "koknvo", "conference", "articles", "books", "patents"],
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Publication = mongoose.model("Publication", publicationSchema);
module.exports = Publication;
