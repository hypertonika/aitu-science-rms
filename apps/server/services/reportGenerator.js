const { Console } = require('console');
const { Document, Packer, Paragraph, Table, TableRow, TableCell, HeadingLevel, AlignmentType, Italic } = require('docx');
const fs = require('fs');
const path = require('path');

async function generateSingleUserReport(userData, publications) {
  const groupedTypes = groupByType(publications || []); // Ensure publications is an array
  const totalPublications = publications.length;

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: "Astana IT University",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `Высшая школа: ${userData.higherSchool}`,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `Список научных и научно-методических трудов старшего преподавателя ${userData.higherSchool} PhD`,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `${userData.fullName}`,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `Количество публикации сотрудника за весь период: ${totalPublications}`,
            alignment: AlignmentType.LEFT,
          }),
          createMainTable(groupedTypes) // Generate single table with grouped types
        ],
      },
    ],
  });

  try {
    const buffer = await Packer.toBuffer(doc);
    const reportsDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir);
    }
    const filePath = path.join(reportsDir, `${userData.fullName}_work_list.docx`);
    fs.writeFileSync(filePath, buffer);
    return filePath;
  } catch (error) {
    console.error("Error while packing document: ", error);
    throw new Error("Could not generate the Word document.");
  }
}

function createMainTable(groupedTypes) {
  const rows = [];
  let publicationIndex = 1;
  console.log(1)


  Object.entries(groupedTypes).forEach(([type, pubs]) => {
    if (Array.isArray(pubs) && pubs.length > 0) { // Ensure pubs is a non-empty array
      rows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: getTypeTitle(type), alignment: AlignmentType.CENTER, italics: true })],
              columnSpan: 6,
            }),
          ],
        })
      );

      pubs.forEach((pub) => {
        rows.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph((publicationIndex++).toString())] }),
              new TableCell({ children: [new Paragraph(pub.title || 'N/A')] }),
              new TableCell({ children: [new Paragraph("Печатный")] }),
              new TableCell({ children: [new Paragraph(pub.output || 'N/A')] }),
              new TableCell({ children: [new Paragraph(pub.volume ? pub.volume.toString() : 'N/A')] }),
              new TableCell({
                children: [new Paragraph(
                  Array.isArray(pub.authors) ? pub.authors.join(', ') : (pub.authors || 'N/A')
                )]
              }),
            ],
          })
        );
      });
    }
  });

  return new Table({ rows });
}

async function generateAllPublicationsReport(publicationsByUser, higherSchool = 'all') {
  // Группируем пользователей по школам
  const schools = {};
  Object.values(publicationsByUser).forEach(({ user, publications }) => {
    if (!user.higherSchool) return;
    if (!schools[user.higherSchool]) schools[user.higherSchool] = [];
    schools[user.higherSchool].push({ user, publications });
  });

  let docSections = [];
  let totalPublications = 0;

  if (higherSchool && higherSchool !== 'all') {
    // Только одна школа
    const schoolUsers = schools[higherSchool] || [];
    let allPubs = [];
    schoolUsers.forEach(({ publications }) => {
      allPubs = allPubs.concat(publications);
    });
    totalPublications = allPubs.length;
    const groupedTypes = groupByType(allPubs);

    docSections = [
          new Paragraph({
        text: `Astana IT University`,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
        text: `Отчет по публикациям сотрудников школы: ${higherSchool} за ${new Date().getFullYear()}`,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `Общее количество публикаций: ${totalPublications}`,
            alignment: AlignmentType.LEFT,
            spacing: { after: 300 },
      })
    ];

    // Для каждого типа публикаций — отдельная таблица
    Object.entries(groupedTypes).forEach(([type, pubs]) => {
      if (pubs.length > 0) {
        docSections.push(
          new Paragraph({
            text: getTypeTitle(type),
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200 },
          }),
          createAdminTable(pubs)
        );
      }
    });
  } else {
    // Для всех школ
    docSections = [
      new Paragraph({
        text: `Astana IT University`,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        text: `Отчет по публикациям всех сотрудников за ${new Date().getFullYear()}`,
        alignment: AlignmentType.CENTER,
      })
    ];
    Object.entries(schools).forEach(([school, usersArr]) => {
      let allPubs = [];
      usersArr.forEach(({ publications }) => {
        allPubs = allPubs.concat(publications);
      });
      totalPublications += allPubs.length;
      const groupedTypes = groupByType(allPubs);
      docSections.push(
          new Paragraph({
          text: `\nШкола: ${school}`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300 },
          }),
        new Paragraph({
          text: `Количество публикаций: ${allPubs.length}`,
          alignment: AlignmentType.LEFT,
        })
      );
      Object.entries(groupedTypes).forEach(([type, pubs]) => {
        if (pubs.length > 0) {
          docSections.push(
          new Paragraph({
              text: getTypeTitle(type),
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 200 },
          }),
            createAdminTable(pubs)
          );
        }
      });
    });
    // В начало — общее количество публикаций
    docSections.splice(2, 0, new Paragraph({
      text: `Общее количество публикаций: ${totalPublications}`,
      alignment: AlignmentType.LEFT,
      spacing: { after: 300 },
    }));
  }

  const doc = new Document({
    sections: [
      {
        children: docSections,
      },
    ],
  });

  try {
    const reportsDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir);
    }
    const filePath = path.join(reportsDir, `all_publications_${higherSchool}_${new Date().getFullYear()}.docx`);
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filePath, buffer);
    return filePath;
  } catch (error) {
    console.error("Error while packing document: ", error);
    throw new Error("Could not generate the Word document.");
  }
}

