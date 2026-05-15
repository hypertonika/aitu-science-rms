const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

function sendCsv(res, publications, filename) {
  const headers = [
    "Title",
    "Authors",
    "Year",
    "Type",
    "DOI",
    "Status",
    "Visibility",
    "Journal",
    "Output",
  ];
  const rows = publications.map((pub) => [
    pub.title,
    pub.authors,
    pub.year,
    pub.publicationType,
    pub.doi,
    pub.status,
    pub.visibility,
    pub.journal,
    pub.output,
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => csvCell(cell)).join(","))
    .join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(`\uFEFF${csv}`);
}

function sendPdf(res, publications, filename, title = "Publication Export") {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);

  doc.fontSize(18).text(title, { align: "center" });
  doc.moveDown();

  publications.forEach((pub, index) => {
    doc.fontSize(11).text(`${index + 1}. ${pub.title || "Untitled"}`, { continued: false });
    doc.fontSize(9).text(`Authors: ${pub.authors || "-"}`);
    doc.text(`Year: ${pub.year || "-"} | Type: ${pub.publicationType || "-"} | Status: ${pub.status || "-"}`);
    if (pub.doi) doc.text(`DOI: ${pub.doi}`);
    if (pub.output) doc.text(`Output: ${pub.output}`);
    doc.moveDown(0.6);
  });

  doc.end();
}

async function sendXlsx(res, publications, filename, title = "Publications") {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AITU Science RMS";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(title.slice(0, 31));
  worksheet.columns = [
    { header: "Title", key: "title", width: 42 },
    { header: "Authors", key: "authors", width: 36 },
    { header: "Year", key: "year", width: 12 },
    { header: "Type", key: "publicationType", width: 18 },
    { header: "DOI", key: "doi", width: 28 },
    { header: "Status", key: "status", width: 14 },
    { header: "Visibility", key: "visibility", width: 16 },
    { header: "Journal", key: "journal", width: 28 },
    { header: "Output", key: "output", width: 30 },
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.views = [{ state: "frozen", ySplit: 1 }];

  publications.forEach((pub) => {
    worksheet.addRow({
      title: pub.title || "",
      authors: pub.authors || "",
      year: pub.year || "",
      publicationType: pub.publicationType || "",
      doi: pub.doi || "",
      status: pub.status || "",
      visibility: pub.visibility || "",
      journal: pub.journal || "",
      output: pub.output || "",
    });
  });

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

module.exports = {
  sendCsv,
  sendPdf,
  sendXlsx,
};
