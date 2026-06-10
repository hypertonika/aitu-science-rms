const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const {
  buildPublicationReportRows,
  groupReportRows,
  reportHeaders,
} = require("./publicationReportRows");

const rowKeys = [
  "number",
  "teacherName",
  "position",
  "school",
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

const pdfFields = [
  ["Teacher", "teacherName"],
  ["Position", "position"],
  ["School", "school"],
  ["Type", "publicationType"],
  ["Journal / conference", "journalOrConference"],
  ["Indexing", "indexing"],
  ["Quartile / level", "quartileOrLevel"],
  ["Year", "year"],
  ["DOI / link", "doiOrLink"],
  ["Coauthors", "coauthors"],
  ["Status", "status"],
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
    margin: 36,
    size: "A4",
    bufferPages: true,
  });
  doc.pipe(res);

  const fonts = registerPdfFonts(doc);
  const rows = buildPublicationReportRows(publications, options);
  const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  let y = drawPdfTitle(doc, title, rows.length, fonts, options);

  if (rows.length === 0) {
    doc
      .font(fonts.regular)
      .fontSize(11)
      .fillColor("#475569")
      .text("No approved publications found.", doc.page.margins.left, y + 24);
    addPageNumbers(doc, fonts);
    doc.end();
    return;
  }

  const rowGroups = groupReportRows(rows, options.groupBy);
  rowGroups.forEach((group) => {
    if (group.label) {
      if (y + 32 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = doc.page.margins.top;
      }
      y = drawPdfGroupHeading(doc, formatGroupLabel(options.groupBy, group.label), group.rows.length, y, fonts);
    }

    group.rows.forEach((row) => {
      const height = measurePdfRecord(doc, row, contentWidth, fonts);

      if (y + height > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = doc.page.margins.top;
      }

      y = drawPdfRecord(doc, row, doc.page.margins.left, y, contentWidth, height, fonts);
    });
  });

  addPageNumbers(doc, fonts);
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
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: rowKeys.length },
  };

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

function registerPdfFonts(doc) {
  const regularFont = firstExistingPath([
    process.env.PDF_FONT_PATH,
    path.join(__dirname, "fonts", "NotoSans-Regular.ttf"),
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed.ttf",
    "C:\\Windows\\Fonts\\arial.ttf",
    "C:\\Windows\\Fonts\\segoeui.ttf",
  ]);
  const boldFont = firstExistingPath([
    process.env.PDF_BOLD_FONT_PATH,
    path.join(__dirname, "fonts", "NotoSans-Bold.ttf"),
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed-Bold.ttf",
    "C:\\Windows\\Fonts\\arialbd.ttf",
    "C:\\Windows\\Fonts\\seguisb.ttf",
    regularFont,
  ]);

  if (!regularFont) {
    return {
      regular: "Helvetica",
      bold: "Helvetica-Bold",
    };
  }

  doc.registerFont("ReportRegular", regularFont);
  doc.registerFont("ReportBold", boldFont || regularFont);

  return {
    regular: "ReportRegular",
    bold: "ReportBold",
  };
}

function firstExistingPath(paths) {
  return paths.find((fontPath) => fontPath && fs.existsSync(fontPath));
}

function drawPdfTitle(doc, title, total, fonts, options = {}) {
  const left = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  doc
    .font(fonts.bold)
    .fontSize(17)
    .fillColor("#0f172a")
    .text(title, left, doc.page.margins.top, { width });

  doc
    .font(fonts.regular)
    .fontSize(9)
    .fillColor("#64748b")
    .text(
      `Generated: ${new Date().toLocaleString("en-GB")} | Records: ${total} | ${formatReportOptions(options)}`,
      left,
      doc.y + 4,
      { width }
    );

  const y = doc.y + 14;
  doc
    .moveTo(left, y)
    .lineTo(left + width, y)
    .strokeColor("#cbd5e1")
    .lineWidth(0.75)
    .stroke();

  return y + 14;
}

function drawPdfGroupHeading(doc, label, count, y, fonts) {
  const left = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  doc
    .font(fonts.bold)
    .fontSize(11)
    .fillColor("#0f172a")
    .text(`${label} (${count})`, left, y, { width });

  return doc.y + 8;
}

