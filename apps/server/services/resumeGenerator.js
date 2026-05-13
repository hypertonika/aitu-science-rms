const { Document, Packer, Paragraph, Table, TableRow, TableCell, HeadingLevel, AlignmentType } = require('docx');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit'); // For PDF generation

async function generateUserResume(userData, publications) {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: `${userData.fullName}`,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `Date of Birth: ${userData.birthDate}`,
            alignment: AlignmentType.LEFT,
          }),
          new Paragraph({
            text: `Email: ${userData.email}`,
            alignment: AlignmentType.LEFT,
          }),
          new Paragraph({
            text: `Phone: ${userData.phone}`,
            alignment: AlignmentType.LEFT,
          }),
          new Paragraph({
            text: `Область исследования: ${userData.researchArea}`,
            alignment: AlignmentType.LEFT,
          }),
          new Paragraph({
            text: "Публикации:",
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.LEFT,
          }),
          ...publications.map((pub, index) => (
            new Paragraph({
              text: `${index + 1}. ${pub.title} (${pub.year})`,
              alignment: AlignmentType.LEFT,
            })
          )),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const filePath = path.join(__dirname, 'reports', `${userData.fullName}_cv.docx`);
  fs.writeFileSync(filePath, buffer);

  return filePath;
}

async function generateUserResumePDF(userData, publications) {
  const doc = new PDFDocument();
  const filePath = path.join(__dirname, 'reports', `${userData.fullName}_cv.pdf`);

  doc.pipe(fs.createWriteStream(filePath));
  doc.fontSize(20).text("Резюме", { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`ФИО: ${userData.fullName}`);
  doc.text(`Email: ${userData.email}`);
  doc.text(`Phone: ${userData.phone}`);
  doc.text(`Область исследования: ${userData.researchArea}`);
  doc.moveDown();
  doc.text("Публикации:");
  publications.forEach((pub, index) => {
    doc.text(`${index + 1}. ${pub.title} (${pub.year})`);
  });

  doc.end();
  return filePath;
}

module.exports = { generateUserResume, generateUserResumePDF };