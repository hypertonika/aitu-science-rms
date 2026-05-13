import axios from 'axios';

const CROSSREF_API_BASE = 'https://api.crossref.org';
const API_URL = import.meta.env.VITE_API_URL;
const EMAIL = 'your-email@aiu.edu.kz'; // Рекомендуется указать email для лучшего обслуживания

class CrossrefService {
  constructor() {
    this.api = axios.create({
      baseURL: CROSSREF_API_BASE,
      headers: {
        'User-Agent': `AIUScience (mailto:${EMAIL})`,
      }
    });
    // Привязываем контекст this к методам
    this.transformCrossrefWork = this.transformCrossrefWork.bind(this);
  }

  // Поиск публикаций по DOI
  async getWorkByDOI(doi) {
    try {
      const response = await axios.get(`${API_URL}/api/integrations/crossref/work`, {
        params: { doi },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching work by DOI:', error);
      throw error;
    }
  }

  // Поиск публикаций по автору или DOI
  async searchWorksByAuthor(query) {
    try {
      // Проверяем, похож ли запрос на DOI
      const isDOI = query.includes('/') || query.includes('10.');
      
      let response;
      if (isDOI) {
        // Если это похоже на DOI, используем точный поиск по DOI
        response = await this.api.get('/works', {
          params: {
            'filter': `doi:${query}`,
            'rows': 20,
            'select': 'DOI,title,author,published-print,published-online,type,container-title,is-referenced-by-count'
          }
        });
      } else {
        // Иначе ищем по автору
        response = await this.api.get('/works', {
          params: {
            'query.author': query,
            'rows': 20,
            'select': 'DOI,title,author,published-print,published-online,type,container-title,is-referenced-by-count'
          }
        });
      }

      // Фильтруем null значения после трансформации
      const transformed = response.data.message.items
        .map(item => this.transformCrossrefWork(item))
        .filter(item => item !== null);

      return transformed;
    } catch (error) {
      console.error('Error searching works:', error);
      throw error;
    }
  }

  // Преобразование данных из формата Crossref в формат нашего приложения
  transformCrossrefWork(work) {
    if (!work) {
      console.warn('Empty work object received');
      return null;
    }

    try {
      return {
        title: work.title ? work.title[0] : '',
        doi: work.DOI,
        authors: work.author ? work.author.map(a => `${a.given || ''} ${a.family || ''}`).join(', ').trim() : '',
        year: this.extractYear(work),
        type: this.mapPublicationType(work.type),
        journal: work['container-title'] ? work['container-title'][0] : '',
        citations: work['is-referenced-by-count'] || 0
      };
    } catch (error) {
      console.error('Error transforming work:', error, work);
      return null;
    }
  }

  // Извлечение года публикации
  extractYear(work) {
    try {
      if (work['published-print'] && work['published-print']['date-parts'] && work['published-print']['date-parts'][0]) {
        return work['published-print']['date-parts'][0][0];
      }
      if (work['published-online'] && work['published-online']['date-parts'] && work['published-online']['date-parts'][0]) {
        return work['published-online']['date-parts'][0][0];
      }
      if (work['created'] && work['created']['date-parts'] && work['created']['date-parts'][0]) {
        return work['created']['date-parts'][0][0];
      }
      return null;
    } catch (error) {
      console.warn('Error extracting year:', error);
      return null;
    }
  }

  // Маппинг типов публикаций Crossref на наши типы
  mapPublicationType(crossrefType) {
    if (!crossrefType) {
      console.warn('No publication type provided');
      return 'articles';
    }

    const typeMap = {
      'journal-article': 'articles',
      'proceedings-article': 'conference',
      'book': 'books',
      'book-chapter': 'books',
      'posted-content': 'articles',
      'dissertation': 'articles',
      'peer-review': 'articles',
      'reference-entry': 'articles',
      'dataset': 'articles'
    };
    return typeMap[crossrefType] || 'articles';
  }
}

export const crossrefService = new CrossrefService(); 
