const {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  PageOrientation,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} = require('docx');
const fs = require('fs');
const path = require('path');
const {
  buildPublicationReportRows,
  groupReportRows,
  reportHeaders,
} = require('./publicationReportRows');
const { buildReportOptions, sortPublicationsForReport } = require('./reportOptions');

const reportsDir = path.join(__dirname, 'reports');

async function generateSingleUserReport(userData, publications = []) {
  ensureReportsDir();

  const sortedPublications = sortPublicationsForReport(publications, {
    sortBy: 'year',
    sortDir: 'desc',
    groupBy: 'none',
  });
  const rows = buildPublicationReportRows(sortedPublications, { ownerUser: userData });
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
            },
          },
        },
        children: [
          new Paragraph({
            text: 'Astana IT University',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `School: ${userData.higherSchool || 'Not specified'}`,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `Publication report for ${userData.fullName || userData.email || userData.iin}`,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `Total publications: ${publications.length}`,
            alignment: AlignmentType.LEFT,
          }),
          createPublicationTable(rows),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const filePath = path.join(reportsDir, `${safeFileBase(userData)}_work_list.docx`);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

async function generateAllPublicationsReport(publicationsByUser, higherSchool = 'all', options = {}) {
  ensureReportsDir();
  const reportOptions = buildReportOptions(options, {
    sortBy: 'year',
    sortDir: 'desc',
    groupBy: 'school',
  });

  const reportPublications = flattenPublicationsByUser(publicationsByUser);
  const sortedPublications = sortPublicationsForReport(reportPublications, reportOptions);
  const publicationRows = buildPublicationReportRows(sortedPublications);
  const rowGroups = groupReportRows(publicationRows, reportOptions.groupBy);

  const docSections = [
    new Paragraph({
      text: 'Astana IT University',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      text: higherSchool && higherSchool !== 'all'
        ? `Publication report for ${higherSchool}`
        : 'Publication report for all schools',
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      text: `Grouped by: ${reportOptions.groupBy}; sorted by: ${reportOptions.sortBy} ${reportOptions.sortDir}`,
      alignment: AlignmentType.CENTER,
    }),
  ];

  rowGroups.forEach((group) => {
    docSections.push(
      new Paragraph({
        text: group.label ? `${groupLabel(reportOptions.groupBy)}: ${group.label}` : 'Publications',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300 },
      }),
      new Paragraph({
        text: `Total publications: ${group.rows.length}`,
        alignment: AlignmentType.LEFT,
      }),
      createPublicationTable(group.rows)
    );
  });

  docSections.splice(2, 0, new Paragraph({
    text: `Total publications: ${publicationRows.length}`,
    alignment: AlignmentType.LEFT,
    spacing: { after: 300 },
  }));

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
            },
          },
        },
        children: docSections,
      },
    ],
  });
  const buffer = await Packer.toBuffer(doc);
  const filePath = path.join(reportsDir, `all_publications_${safeName(higherSchool)}_${new Date().getFullYear()}.docx`);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

function createPublicationTable(reportRows) {
  const rows = [
    new TableRow({
      tableHeader: true,
      children: reportHeaders.map((header) => cell(header, { header: true })),
    }),
  ];

  reportRows.forEach((row) => {
    rows.push(new TableRow({
      children: [
        cell(row.number),
        cell(row.teacherName),
        cell(row.position),
        cell(row.school),
        cell(row.title),
        cell(row.publicationType),
        cell(row.journalOrConference),
        cell(row.indexing),
        cell(row.quartileOrLevel),
        cell(row.year),
        cell(row.doiOrLink),
        cell(row.coauthors),
        cell(row.status),
      ],
    }));
  });

  return new Table({
    rows,
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
  });
}

function flattenPublicationsByUser(publicationsByUser = {}) {
  return Object.values(publicationsByUser).flatMap(({ user, publications = [] }) => {
    return publications.map((publication) => {
      const pub = toPlainObject(publication);
      pub._reportUser = toPlainObject(user);
      return pub;
    });
  });
}

function groupLabel(groupBy) {
  if (groupBy === 'school') return 'School';
  if (groupBy === 'year') return 'Year';
  return 'Group';
}

function cell(text, options = {}) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: String(text || ''),
            bold: Boolean(options.header),
            size: options.header ? 16 : 15,
          }),
        ],
      }),
    ],
  });
}

function ensureReportsDir() {
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
}

function safeFileBase(userData) {
  return safeName(userData.fullName || userData.email || userData.iin || 'user');
}

function safeName(value) {
  return String(value || 'all')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 100);
}

function toPlainObject(value) {
  if (!value) return {};
  if (typeof value.toObject === 'function') {
    return value.toObject();
  }
  return { ...value };
}

module.exports = { generateSingleUserReport, generateAllPublicationsReport };
