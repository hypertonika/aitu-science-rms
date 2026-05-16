const { Document, Packer, Paragraph, Table, TableRow, TableCell, HeadingLevel, AlignmentType } = require('docx');
const fs = require('fs');
const path = require('path');

const reportsDir = path.join(__dirname, 'reports');

const publicationTypeTitles = {
  koknvo: 'CQAFSHE journals',
  scopus_wos: 'Scopus / Web of Science',
  conference: 'Conference proceedings',
  articles: 'Local journals and other articles',
  books: 'Books and teaching materials',
  patents: 'Patents and certificates',
};

async function generateSingleUserReport(userData, publications = []) {
  ensureReportsDir();

  const groupedTypes = groupByType(publications);
  const doc = new Document({
    sections: [
      {
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
          createPublicationTable(groupedTypes),
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
    const groupedTypes = groupByType(schoolPublications);

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
      createPublicationTable(groupedTypes)
    );
  });

  docSections.splice(2, 0, new Paragraph({
    text: `Total publications: ${totalPublications}`,
    alignment: AlignmentType.LEFT,
    spacing: { after: 300 },
  }));

  const doc = new Document({ sections: [{ children: docSections }] });
  const buffer = await Packer.toBuffer(doc);
  const filePath = path.join(reportsDir, `all_publications_${safeName(higherSchool)}_${new Date().getFullYear()}.docx`);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

function createPublicationTable(groupedTypes) {
  const rows = [
    new TableRow({
      children: [
        cell('#'),
        cell('Title'),
        cell('Type'),
        cell('Output'),
        cell('Year'),
        cell('Authors'),
      ],
    }),
  ];

  let publicationIndex = 1;
  Object.entries(groupedTypes).forEach(([type, publications]) => {
    publications.forEach((publication) => {
      rows.push(
        new TableRow({
          children: [
            cell(String(publicationIndex++)),
            cell(publication.title || ''),
            cell(publicationTypeTitles[type] || type),
            cell(publication.output || ''),
            cell(publication.year || ''),
            cell(publication.authors || ''),
          ],
        })
      );
    });
  });

  return new Table({ rows });
}

function cell(text) {
  return new TableCell({ children: [new Paragraph(String(text || ''))] });
}

function groupByType(publications) {
  return publications.reduce((acc, publication) => {
    const type = publication.publicationType || 'articles';
    if (!acc[type]) acc[type] = [];
    acc[type].push(publication);
    return acc;
  }, {});
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
