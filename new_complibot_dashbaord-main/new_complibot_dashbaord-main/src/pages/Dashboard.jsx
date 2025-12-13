import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import FilingCard from '../components/FilingCard';
import NewsCard from '../components/NewsCard';
import { fetchGSTNews } from '../services/rssParser';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);

  const pendingFilings = [
    {
      id: 1,
      type: "GSTR-3B",
      month: "November 2025",
      dueDate: "2025-12-20",
      status: "pending",
      amount: "₹5,200"
    },
    {
      id: 2,
      type: "GSTR-1",
      month: "November 2025",
      dueDate: "2025-12-11",
      status: "overdue",
      amount: null
    },
    {
      id: 3,
      type: "Late Fee",
      month: "October 2025",
      dueDate: "2025-11-30",
      status: "overdue",
      amount: "₹500"
    }
  ];

  const completedFilings = [
    {
      id: 1,
      type: "GSTR-3B",
      month: "October 2025",
      filedDate: "2025-11-18",
      status: "completed",
      arn: "AA070120251234567"
    },
    {
      id: 2,
      type: "GSTR-1",
      month: "October 2025",
      filedDate: "2025-11-10",
      status: "completed",
      arn: "AA070120259876543"
    },
    {
      id: 3,
      type: "GSTR-3B",
      month: "September 2025",
      filedDate: "2025-10-19",
      status: "completed",
      arn: "AA070120251122334"
    }
  ];

  useEffect(() => {
    const userData = localStorage.getItem('complibot_user');
    
    if (!userData) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (error) {
      console.error('Failed to parse user data:', error);
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    const loadNews = async () => {
      setNewsLoading(true);
      const newsData = await fetchGSTNews();
      setNews(newsData);
      setNewsLoading(false);
    };

    loadNews();
  }, []);

  if (!user) {
    return null;
  }

  return (
    <div className={styles.container}>
      <Header user={user} />
      
      <main className={styles.main}>
        <div className={styles.grid}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Pending Dues & Filings</h2>
            <div className={styles.cardList}>
              {pendingFilings.map(filing => (
                <FilingCard key={filing.id} filing={filing} type="pending" />
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Completed Filings</h2>
            <div className={styles.cardList}>
              {completedFilings.map(filing => (
                <FilingCard key={filing.id} filing={filing} type="completed" />
              ))}
            </div>
          </section>
        </div>

        <section className={styles.newsSection}>
          <h2 className={styles.sectionTitle}>Latest GST News & Updates</h2>
          {newsLoading ? (
            <p className={styles.loading}>Loading news...</p>
          ) : news.length > 0 ? (
            <div className={styles.newsList}>
              {news.map((item, index) => (
                <NewsCard key={index} news={item} />
              ))}
            </div>
          ) : (
            <p className={styles.noNews}>Unable to load latest news</p>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
