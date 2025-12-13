import { GST_NEWS_FEED } from '../config';

export const fetchGSTNews = async () => {
  try {
    const response = await fetch(GST_NEWS_FEED);
    const xmlText = await response.text();
    
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    const entries = xmlDoc.getElementsByTagName('entry');
    const newsItems = Array.from(entries).slice(0, 5).map(entry => {
      const title = entry.getElementsByTagName('title')[0]?.textContent || '';
      const link = entry.getElementsByTagName('link')[0]?.getAttribute('href') || '';
      const updated = entry.getElementsByTagName('updated')[0]?.textContent || '';
      const summary = entry.getElementsByTagName('summary')[0]?.textContent || '';
      
      return {
        title,
        link,
        date: updated,
        summary,
        author: 'GST India'
      };
    });
    
    return newsItems;
  } catch (error) {
    console.error('Failed to fetch GST news:', error);
    return [];
  }
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};