function createAdminTable(pubs) {
    const rows = [];
  // Заголовок таблицы
      rows.push(
        new TableRow({
          children: [
        new TableCell({ children: [new Paragraph('№')], verticalAlign: 'center' }),
        new TableCell({ children: [new Paragraph('Название трудов')], verticalAlign: 'center' }),
        new TableCell({ children: [new Paragraph('Характер работы')], verticalAlign: 'center' }),
        new TableCell({ children: [new Paragraph('Выходные данные')], verticalAlign: 'center' }),
        new TableCell({ children: [new Paragraph('Объем п.л.')], verticalAlign: 'center' }),
        new TableCell({ children: [new Paragraph('Фамилии авторов')], verticalAlign: 'center' }),
        new TableCell({ children: [new Paragraph('Пользователь')], verticalAlign: 'center' }),
          ],
        })
      );
  // Данные публикаций
  pubs.forEach((pub, idx) => {
            rows.push(
              new TableRow({
                children: [
          new TableCell({ children: [new Paragraph((idx + 1).toString())] }),
          new TableCell({ children: [new Paragraph(pub.title || '')] }),
          new TableCell({ children: [new Paragraph(pub.character || 'Печатный')] }),
          new TableCell({ children: [new Paragraph(pub.output || '')] }),
          new TableCell({ children: [new Paragraph(pub.volume ? pub.volume.toString() : '')] }),
          new TableCell({ children: [new Paragraph(pub.authors || '')] }),
          new TableCell({ children: [new Paragraph(pub.iin || '')] }), // Можно заменить на ФИО, если нужно
                ],
              })
            );
          });
    return new Table({ rows });
  }

function groupByType(publications) {
    const grouped = {
      koknvo: [],
      scopus_wos: [],
      conference: [],
      articles: [],
      books: [],
      patents: [],
    };
  
    if (Array.isArray(publications)) {
      publications.forEach(pub => {
        if (grouped[pub.publicationType]) {
          grouped[pub.publicationType].push(pub);
        } else {
          grouped.articles.push(pub); // Default to 'articles' if no specific type is found
        }
      });
    }
  
    return grouped;
  }
  
  function getTypeTitle(type) {
    const titles = {
      koknvo: "Научные статьи в журналах КОКСНВО",
      scopus_wos: "Публикации Scopus и Web of Science",
      conference: "Публикации в материалах конференций",
      articles: "Научные статьи в периодических изданиях",
      books: "Монографии, учебные пособия и другие книги",
      patents: "Патенты, авторские свидетельства и другие охранные документы",
    };
    return titles[type] || "Другие публикации";
  }
  
module.exports = { generateSingleUserReport, generateAllPublicationsReport };