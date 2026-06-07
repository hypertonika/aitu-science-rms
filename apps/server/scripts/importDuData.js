const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');
const Publication = require('../models/Publication');
const { User } = require('../models');
const { addNormalizedPublicationFields } = require('../services/publicationUtils');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const IMPORT_SOURCE = 'du.astanait.edu.kz';
const PLACEHOLDER_PASSWORD_LENGTH = 32;

function parseArgs(argv) {
  const args = {
    dryRun: process.env.DU_IMPORT_DRY_RUN === 'true',
    _: [],
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--dry-run') {
      args.dryRun = true;
      continue;
    }

    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      args[key] = argv[index + 1];
      index += 1;
      continue;
    }

    args._.push(arg);
  }

  return args;
}

function requireFile(args, key, envKey, position) {
  const value = args[key] || args._[position] || process.env[envKey];
  if (!value) {
    throw new Error(`Missing --${key}, positional file #${position + 1}, or ${envKey}`);
  }
  return path.resolve(value);
}

function readJsonArray(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!Array.isArray(data)) {
    throw new Error(`${filePath} must contain a JSON array`);
  }
  return data;
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeList(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item || '').trim()).filter(Boolean)
    : [];
}

function normalizeHigherSchool(value) {
  const firstPart = String(value || '').split('/')[0].trim();
  return firstPart.startsWith('School of ') ? firstPart : '';
}

function parseMongoDate(value) {
  const rawValue = value && typeof value === 'object' && value.$date ? value.$date : value;
  if (!rawValue) return null;

  const date = new Date(rawValue);
  return Number.isNaN(date.getTime()) ? null : date;
}

function extractYear(...values) {
  for (const value of values) {
    const match = String(value || '').match(/\b(19|20)\d{2}\b/);
    if (match) return match[0];
  }
  return 'Unknown';
}

function normalizePublicationType(type) {
  const value = String(type || '').trim().toLowerCase();

  if (value.includes('scopus') || value.includes('web of science')) {
    return 'scopus_wos';
  }

  if (value.includes('коксон')) {
    return 'koknvo';
  }

  return 'articles';
}

function getRawLink(article) {
  return article.raw?.['Link or DOI'] || article.raw?.['Link'] || null;
}

function cleanDoi(value) {
  const prepared = String(value || '')
    .trim()
    .replace(/doi\s+org/gi, 'doi.org')
    .replace(/doi\/(?=10\.)/gi, 'doi.org/');

  const match = prepared.match(/\b10\.\d{4,9}\/[^\s"'<>]+/i);
  if (!match) return '';

  return match[0]
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/[),.;]+$/g, '')
    .trim();
}

