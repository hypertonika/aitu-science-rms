const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const {
  buildPublicationReportRows,
  reportHeaders,
} = require("./publicationReportRows");

const rowKeys = [
  "number",
  "teacherName",
  "position",
  "title",
  "publicationType",
  "journalOrConference",
  "indexing",
  "quartileOrLevel",
  "year",
  "doiOrLink",
  "coauthors",
  "status",
];

function sendCsv(res, publications, filename, options = {}) {
  const rows = buildPublicationReportRows(publications, options).map((row) =>
    rowKeys.map((key) => row[key])
  );

  const csv = [reportHeaders, ...rows]
    .map((row) => row.map((cell) => csvCell(cell)).join(","))
    .join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(`\uFEFF${csv}`);
}

function sendPdf(res, publications, filename, title = "Publication Export", options = {}) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const doc = new PDFDocument({
    layout: "landscape",
    margin: 24,
    size: "A4",
  });
  doc.pipe(res);

  const rows = buildPublicationReportRows(publications, options);
  const widths = [24, 78, 70, 118, 58, 105, 58, 70, 42, 78, 70, 60];
  const startX = doc.page.margins.left;
  const tableWidth = widths.reduce((sum, width) => sum + width, 0);

  doc.fontSize(14).text(title, { align: "center" });
  doc.moveDown(0.7);

  let y = doc.y;
  drawPdfRow(doc, reportHeaders, startX, y, widths, { header: true });
  y += 34;

  rows.forEach((row) => {
    const values = rowKeys.map((key) => row[key]);
    const height = Math.max(34, estimatePdfRowHeight(values, widths));

    if (y + height > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.page.margins.top;
      drawPdfRow(doc, reportHeaders, startX, y, widths, { header: true });
      y += 34;
    }

    drawPdfRow(doc, values, startX, y, widths, { height });
    y += height;
  });

  doc
    .moveTo(startX, y)
    .lineTo(startX + tableWidth, y)
    .strokeColor("#d9d9d9")
    .stroke();

  doc.end();
}

async function sendXlsx(res, publications, filename, title = "Publications", options = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AITU Science RMS";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(title.slice(0, 31));
  worksheet.columns = reportHeaders.map((header, index) => ({
    header,
    key: rowKeys[index],
    width: getExcelWidth(rowKeys[index]),
  }));

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FF222222" } };
  headerRow.alignment = { vertical: "middle", wrapText: true };
  headerRow.height = 36;
  worksheet.views = [{ state: "frozen", ySplit: 1 }];

  const rows = buildPublicationReportRows(publications, options);
  rows.forEach((row) => {
    worksheet.addRow(row);
  });

  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.alignment = { vertical: "top", wrapText: true };
      cell.border = {
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
      };
    });
  });

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
}

function drawPdfRow(doc, values, x, y, widths, options = {}) {
  const height = options.height || 34;
  let currentX = x;

  doc
    .strokeColor(options.header ? "#cfd4dc" : "#eceff3")
    .lineWidth(0.5)
    .moveTo(x, y + height)
    .lineTo(x + widths.reduce((sum, width) => sum + width, 0), y + height)
    .stroke();

  values.forEach((value, index) => {
    doc
      .font(options.header ? "Helvetica-Bold" : "Helvetica")
      .fontSize(options.header ? 7.5 : 7)
      .fillColor("#222222")
      .text(String(value || ""), currentX + 3, y + 6, {
        width: widths[index] - 6,
        height: height - 8,
        ellipsis: true,
      });
    currentX += widths[index];
  });
}

function estimatePdfRowHeight(values, widths) {
  return values.reduce((height, value, index) => {
    const text = String(value || "");
    const approximateCharsPerLine = Math.max(6, Math.floor(widths[index] / 4));
    const lines = Math.ceil(text.length / approximateCharsPerLine);
    return Math.max(height, 18 + lines * 8);
  }, 34);
}

function getExcelWidth(key) {
  const widths = {
    number: 5,
    teacherName: 24,
    position: 18,
    title: 34,
    publicationType: 16,
    journalOrConference: 30,
    indexing: 16,
    quartileOrLevel: 18,
    year: 12,
    doiOrLink: 28,
    coauthors: 24,
    status: 18,
  };
  return widths[key] || 18;
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
