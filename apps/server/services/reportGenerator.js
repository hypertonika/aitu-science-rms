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
  buildPublicationReportRowsByUser,
  reportHeaders,
} = require('./publicationReportRows');

const reportsDir = path.join(__dirname, 'reports');

async function generateSingleUserReport(userData, publications = []) {
  ensureReportsDir();

  const rows = buildPublicationReportRows(publications, { ownerUser: userData });
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

async function generateAllPublicationsReport(publicationsByUser, higherSchool = 'all') {
  ensureReportsDir();

  const schools = {};
  Object.values(publicationsByUser).forEach(({ user, publications }) => {
    if (!user.higherSchool) return;
    if (!schools[user.higherSchool]) schools[user.higherSchool] = [];
    schools[user.higherSchool].push({ user, publications });
  });

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
  ];

  const selectedSchools = higherSchool && higherSchool !== 'all'
    ? { [higherSchool]: schools[higherSchool] || [] }
    : schools;

  let totalPublications = 0;
  Object.entries(selectedSchools).forEach(([school, usersArr]) => {
    const schoolPublications = usersArr.flatMap(({ publications }) => publications || []);
    totalPublications += schoolPublications.length;
    const publicationRows = buildPublicationReportRowsByUser(
      Object.fromEntries(usersArr.map((value, index) => [index, value]))
    );

    docSections.push(
      new Paragraph({
        text: `School: ${school}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300 },
      }),
      new Paragraph({
        text: `Total publications: ${schoolPublications.length}`,
        alignment: AlignmentType.LEFT,
      }),
      createPublicationTable(publicationRows)
    );
  });

  docSections.splice(2, 0, new Paragraph({
    text: `Total publications: ${totalPublications}`,
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

module.exports = { generateSingleUserReport, generateAllPublicationsReport };
