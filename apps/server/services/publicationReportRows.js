const reportHeaders = [
  'No.',
  'Teacher name',
  'Position',
  'School',
  'Publication title',
  'Publication type',
  'Journal / conference',
  'Indexing',
  'Quartile / level',
  'Year',
  'DOI / link',
  'Coauthors',
  'Status',
];

const publicationTypeLabels = {
  scopus_wos: 'Article',
  koknvo: 'Article',
  conference: 'Conference',
  articles: 'Article',
  books: 'Book',
  patents: 'Patent',
};

const statusLabels = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Published',
  rejected: 'Rejected',
};

function buildPublicationReportRows(publications = [], options = {}) {
  return publications.map((publication, index) => {
    const pub = toPlainObject(publication);
    const user = toPlainObject(options.ownerUser || pub.userId || pub.user || pub._reportUser);
    const teacherName = user.fullName || user.fullNameEn || pub.ownerName || pub.iin || '';

    return {
      number: index + 1,
      teacherName: valueOrDash(teacherName),
      position: valueOrDash(user.position),
      school: valueOrDash(user.higherSchool),
      title: valueOrDash(pub.title),
      publicationType: getPublicationTypeLabel(pub),
      journalOrConference: valueOrDash(pub.journal || pub.output),
      indexing: getIndexing(pub),
      quartileOrLevel: getQuartileOrLevel(pub),
      year: valueOrDash(pub.year),
      doiOrLink: valueOrDash(pub.doi || pub.externalUrl || pub.patentDoi),
      coauthors: getCoauthors(pub.authors, user),
      status: statusLabels[pub.status] || valueOrDash(pub.status),
    };
  });
}

function buildPublicationReportRowsByUser(publicationsByUser = {}) {
  const publications = [];

  Object.values(publicationsByUser).forEach(({ user, publications: userPublications = [] }) => {
    userPublications.forEach((publication) => {
      const pub = toPlainObject(publication);
      pub._reportUser = user;
      publications.push(pub);
    });
  });

  return buildPublicationReportRows(publications);
}

function groupReportRows(rows = [], groupBy = 'none') {
  if (groupBy !== 'school' && groupBy !== 'year') {
    return [{ label: '', rows }];
  }

  const groups = [];
  const groupsByLabel = new Map();

  rows.forEach((row) => {
    const label = groupBy === 'school'
      ? valueOrDash(row.school)
      : valueOrDash(row.year);

    if (!groupsByLabel.has(label)) {
      const group = { label, rows: [] };
      groupsByLabel.set(label, group);
      groups.push(group);
    }

    groupsByLabel.get(label).rows.push(row);
  });

  return groups;
}

function getPublicationTypeLabel(publication) {
  return publicationTypeLabels[publication.publicationType] || valueOrDash(publication.publicationType);
}

function getIndexing(publication) {
  if (publication.indexing) return publication.indexing;

  if (publication.scopus && publication.wos) return 'Scopus / WoS';
  if (publication.scopus) return 'Scopus';
  if (publication.wos) return 'WoS';
  if (publication.publicationType === 'scopus_wos') return 'Scopus / WoS';
  if (publication.publicationType === 'koknvo') return 'CQAFSHE journal';
  if (publication.publicationType === 'conference') return 'Conference';
  if (publication.publicationType === 'books') return 'Book';
  if (publication.publicationType === 'patents') return 'Patent';

  return '-';
}

function getQuartileOrLevel(publication) {
  if (publication.quartile) return publication.quartile;
  if (publication.level) return publication.level;

  const quartile = extractQuartile(publication.output) || extractQuartile(publication.journal);
  if (quartile) return quartile;

  if (publication.publicationType === 'koknvo') return 'CQAFSHE';
  if (publication.publicationType === 'conference') return 'Conference paper';
  if (publication.publicationType === 'books') return 'Book';
  if (publication.publicationType === 'patents') return 'Patent';

  return '-';
}

function getCoauthors(authors, user = {}) {
  const authorText = String(authors || '').trim();
  if (!authorText) return '-';

  const names = authorText
    .split(/[,;]+/)
    .map((name) => name.trim())
    .filter(Boolean);

  if (names.length === 0) return '-';

  const teacherNames = [
    user.fullName,
    user.fullNameEn,
    user.email,
    user.iin,
  ]
    .filter(Boolean)
    .map(normalizePersonName);

  const coauthors = names.filter((name) => {
    const normalizedName = normalizePersonName(name);
    return !teacherNames.some((teacherName) => teacherName && (
      normalizedName === teacherName ||
      normalizedName.includes(teacherName) ||
      teacherName.includes(normalizedName)
    ));
  });

  return coauthors.length > 0 ? coauthors.join(', ') : '-';
}

function extractQuartile(value) {
  const match = String(value || '').match(/\bQ[1-4]\b/i);
  return match ? match[0].toUpperCase() : '';
}

function normalizePersonName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}@.]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function valueOrDash(value) {
  const text = String(value ?? '').trim();
  return text || '-';
}

function toPlainObject(value) {
  if (!value) return {};
  if (typeof value.toObject === 'function') {
    return value.toObject();
  }
  return value;
}

module.exports = {
  buildPublicationReportRows,
  buildPublicationReportRowsByUser,
  groupReportRows,
  reportHeaders,
};
