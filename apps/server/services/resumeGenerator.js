const { Document, Packer, Paragraph, HeadingLevel, AlignmentType } = require('docx');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const reportsDir = path.join(__dirname, 'reports');

function ensureReportsDir() {
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
}

function safeFileBase(userData) {
  const fallback = userData.email || userData.iin || userData._id || 'researcher';
  return String(userData.fullName || fallback)
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

function valueOrDash(value) {
  return value || '-';
}

async function generateUserResume(userData, publications) {
  ensureReportsDir();

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: valueOrDash(userData.fullName),
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: `Date of birth: ${valueOrDash(userData.birthDate)}` }),
          new Paragraph({ text: `Email: ${valueOrDash(userData.email)}` }),
          new Paragraph({ text: `Phone: ${valueOrDash(userData.phone)}` }),
          new Paragraph({ text: `Research area: ${valueOrDash(userData.researchArea)}` }),
          new Paragraph({
            text: 'Publications',
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.LEFT,
          }),
          ...(publications.length > 0
            ? publications.map((pub, index) => (
                new Paragraph({
                  text: `${index + 1}. ${pub.title} (${pub.year})`,
                  alignment: AlignmentType.LEFT,
                })
              ))
            : [new Paragraph({ text: 'No approved publications yet.' })]),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const filePath = path.join(reportsDir, `${safeFileBase(userData)}_cv.docx`);
  fs.writeFileSync(filePath, buffer);

  return filePath;
}

async function generateUserResumePDF(userData, publications) {
  ensureReportsDir();

  const doc = new PDFDocument({ margin: 48 });
  const filePath = path.join(reportsDir, `${safeFileBase(userData)}_cv.pdf`);
  const stream = fs.createWriteStream(filePath);

  doc.pipe(stream);
  doc.fontSize(20).text('Academic Resume', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Full name: ${valueOrDash(userData.fullName)}`);
  doc.text(`Email: ${valueOrDash(userData.email)}`);
  doc.text(`Phone: ${valueOrDash(userData.phone)}`);
  doc.text(`Research area: ${valueOrDash(userData.researchArea)}`);
  doc.moveDown();
  doc.fontSize(14).text('Publications');
  doc.moveDown(0.5);

  if (publications.length > 0) {
    publications.forEach((pub, index) => {
      doc.fontSize(11).text(`${index + 1}. ${pub.title} (${pub.year})`);
    });
  } else {
    doc.fontSize(11).text('No approved publications yet.');
  }

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return filePath;
}

module.exports = { generateUserResume, generateUserResumePDF };
