const Publication = require("../models/Publication");

const STATUS_VALUES = ["draft", "submitted", "approved", "rejected"];
const VISIBILITY_VALUES = ["private", "institutional", "public"];

function normalizeDoi(value) {
  if (!value) return "";
  return String(value)
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeYear(value) {
  return value ? String(value).trim() : "";
}

function addNormalizedPublicationFields(data) {
  const next = { ...data };

  if (Object.prototype.hasOwnProperty.call(next, "doi")) {
    next.doiNormalized = normalizeDoi(next.doi);
  }
  if (Object.prototype.hasOwnProperty.call(next, "title")) {
    next.titleNormalized = normalizeText(next.title);
  }
  if (Object.prototype.hasOwnProperty.call(next, "authors")) {
    next.authorsNormalized = normalizeText(next.authors);
  }
  if (Object.prototype.hasOwnProperty.call(next, "year")) {
    next.year = normalizeYear(next.year);
  }

  return next;
}

function buildPublicationFilters(query = {}) {
  const filter = {};
  const { publicationType, year, status, visibility, query: search } = query;

  if (publicationType) filter.publicationType = publicationType;
  if (year) filter.year = String(year);
  if (status && STATUS_VALUES.includes(status)) filter.status = status;
  if (visibility && VISIBILITY_VALUES.includes(visibility)) {
    filter.visibility = visibility;
  }
  if (search) {
    const regex = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [
      { title: regex },
      { authors: regex },
      { output: regex },
      { doi: regex },
      { journal: regex },
    ];
  }

  return filter;
}

async function findDuplicatePublication(data, excludeId = null) {
  const doiNormalized = normalizeDoi(data.doi || data.doiNormalized);
  const baseNotCurrent = excludeId ? { _id: { $ne: excludeId } } : {};

  if (doiNormalized) {
    const duplicateByDoi = await Publication.findOne({
      ...baseNotCurrent,
      doiNormalized,
    });
    if (duplicateByDoi) return duplicateByDoi;
  }

  const titleKey = normalizeText(data.title || data.titleNormalized);
  const authorsKey = normalizeText(data.authors || data.authorsNormalized);
  const year = normalizeYear(data.year);

  if (!titleKey || !authorsKey || !year) return null;

  const candidates = await Publication.find({
    ...baseNotCurrent,
    year,
    $or: [
      { titleNormalized: titleKey },
      { title: new RegExp(`^${escapeRegExp(String(data.title || "").trim())}$`, "i") },
    ],
  });

  return (
    candidates.find((pub) => {
      const sameTitle = normalizeText(pub.titleNormalized || pub.title) === titleKey;
      const sameAuthors = normalizeText(pub.authorsNormalized || pub.authors) === authorsKey;
      return sameTitle && sameAuthors;
    }) || null
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  STATUS_VALUES,
  VISIBILITY_VALUES,
  addNormalizedPublicationFields,
  buildPublicationFilters,
  findDuplicatePublication,
  normalizeDoi,
  normalizeText,
};
