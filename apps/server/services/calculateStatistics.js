const { User } = require('../models');
const Publication = require('../models/Publication');

async function calculateStatistics() {
  try {
    const users = await User.find({});
    const publications = await Publication.find({ status: 'approved' });

    const statistics = {
      totalPublications: publications.length,
      totalUsers: users.length,
      schools: {}, // To track publications by higher schools
      publicationTypes: {}, // To track publications by type
    };

    // Count publications by school and type
    for (const pub of publications) {
      // By higher school
      const user = users.find((user) => user.iin === pub.iin);
      const school = user?.higherSchool || 'Неизвестная школа';
      statistics.schools[school] = (statistics.schools[school] || 0) + 1;

      // By publication type
      statistics.publicationTypes[pub.publicationType] = 
        (statistics.publicationTypes[pub.publicationType] || 0) + 1;
    }

    return statistics;
  } catch (error) {
    console.error('Error calculating statistics:', error);
    throw new Error('Error calculating statistics');
  }
}

module.exports = { calculateStatistics };
