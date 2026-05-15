const { User } = require('../../../models');
const Publication = require('../../../models/Publication');
const { generateAllPublicationsReport } = require('../../../services/reportGenerator');
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

  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const { higherSchool = 'all' } = req.body;
    const publicationsByUser = {};
    let users;
    if (higherSchool && higherSchool !== 'all') {
      users = await User.find({ higherSchool });
    } else {
      users = await User.find({});
    }
  
    for (const user of users) {
      publicationsByUser[user.iin] = {
        user,
        publications: await Publication.find({ iin: user.iin, status: 'approved' }),
      };
    }

    const filePath = await generateAllPublicationsReport(publicationsByUser, higherSchool);

    if (fs.existsSync(filePath)) {
      const safeSchool = encodeURIComponent(higherSchool || 'school');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename=all_publications_${safeSchool}_${new Date().getFullYear()}.docx`);
      
      res.download(filePath, (err) => {
        if (err) {
          console.error('Error sending file:', err);
          res.status(500).json({ message: 'Error sending file' });
        }
      });
    } else {
      console.error('File not found:', filePath);
      res.status(404).json({ message: 'Report file not found' });
    }
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Error generating report' });
  }
}

// app.post('/api/admin/generateAllPublicationsReport', verifyToken, async (req, res) => {
//     const publicationsByUser = {};
  
//     try {
//       const users = await User.find({});
    
//       for (const user of users) {
//         publicationsByUser[user.iin] = {
//           user,
//           publications: await Publication.find({ iin: user.iin }),
//         };
//       }
  
//       const filePath = await generateAllPublicationsReport(publicationsByUser);
  
//       if (fs.existsSync(filePath)) {
//         res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
//         res.setHeader('Content-Disposition', `attachment; filename=all_publications_${new Date().getFullYear()}.docx`);
        
//         res.download(filePath, (err) => {
//           if (err) {
//             console.error('Error sending file:', err);
//             res.status(500).json({ message: 'Error sending file' });
//           }
//         });
//       } else {
//         console.error('File not found:', filePath);
//         res.status(404).json({ message: 'Report file not found' });
//       }
//     } catch (error) {
//       console.error('Error generating report:', error);
//       res.status(500).json({ message: 'Error generating report' });
//     }
//   });
