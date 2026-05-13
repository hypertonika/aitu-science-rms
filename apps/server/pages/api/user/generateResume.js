const { User } = require('../../../models');
const Publication = require('../../../models/Publication');
const { generateUserResume, generateUserResumePDF } = require('../../../services/resumeGenerator');
const { verifyToken } = require('../../../middleware/auth');

module.exports = async function handler(req, res) {
  // await corsMiddleware(req, res);
  // await dbConnect();
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  if (!verifyToken(req, res)) return; // Middleware to verify token

  const { iin } = req.body;

  try {
    const user = await User.findOne({ iin });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const publications = await Publication.find({ iin });
    const resumePathDocx = await generateUserResume(user, publications);
    const resumePathPdf = await generateUserResumePDF(user, publications);

    res.status(200).json({ success: true, docxPath: resumePathDocx, pdfPath: resumePathPdf });
  } catch (error) {
    console.error('Error generating resume:', error);
    res.status(500).json({ message: 'Error generating resume' });
  }
}

// app.post('/api/user/generateResume', verifyToken, async (req, res) => {
//     const { iin } = req.body;
//     try {
//       const user = await User.findOne({ iin });
//       if (!user) return res.status(404).json({ message: 'User not found' });
  
//       const publications = await Publication.find({ iin });
//       const resumePathDocx = await generateUserResume(user, publications);
//       const resumePathPdf = await generateUserResumePDF(user, publications);
//       console.log(resumePathDocx);
  
//       res.status(200).json({ success: true, docxPath: resumePathDocx, pdfPath: resumePathPdf });
//     } catch (error) {
//       console.error('Error generating resume:', error);
//       res.status(500).json({ message: 'Error generating resume' });
//     }
//   });