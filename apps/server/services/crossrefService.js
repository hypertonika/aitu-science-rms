const CROSSREF_API_BASE = "https://api.crossref.org";

function mapPublicationType(crossrefType) {
  const typeMap = {
    "journal-article": "articles",
    "proceedings-article": "conference",
    book: "books",
    "book-chapter": "books",
    "posted-content": "articles",
    dissertation: "articles",
    "peer-review": "articles",
    "reference-entry": "articles",
    dataset: "articles",
  };

  return typeMap[crossrefType] || "articles";
}

function extractYear(work) {
  const dateSources = [
    work["published-print"],
    work["published-online"],
    work.published,
    work.created,
  ];

  for (const source of dateSources) {
    const year = source?.["date-parts"]?.[0]?.[0];
    if (year) return String(year);
  }

  return "";
}

function transformCrossrefWork(work) {
  return {
    title: work.title?.[0] || "",
    doi: work.DOI || "",
    authors: Array.isArray(work.author)
      ? work.author
          .map((author) => `${author.given || ""} ${author.family || ""}`.trim())
          .filter(Boolean)
          .join(", ")
      : "",
    year: extractYear(work),
    publicationType: mapPublicationType(work.type),
    journal: work["container-title"]?.[0] || "",
    output: work["container-title"]?.[0] || work.publisher || "",
    citations: Number(work["is-referenced-by-count"] || 0),
    source: "crossref",
  };
}

async function getWorkByDoi(doi) {
  const mailto = process.env.CROSSREF_MAILTO || "research@example.edu";
  const response = await fetch(`${CROSSREF_API_BASE}/works/${encodeURIComponent(doi)}`, {
    headers: {
      "User-Agent": `AITUScienceRMS/1.0 (mailto:${mailto})`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const error = new Error(`Crossref returned ${response.status}`);
    error.status = response.status === 404 ? 404 : 502;
    throw error;
  }

  const data = await response.json();
  return transformCrossrefWork(data.message || {});
}

module.exports = {
  getWorkByDoi,
  transformCrossrefWork,
};
