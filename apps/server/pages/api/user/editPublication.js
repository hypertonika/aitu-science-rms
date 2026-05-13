const { Publication } = require('../../../models');
const jwt = require('jsonwebtoken');

module.exports = async function handler(req, res) {
  if (req.method !== 'PUT') {
    console.error('Метод не разрешен');
    return res.status(405).json({ message: 'Метод не разрешен' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('Ошибка авторизации: токен отсутствует или некорректный');
    return res.status(401).json({ message: 'Отсутствует токен авторизации' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secretKey = process.env.JWT_SECRET || 'defaultSecretKey';
    const decoded = jwt.verify(token, secretKey);
    const iin = decoded.iin;

    // Проверка публикации
    // const { id } = req.query;
    // Обновление только переданных полей
    const {
      id,
      authors,
      title,
      year,
      output,
      doi,
      isbn,
      scopus,
      wos,
      publicationType,
    } = req.body;

    const publication = await Publication.findOne({ _id: id, iin });
    if (!publication) {
        console.error('Публикация не найдена или доступ запрещен');
        return res.status(404).json({ message: 'Публикация не найдена или доступ запрещен' });
      }
  

    publication.authors = authors || publication.authors;
    publication.title = title || publication.title;
    publication.year = year || publication.year;
    publication.output = output || publication.output;
    publication.doi = doi || publication.doi;
    publication.isbn = isbn || publication.isbn;
    publication.scopus = scopus !== undefined ? scopus : publication.scopus;
    publication.wos = wos !== undefined ? wos : publication.wos;
    publication.publicationType = publicationType || publication.publicationType;

    await publication.save();

    console.log('Публикация успешно обновлена');
    res.status(200).json({ message: 'Публикация успешно обновлена', publication });
  } catch (error) {
    console.error('Ошибка при обновлении публикации:', error);
    res.status(500).json({ message: 'Произошла ошибка на сервере. Попробуйте позже.' });
  }
};