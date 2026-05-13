const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
  // await corsMiddleware(req, res);
  // await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const filePath = path.resolve(req.query.path);
  
  if (fs.existsSync(filePath)) {
    const fileName = encodeURIComponent(path.basename(filePath));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.download(filePath);
  } else {
    res.status(404).json({ message: 'File not found' });
  }
}


// app.get('/api/user/downloadResumePdf', (req, res) => {
//     const { path } = req.query;
//     if (fs.existsSync(path)) {
//       res.setHeader('Content-Type', 'application/pdf');
//       res.setHeader('Content-Disposition', `attachment; filename=${path}`);
//       res.download(path);
//     } else {
//       res.status(404).json({ message: 'File not found' });
//     }
//   });
  
//   app.get('/api/user/downloadResumePdf', (req, res) => {
//     const filePath = path.resolve(req.query.path);
//     if (fs.existsSync(filePath)) {
//       const fileName = encodeURIComponent(path.basename(filePath));
//       res.setHeader('Content-Type', 'application/pdf');
//       res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
//       res.download(filePath);
//     } else {
//       res.status(404).json({ message: 'File not found' });
//     }
//   });
  