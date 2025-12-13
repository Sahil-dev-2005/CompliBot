import styles from './NewsCard.module.css';
import { formatDate } from '../services/rssParser';

const NewsCard = ({ news }) => {
  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{truncateText(news.title, 80)}</h3>
      <p className={styles.meta}>
        By {news.author} • {formatDate(news.date)}
      </p>
      <p className={styles.summary}>{truncateText(news.summary, 150)}</p>
      <a 
        href={news.link} 
        target="_blank" 
        rel="noopener noreferrer" 
        className={styles.link}
      >
        Read More →
      </a>
    </div>
  );
};

export default NewsCard;
