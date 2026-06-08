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
    subject: 'Сброс пароля AITU Science RMS',
    text: [
      'Вы запросили сброс пароля для AITU Science RMS.',
      '',
      `Откройте эту ссылку, чтобы задать новый пароль: ${resetUrl}`,
      '',
      'Ссылка действует 1 час. Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.',
    ].join('\n'),
    html: `
      <p>Вы запросили сброс пароля для AITU Science RMS.</p>
      <p><a href="${resetUrl}">Задать новый пароль</a></p>
      <p>Ссылка действует 1 час. Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</p>
    `,
  });
}

module.exports = {
  sendPasswordResetEmail,
};
