const PDFDocument = require("pdfkit");

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

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

module.exports = {
  sendCsv,
  sendPdf,
};
