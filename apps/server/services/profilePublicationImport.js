const Publication = require("../models/Publication");
const {
  addNormalizedPublicationFields,
  findDuplicatePublication,
} = require("./publicationUtils");

const PUBLICATION_TYPES = new Set(["scopus_wos", "koknvo", "conference", "articles", "books", "patents"]);

async function importPublicationDrafts({ user, publications, source }) {
  const imported = [];
  const skipped = [];

  for (const publication of publications) {
    const publicationData = buildPublicationData({ user, publication, source });

    if (!publicationData.authors || !publicationData.title || !publicationData.year || !publicationData.publicationType) {
      skipped.push({
        title: publication.title || "",
        reason: "missing_required_fields",
      });
      continue;
    }

    const duplicate = await findDuplicatePublication(publicationData);
    if (duplicate) {
      skipped.push({
        title: publicationData.title,
        reason: "duplicate",
        duplicateId: duplicate._id,
      });
      continue;
    }

    const savedPublication = await new Publication(publicationData).save();
    imported.push(savedPublication);
  }

  return {
    total: publications.length,
    importedCount: imported.length,
    skippedCount: skipped.length,
    imported,
    skipped,
  };
}

function buildPublicationData({ user, publication, source }) {
  const publicationType = PUBLICATION_TYPES.has(publication.publicationType)
    ? publication.publicationType
    : "articles";

  return addNormalizedPublicationFields({
    userId: user._id,
    iin: user.iin,
    authors: clean(publication.authors),
    title: clean(publication.title),
    year: clean(publication.year),
    output: clean(publication.output || publication.journal),
    doi: clean(publication.doi),
    isbn: clean(publication.isbn),
    patentDoi: clean(publication.patentDoi),
    scopus: Boolean(publication.scopus),
    wos: Boolean(publication.wos || source === "wos"),
    publicationType,
    visibility: "private",
    journal: clean(publication.journal),
    citations: Number(publication.citations || 0),
    source,
    status: "draft",
    importedFrom: clean(publication.importedFrom || source),
    importedAt: new Date(),
    externalUrl: clean(publication.externalUrl),
    file: "",
  });
}

function clean(value) {
  return String(value || "").trim();
}

module.exports = {
  importPublicationDrafts,
};
