const { User } = require('../../../models');
const Publication = require('../../../models/Publication');
const { generateSingleUserReport } = require('../../../services/reportGenerator');
const { verifyToken } = require('../../../middleware/auth');
const fs = require('fs');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Применяем verifyToken как middleware
  try {
    await new Promise((resolve, reject) => verifyToken(req, res, (err) => (err ? reject(err) : resolve())));
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return; // Завершаем обработку, если верификация не прошла
  }

  const { iin } = req.body;

  try {
    const user = await User.findOne({ iin });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const publications = await Publication.find({ iin, status: 'approved' });
    if (publications.length === 0) {
      return res.status(404).json({ message: 'No publications found for this user' });
    }

    const filePath = await generateSingleUserReport(user, publications);
    const sanitizedFileName = user.fullName
                              ? `${user.fullName.replace(/[^a-zA-Z0-9]/g, '_')}_work_list.docx`
                              : `unknown_user_work_list.docx`;

    const fileStream = fs.createReadStream(filePath);

    fileStream.on('error', (err) => {
      console.error('Error reading file:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error reading file' });
      }
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=${sanitizedFileName}`);

    // Передаем поток в ответ
    fileStream.pipe(res);

    // После завершения передачи удаляем файл
    fileStream.on('end', () => {
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error deleting file:', unlinkErr);
        } else {
          console.log(`File ${filePath} deleted successfully.`);
        }
      });
    });
  } catch (error) {
    console.error('Error generating report:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error generating report' });
    }
  }
};
