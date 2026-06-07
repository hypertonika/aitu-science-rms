const nodemailer = require('nodemailer');

function getSmtpPort() {
  return Number.parseInt(process.env.SMTP_PORT || '587', 10);
}

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('SMTP is not configured');
  }

  return nodemailer.createTransport({
    host,
    port: getSmtpPort(),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user,
      pass,
    },
  });
}

function getMailFrom() {
  return process.env.SMTP_FROM || process.env.SMTP_USER;
}

async function sendPasswordResetEmail({ to, resetUrl }) {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: getMailFrom(),
    to,
    subject: 'Reset your AITU Science RMS password',
    text: [
      'You requested a password reset for AITU Science RMS.',
      '',
      `Open this link to set a new password: ${resetUrl}`,
      '',
      'This link expires in 1 hour. If you did not request it, you can ignore this email.',
    ].join('\n'),
    html: `
      <p>You requested a password reset for AITU Science RMS.</p>
      <p><a href="${resetUrl}">Set a new password</a></p>
      <p>This link expires in 1 hour. If you did not request it, you can ignore this email.</p>
    `,
  });
}

module.exports = {
  sendPasswordResetEmail,
};
