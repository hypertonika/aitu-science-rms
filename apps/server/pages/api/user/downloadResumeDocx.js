const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
  // await corsMiddleware(req, res);
  // await dbConnect();
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const reportsDir = path.resolve(__dirname, '../../../services/reports');
  const filePath = path.resolve(req.query.path || '');
  const isAllowedPath = filePath.startsWith(`${reportsDir}${path.sep}`);
  const isDocx = path.extname(filePath).toLowerCase() === '.docx';

  if (!isAllowedPath || !isDocx) {
    return res.status(403).json({ message: 'Invalid file path' });
  }
  
  if (fs.existsSync(filePath)) {
    const fileName = encodeURIComponent(path.basename(filePath));
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.download(filePath);
  } else {
    res.status(404).json({ message: 'File not found' });
  }
}

// app.get('/api/user/downloadResumeDocx', (req, res) => {
//     const { path } = req.query;
//     if (fs.existsSync(path)) {
//       res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
//       res.setHeader('Content-Disposition', `attachment; filename=${path}`);
//       res.download(path);
//     } else {
//       res.status(404).json({ message: 'File not found' });
//     }
//   });
