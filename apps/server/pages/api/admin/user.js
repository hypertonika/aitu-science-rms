const { User } = require('../../../models');
const Publication = require('../../../models/Publication');
const { verifyToken, authenticateAdmin } = require('../../../middleware/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await new Promise((resolve, reject) =>
      verifyToken(req, res, (err) => (err ? reject(err) : resolve()))
    );
    await new Promise((resolve, reject) =>
      authenticateAdmin(req, res, (err) => (err ? reject(err) : resolve()))
    );

    const user = await User.findOne({ iin: req.params.iin })
      .select('-password -refreshToken -passwordResetTokenHash -passwordResetExpires')
      .lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const publications = await Publication.find({ iin: req.params.iin });
    const publicationsByYear = publications.reduce((acc, publication) => {
      const year = Number.parseInt(publication.year, 10);
      if (!Number.isNaN(year)) {
        acc[year] = (acc[year] || 0) + 1;
      }
      return acc;
    }, {});

    const years = Object.keys(publicationsByYear).map(Number).sort((a, b) => a - b);
    const publicationTrend = calculateTrend(years, publicationsByYear);
    const publicationPrediction = calculatePrediction(years, publicationsByYear, publicationTrend.yearlyChange);

    return res.status(200).json({
      user: {
        ...user,
        publicationTrend,
        publicationPrediction,
      },
    });
  } catch (error) {
    console.error('Admin user profile fetch failed:', error);
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Server error' });
    }
  }
};

function calculateTrend(years, publicationsByYear) {
  if (years.length < 2) {
    return {
      status: 'no data',
      rate: 'Not enough yearly data for trend analysis',
      yearlyChange: 0,
    };
  }

  const [previousYear, latestYear] = years.slice(-2);
  const yearGap = latestYear - previousYear || 1;
  const yearlyChange = (publicationsByYear[latestYear] - publicationsByYear[previousYear]) / yearGap;

  let status = 'stable';
  if (yearlyChange > 0.1) status = 'growing';
  if (yearlyChange < -0.1) status = 'declining';

  return {
    status,
    rate: `${yearlyChange.toFixed(1)} publications per year`,
    yearlyChange,
  };
}

function calculatePrediction(years, publicationsByYear, yearlyChange) {
  if (years.length === 0) {
    return { count: 0, basedOn: 'No publication data available' };
  }

  const latestYear = years[years.length - 1];
  return {
    count: Math.max(0, Math.round(publicationsByYear[latestYear] + yearlyChange)),
    basedOn: `Based on publication data through ${latestYear}`,
  };
}
