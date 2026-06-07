const mongoose = require('mongoose');

// // Подключение к базе данных MongoDB
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log('Успешное подключение к MongoDB'))
//   .catch((error) => console.error('Ошибка подключения к MongoDB:', error));

// Определение модели пользователя
const userSchema = new mongoose.Schema({
  iin: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  profileVisibility: {
    type: String,
    enum: ['private', 'institutional', 'public'],
    default: 'institutional',
  },
  profilePhoto: {
    type: String,
  },
  scopusId: String,
  wosId: String,
  orcid: String,
  birthDate: String,
  phone: String,
  email: {
    type: String,
    trim: true,
    lowercase: true,
    index: true,
  },
  researchArea: String,
  duTeacherId: {
    type: String,
    index: true,
    unique: true,
    sparse: true,
  },
  duProfileUrl: String,
  fullNameEn: String,
  position: String,
  scientificDegree: String,
  academicStatus: String,
  scientificInterests: {
    type: [String],
    default: [],
  },
  teachingDisciplines: {
    type: [String],
    default: [],
  },
  scopusUrl: String,
  scopusHIndex: String,
  wosUrl: String,
  wosHIndex: String,
  orcidUrl: String,
  googleScholarId: String,
  googleScholarUrl: String,
  googleScholarHIndex: String,
  importedFrom: String,
  importedAt: Date,
  refreshToken: {
    type: String,
  },
  passwordResetTokenHash: {
    type: String,
  },
  passwordResetExpires: {
    type: Date,
  },
  fullName: { type: String },
  higherSchool: { type: String },
});

const User = mongoose.model('User', userSchema);

module.exports = { User };
