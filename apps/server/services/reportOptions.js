const SORT_FIELDS = new Set(["year", "school", "teacher", "title", "type", "status", "updatedAt"]);
const GROUP_FIELDS = new Set(["none", "school", "year"]);

function buildReportOptions(source = {}, defaults = {}) {
  const sortBy = SORT_FIELDS.has(source.sortBy) ? source.sortBy : defaults.sortBy || "year";
  const sortDir = source.sortDir === "asc" || source.sortDir === "desc"
    ? source.sortDir
    : defaults.sortDir || defaultSortDirection(sortBy);
  const groupBy = GROUP_FIELDS.has(source.groupBy) ? source.groupBy : defaults.groupBy || "none";

  return { sortBy, sortDir, groupBy };
}

function sortPublicationsForReport(publications = [], options = {}) {
  const reportOptions = buildReportOptions(options);
  const criteria = [];

  if (reportOptions.groupBy === "school") {
    criteria.push(["school", reportOptions.sortBy === "school" ? reportOptions.sortDir : "asc"]);
  }
  if (reportOptions.groupBy === "year") {
    criteria.push(["year", reportOptions.sortBy === "year" ? reportOptions.sortDir : "desc"]);
  }

  criteria.push([reportOptions.sortBy, reportOptions.sortDir]);
  criteria.push(["year", "desc"], ["school", "asc"], ["teacher", "asc"], ["title", "asc"]);

  return [...publications].sort((left, right) => {
    const used = new Set();

    for (const [field, direction] of criteria) {
      if (used.has(field)) continue;
      used.add(field);

      const result = compareReportValues(
        getReportSortValue(left, field),
        getReportSortValue(right, field),
        direction,
        field
      );

      if (result !== 0) return result;
    }

    return 0;
  });
}

function getReportSortValue(publication, field) {
  const pub = toPlainObject(publication);
  const user = toPlainObject(pub.userId || pub.user || pub._reportUser);

  if (field === "year") return pub.year;
  if (field === "school") return user.higherSchool || "";
  if (field === "teacher") return user.fullName || user.fullNameEn || pub.ownerName || pub.iin || "";
  if (field === "title") return pub.title || "";
  if (field === "type") return pub.publicationType || "";
  if (field === "status") return pub.status || "";
  if (field === "updatedAt") return pub.updatedAt || pub.createdAt || "";

  return "";
}

function compareReportValues(left, right, direction, field) {
  const multiplier = direction === "desc" ? -1 : 1;

  if (field === "year") {
    return compareNullableNumbers(toYear(left), toYear(right), multiplier);
  }

  if (field === "updatedAt") {
    return compareNullableNumbers(toTime(left), toTime(right), multiplier);
  }

  return compareNullableStrings(left, right, multiplier);
}

function compareNullableNumbers(left, right, multiplier) {
  const leftMissing = left === null;
  const rightMissing = right === null;

  if (leftMissing && rightMissing) return 0;
  if (leftMissing) return 1;
  if (rightMissing) return -1;
  if (left === right) return 0;

  return left > right ? multiplier : -multiplier;
}

function compareNullableStrings(left, right, multiplier) {
  const leftText = String(left || "").trim();
  const rightText = String(right || "").trim();

  if (!leftText && !rightText) return 0;
  if (!leftText) return 1;
  if (!rightText) return -1;

  return leftText.localeCompare(rightText, "en", { sensitivity: "base" }) * multiplier;
}

function toYear(value) {
  const year = Number.parseInt(String(value || "").match(/\d{4}/)?.[0], 10);
  return Number.isFinite(year) ? year : null;
}

function toTime(value) {
  const time = value ? new Date(value).getTime() : Number.NaN;
  return Number.isFinite(time) ? time : null;
}

function defaultSortDirection(sortBy) {
  return sortBy === "year" || sortBy === "updatedAt" ? "desc" : "asc";
}

function toPlainObject(value) {
  if (!value) return {};
  if (typeof value.toObject === "function") {
    return value.toObject();
  }
  return value;
}

module.exports = {
  buildReportOptions,
  sortPublicationsForReport,
};