function cleanUrl(value) {
  const text = String(value || '').trim();
  if (!/^https?:\/\//i.test(text)) return '';
  return text;
}

function getArticleLinkData(article) {
  const rawLink = getRawLink(article);
  const candidates = [
    article.doi,
    rawLink?.href,
    rawLink?.text,
  ];

  const doi = candidates.map(cleanDoi).find(Boolean) || '';
  const externalUrl = candidates.map(cleanUrl).find(Boolean) || '';

  return { doi, externalUrl };
}

function getGoogleScholarId(profile) {
  if (profile.scientificWorkId) return profile.scientificWorkId;

  const url = new URL(profile.url || 'https://example.com');
  return url.searchParams.get('user') || '';
}

function buildProfileMap(profiles) {
  return profiles.reduce((map, profile) => {
    if (!profile.duTeacherId) return map;

    if (!map.has(profile.duTeacherId)) {
      map.set(profile.duTeacherId, []);
    }

    map.get(profile.duTeacherId).push(profile);
    return map;
  }, new Map());
}

function applyResearchProfiles(userData, profiles = []) {
  for (const profile of profiles) {
    const platform = String(profile.platformType || '').trim().toLowerCase();
    const id = String(profile.scientificWorkId || '').trim();
    const url = String(profile.url || profile.raw?.['Scientific work url']?.href || '').trim();
    const hIndex = String(profile.hIndex || '').trim();

    if (platform === 'scopus') {
      if (id) userData.scopusId = id;
      if (url) userData.scopusUrl = url;
      if (hIndex) userData.scopusHIndex = hIndex;
    }

    if (platform === 'web of science') {
      if (id) userData.wosId = id;
      if (url) userData.wosUrl = url;
      if (hIndex) userData.wosHIndex = hIndex;
    }

    if (platform === 'orcid') {
      if (id) userData.orcid = id;
      if (url) userData.orcidUrl = url;
    }

    if (platform === 'google scholar') {
      const googleScholarId = getGoogleScholarId(profile);
      if (googleScholarId) userData.googleScholarId = googleScholarId;
      if (url) userData.googleScholarUrl = url;
      if (hIndex) userData.googleScholarHIndex = hIndex;
    }
  }
}

async function importTeachers({ teachers, profileMap, dryRun }) {
  const passwordHash = await bcrypt.hash(
    Math.random().toString(36).slice(2).padEnd(PLACEHOLDER_PASSWORD_LENGTH, 'x'),
    10
  );
  const summary = { created: 0, updated: 0, skipped: 0 };
  const usersByDuTeacherId = new Map();

  for (const teacher of teachers) {
    const email = normalizeEmail(teacher.email);

    if (!teacher.duTeacherId || !email) {
      summary.skipped += 1;
      continue;
    }

    const userData = {
      iin: email,
      email,
      fullName: teacher.fullName || teacher.fullNameEn || email,
      fullNameEn: teacher.fullNameEn || '',
      higherSchool: normalizeHigherSchool(teacher.higherSchool),
      researchArea: normalizeList(teacher.scientificInterests).join(', '),
      scientificInterests: normalizeList(teacher.scientificInterests),
      teachingDisciplines: normalizeList(teacher.teachingDisciplines),
      academicStatus: teacher.academicStatus || '',
      scientificDegree: teacher.scientificDegree || '',
      position: teacher.position || '',
      duTeacherId: String(teacher.duTeacherId),
      duProfileUrl: teacher.profileUrl || '',
      importedFrom: IMPORT_SOURCE,
      importedAt: new Date(),
    };

    applyResearchProfiles(userData, profileMap.get(String(teacher.duTeacherId)));

    const existingUser = await User.findOne({
      $or: [
        { duTeacherId: String(teacher.duTeacherId) },
        { email },
        { iin: email },
      ],
    });

    let user = existingUser;

    if (dryRun) {
      summary[existingUser ? 'updated' : 'created'] += 1;
      usersByDuTeacherId.set(String(teacher.duTeacherId), {
        _id: existingUser?._id,
        iin: email,
        fullName: userData.fullName,
        email,
      });
      continue;
    }

    if (existingUser) {
      existingUser.set(userData);
      user = await existingUser.save();
      summary.updated += 1;
    } else {
      user = await User.create({
        ...userData,
        password: passwordHash,
        role: 'user',
        profileVisibility: 'institutional',
      });
      summary.created += 1;
    }

    usersByDuTeacherId.set(String(teacher.duTeacherId), user);
  }

  return { summary, usersByDuTeacherId };
}

async function importArticles({ articles, usersByDuTeacherId, dryRun }) {
  const summary = { created: 0, updated: 0, skipped: 0 };

  for (const article of articles) {
    const duTeacherId = String(article.duTeacherId || '');
    const user = usersByDuTeacherId.get(duTeacherId);

    if (!user || !article.articleId || !article.title) {
      summary.skipped += 1;
      continue;
    }

    const publicationDate = parseMongoDate(article.publicationDate);
    const { doi, externalUrl } = getArticleLinkData(article);
    const year = extractYear(article.publicationDate, article.title, article.raw?.['Full citation: Authors, Title, Journal, Year, Pages. DOI']);

    const publicationData = addNormalizedPublicationFields({
      iin: user.iin || user.email,
      userId: user._id,
      authors: user.fullName || user.email,
      title: String(article.title).trim(),
      year,
      output: article.raw?.['Full citation: Authors, Title, Journal, Year, Pages. DOI'] || '',
      doi,
      source: 'du',
      externalUrl,
      publicationDate,
      duArticleId: String(article.articleId),
      duTeacherId,
      publicationType: normalizePublicationType(article.type),
      status: 'approved',
      visibility: 'institutional',
      importedFrom: IMPORT_SOURCE,
      importedAt: new Date(),
      scopus: normalizePublicationType(article.type) === 'scopus_wos',
      wos: normalizePublicationType(article.type) === 'scopus_wos',
    });

    const existingPublication = await Publication.findOne({
      $or: [
        { duArticleId: String(article.articleId) },
        {
          iin: publicationData.iin,
          titleNormalized: publicationData.titleNormalized,
          year: publicationData.year,
        },
      ],
    });

    if (dryRun) {
      summary[existingPublication ? 'updated' : 'created'] += 1;
      continue;
    }

    if (existingPublication) {
      existingPublication.set(publicationData);
      await existingPublication.save();
      summary.updated += 1;
    } else {
      await Publication.create(publicationData);
      summary.created += 1;
    }
  }

  return summary;
}

async function main() {
  const args = parseArgs(process.argv);
  const teachersPath = requireFile(args, 'teachers', 'DU_TEACHERS_JSON', 0);
  const articlesPath = requireFile(args, 'articles', 'DU_TEACHER_ARTICLES_JSON', 1);
  const profilesPath = requireFile(args, 'profiles', 'DU_RESEARCH_PROFILES_JSON', 2);

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required');
  }

  const teachers = readJsonArray(teachersPath);
  const articles = readJsonArray(articlesPath);
  const profiles = readJsonArray(profilesPath);
  const profileMap = buildProfileMap(profiles);

  await mongoose.connect(process.env.MONGO_URI);

  const teacherResult = await importTeachers({
    teachers,
    profileMap,
    dryRun: args.dryRun,
  });
  const articleSummary = await importArticles({
    articles,
    usersByDuTeacherId: teacherResult.usersByDuTeacherId,
    dryRun: args.dryRun,
  });

  console.log(JSON.stringify({
    dryRun: args.dryRun,
    teachers: teacherResult.summary,
    articles: articleSummary,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