function measurePdfRecord(doc, row, width, fonts) {
  const bodyWidth = width - 24;
  const columnGap = 14;
  const columnWidth = (bodyWidth - columnGap) / 2;
  const title = `${row.number}. ${row.title}`;

  const titleHeight = doc
    .font(fonts.bold)
    .fontSize(10.5)
    .heightOfString(title, { width: bodyWidth });

  const fieldHeights = pdfFields.map(([label, key]) => measurePdfField(doc, label, row[key], columnWidth, fonts));
  const pairsHeight = chunkPairs(fieldHeights).reduce(
    (sum, pair) => sum + Math.max(...pair) + 7,
    0
  );

  return Math.max(92, 18 + titleHeight + 10 + pairsHeight + 10);
}

function measurePdfField(doc, label, value, width, fonts) {
  const labelHeight = doc
    .font(fonts.bold)
    .fontSize(7.3)
    .heightOfString(label.toUpperCase(), { width });
  const valueHeight = doc
    .font(fonts.regular)
    .fontSize(8.4)
    .heightOfString(cleanPdfText(value), { width });

  return labelHeight + 2 + valueHeight;
}

function drawPdfRecord(doc, row, x, y, width, height, fonts) {
  const bodyX = x + 12;
  const bodyWidth = width - 24;
  const columnGap = 14;
  const columnWidth = (bodyWidth - columnGap) / 2;

  doc
    .roundedRect(x, y, width, height - 8, 6)
    .fillAndStroke("#ffffff", "#e2e8f0");

  let cursorY = y + 10;
  doc
    .font(fonts.bold)
    .fontSize(10.5)
    .fillColor("#0f172a")
    .text(`${row.number}. ${row.title}`, bodyX, cursorY, { width: bodyWidth });

  cursorY = doc.y + 8;

  for (const pair of chunkPairs(pdfFields)) {
    const firstHeight = drawPdfField(doc, pair[0], row, bodyX, cursorY, columnWidth, fonts);
    const secondHeight = pair[1]
      ? drawPdfField(doc, pair[1], row, bodyX + columnWidth + columnGap, cursorY, columnWidth, fonts)
      : 0;
    cursorY += Math.max(firstHeight, secondHeight) + 7;
  }

  return y + height;
}

function drawPdfField(doc, field, row, x, y, width, fonts) {
  const [label, key] = field;

  doc
    .font(fonts.bold)
    .fontSize(7.3)
    .fillColor("#64748b")
    .text(label.toUpperCase(), x, y, { width });

  const valueY = doc.y + 2;
  doc
    .font(fonts.regular)
    .fontSize(8.4)
    .fillColor("#1e293b")
    .text(cleanPdfText(row[key]), x, valueY, { width });

  return doc.y - y;
}

function addPageNumbers(doc, fonts) {
  const range = doc.bufferedPageRange();
  for (let index = 0; index < range.count; index += 1) {
    doc.switchToPage(index);
    const pageNumber = index + 1;
    const text = `Page ${pageNumber} of ${range.count}`;

    doc
      .font(fonts.regular)
      .fontSize(8)
      .fillColor("#94a3b8")
      .text(
        text,
        doc.page.margins.left,
        doc.page.height - doc.page.margins.bottom + 10,
        {
          width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
          align: "center",
        }
      );
  }
}

function chunkPairs(items) {
  const pairs = [];
  for (let index = 0; index < items.length; index += 2) {
    pairs.push(items.slice(index, index + 2));
  }
  return pairs;
}

function cleanPdfText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim() || "-";
}

function getExcelWidth(key) {
  const widths = {
    number: 5,
    teacherName: 24,
    position: 18,
    school: 28,
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

function formatReportOptions(options = {}) {
  const groupBy = options.groupBy && options.groupBy !== "none" ? options.groupBy : "none";
  const sortBy = options.sortBy || "year";
  const sortDir = options.sortDir || "desc";

  return `Group: ${groupBy} | Sort: ${sortBy} ${sortDir}`;
}

function formatGroupLabel(groupBy, label) {
  if (groupBy === "school") return `School: ${label}`;
  if (groupBy === "year") return `Year: ${label}`;
  return label;
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
