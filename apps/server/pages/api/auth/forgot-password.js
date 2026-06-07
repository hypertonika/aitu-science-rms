const crypto = require('crypto');
const { User } = require('../../../models');
const { sendPasswordResetEmail } = require('../../../services/mailer');

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getFrontendUrl() {
  return (
    process.env.FRONTEND_URL ||
    process.env.PRODUCTION_ORIGIN ||
    process.env.LOCAL_ORIGIN ||
    'http://localhost:5173'
  ).replace(/\/$/, '');
}

function buildResetUrl(token) {
  const url = new URL('/reset-password', getFrontendUrl());
  url.searchParams.set('token', token);
  return url.toString();
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const email = String(req.body.email || '').trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Use a valid email address' });
  }

  try {
    const user = await User.findOne({
      $or: [
        { email },
        { iin: email },
      ],
    });

    if (!user) {
      return res.status(200).json({
        message: 'If an account exists for this email, a password reset link has been sent.',
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.passwordResetTokenHash = hashToken(token);
    user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await user.save();

    await sendPasswordResetEmail({
      to: user.email || email,
      resetUrl: buildResetUrl(token),
    });

    return res.status(200).json({
      message: 'If an account exists for this email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Password reset email failed:', error);
    return res.status(500).json({ message: 'Could not send password reset email' });
  }
};
