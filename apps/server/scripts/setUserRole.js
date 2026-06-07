const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const { User } = require('../models');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const allowedRoles = ['user', 'admin'];

async function main() {
  const email = String(process.argv[2] || '').trim().toLowerCase();
  const role = String(process.argv[3] || 'admin').trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Usage: node scripts/setUserRole.js user@example.com admin');
  }

  if (!allowedRoles.includes(role)) {
    throw new Error(`Role must be one of: ${allowedRoles.join(', ')}`);
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required');
  }

  await mongoose.connect(process.env.MONGO_URI);

  const user = await User.findOne({
    $or: [
      { email },
      { iin: email },
    ],
  });

  if (!user) {
    throw new Error(`User not found: ${email}`);
  }

  user.role = role;
  user.refreshToken = undefined;
  await user.save();

  console.log(`${email} is now ${role}`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
