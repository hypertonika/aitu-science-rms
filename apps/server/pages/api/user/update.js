const { User } = require('../../../models');
const { verifyToken } = require('../../../middleware/auth');

const editableFields = [
  'fullName',
  'scopusId',
  'wosId',
  'orcid',
  'birthDate',
  'phone',
  'email',
  'researchArea',
  'higherSchool',
];

module.exports = async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await new Promise((resolve, reject) =>
      verifyToken(req, res, (err) => (err ? reject(err) : resolve()))
    );

    const user = await User.findOne({ iin: req.user.iin });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    for (const field of editableFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        user[field] = req.body[field];
      }
    }

    if (['private', 'institutional', 'public'].includes(req.body.profileVisibility)) {
      user.profileVisibility = req.body.profileVisibility;
    }

    await user.save();

    const updatedUser = await User.findOne({ iin: req.user.iin }).select('-password -refreshToken');
    return res.status(200).json({ message: 'Profile updated', user: updatedUser });
  } catch (error) {
    console.error('User profile update failed:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
