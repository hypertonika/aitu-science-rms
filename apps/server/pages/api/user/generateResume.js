const { User } = require('../../../models');
const Publication = require('../../../models/Publication');
const { generateUserResume, generateUserResumePDF } = require('../../../services/resumeGenerator');
const { verifyToken } = require('../../../middleware/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await new Promise((resolve, reject) =>
      verifyToken(req, res, (err) => (err ? reject(err) : resolve()))
    );

    const targetIin = req.user.role === 'admin' && req.body.iin ? req.body.iin : req.user.iin;
    const user = await User.findOne({ iin: targetIin }).select('-password -refreshToken');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const publications = await Publication.find({ iin: targetIin, status: 'approved' }).sort({ year: -1 });
    const resumePathDocx = await generateUserResume(user, publications);
    const resumePathPdf = await generateUserResumePDF(user, publications);

    return res.status(200).json({
      success: true,
      docxPath: resumePathDocx,
      pdfPath: resumePathPdf,
    });
  } catch (error) {
    console.error('Resume generation failed:', error);
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Could not generate resume' });
    }
  }
};
