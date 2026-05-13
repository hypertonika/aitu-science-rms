const { User } = require('../../../models');
const Publication = require('../../../models/Publication');
const { verifyToken, authenticateAdmin } = require('../../../middleware/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Метод не разрешен' });
  }

  try {
    verifyToken(req, res, () => {
      authenticateAdmin(req, res, async () => {
        try {
          const user = await User.findOne({ iin: req.params.iin }).lean();
          if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
          }

          // 1. Найти публикации пользователя
          const publications = await Publication.find({ iin: req.params.iin });

          // 2. Сгруппировать публикации по году и посчитать количество за каждый год
          const publicationsByYear = publications.reduce((acc, pub) => {
            if (pub.year) {
              const year = parseInt(pub.year, 10);
              if (!isNaN(year)) {
                 acc[year] = (acc[year] || 0) + 1;
              }
            }
            return acc;
          }, {});

          const years = Object.keys(publicationsByYear).map(Number).sort((a, b) => a - b);

          let publicationTrend = { status: 'нет данных', rate: 'Нет данных для анализа динамики' };
          let publicationPrediction = { count: 0, basedOn: 'Нет данных для прогноза' };

          if (years.length > 1) {
            // Простой расчет тренда: разница между последним и первым годом, деленная на количество лет между ними
            const firstYear = years[0];
            const lastYear = years[years.length - 1];
            const totalPublicationsSpan = years.reduce((sum, year) => sum + publicationsByYear[year], 0);
            const numberOfYears = lastYear - firstYear;

            if (numberOfYears > 0) {
                 const averagePerYear = totalPublicationsSpan / (numberOfYears + 1); // +1 to include the first year
                 // Можно улучшить: анализировать попарно или использовать регрессию

                 // Простой тренд: разница публикаций между последними двумя годами с публикациями
                 let latestYearsWithPubs = years.slice(-2);
                 if (latestYearsWithPubs.length === 2) {
                     const [year1, year2] = latestYearsWithPubs;
                     const count1 = publicationsByYear[year1];
                     const count2 = publicationsByYear[year2];
                     const yearlyChange = (count2 - count1) / (year2 - year1);

                     publicationTrend.rate = `${yearlyChange.toFixed(1)} публикаций в год`;

                     if (yearlyChange > 0.1) { // Порог для определения роста
                         publicationTrend.status = 'growing';
                     } else if (yearlyChange < -0.1) { // Порог для определения снижения
                         publicationTrend.status = 'declining';
                     } else {
                         publicationTrend.status = 'stable';
                     }

                     // Простой прогноз: количество публикаций в последнем году + тренд
                     const predictedCount = Math.max(0, Math.round(publicationsByYear[lastYear] + yearlyChange));
                     publicationPrediction.count = predictedCount;
                     publicationPrediction.basedOn = `На основе данных за последние ${years.length} лет`;

                 } else if (years.length === 1) {
                      // Если есть публикации только за один год, тренд и прогноз сложно определить точно
                     publicationPrediction.count = publicationsByYear[lastYear]; // Прогноз = кол-во в последнем году
                     publicationPrediction.basedOn = `На основе данных за ${lastYear} год`;
                     publicationTrend.status = 'нет данных'; // Нет данных для тренда
                     publicationTrend.rate = 'Нет данных для анализа динамики';
                 }

            } else if (years.length === 1) {
                 // Публикации только за один год
                 publicationPrediction.count = publicationsByYear[lastYear];
                 publicationPrediction.basedOn = `На основе данных за ${lastYear} год`;
                 publicationTrend.status = 'нет данных';
                 publicationTrend.rate = 'Нет данных для анализа динамики';
            }

          } else if (years.length === 1) {
             // Публикации только за один год
             const lastYear = years[0];
             publicationPrediction.count = publicationsByYear[lastYear];
             publicationPrediction.basedOn = `На основе данных за ${lastYear} год`;
             publicationTrend.status = 'нет данных';
             publicationTrend.rate = 'Нет данных для анализа динамики';
          } else {
              // Нет публикаций
               publicationPrediction.count = 0;
               publicationPrediction.basedOn = 'Нет данных о публикациях';
               publicationTrend.status = 'нет данных';
               publicationTrend.rate = 'Нет данных о публикациях';
          }

          // Добавляем рассчитанные данные к объекту пользователя
           user.publicationPrediction = publicationPrediction;
           user.publicationTrend = publicationTrend;

          res.status(200).json({ user });
        } catch (error) {
          console.error('Ошибка при получении профиля пользователя:', error);
          res.status(500).json({ message: 'Ошибка сервера' });
        }
      });
    });
  } catch (error) {
    console.error('Ошибка при авторизации или аутентификации:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// app.get('/api/admin/user/:iin', verifyToken, authenticateAdmin, async (req, res) => {
//     try {
//       const user = await User.findOne({ iin: req.params.iin });
//       if (!user) {
//         return res.status(404).json({ message: 'Пользователь не найден' });
//       }
//       res.json({ user });
//     } catch (error) {
//       console.error('Ошибка при получении профиля пользователя:', error);
//       res.status(500).json({ message: 'Ошибка сервера' });
//     }
//   });
  