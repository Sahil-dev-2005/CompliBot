import styles from './FilingCard.module.css';

const FilingCard = ({ filing, type }) => {
  const getDaysInfo = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} days overdue`, class: 'overdue' };
    } else if (diffDays === 0) {
      return { text: 'Due today', class: 'pending' };
    } else {
      return { text: `${diffDays} days remaining`, class: 'pending' };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (type === 'pending') {
    const daysInfo = getDaysInfo(filing.dueDate);
    
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <h3 className={styles.type}>{filing.type}</h3>
          <span className={`${styles.badge} ${styles[daysInfo.class]}`}>
            {filing.status}
          </span>
        </div>
        <div className={styles.details}>
          <p className={styles.month}>{filing.month}</p>
          <p className={styles.dueDate}>Due: {formatDate(filing.dueDate)}</p>
          <p className={`${styles.daysInfo} ${styles[daysInfo.class]}`}>
            {daysInfo.text}
          </p>
          {filing.amount && (
            <p className={styles.amount}>{filing.amount}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.type}>{filing.type}</h3>
        <span className={`${styles.badge} ${styles.completed}`}>
          ✓
        </span>
      </div>
      <div className={styles.details}>
        <p className={styles.month}>{filing.month}</p>
        <p className={styles.filedDate}>Filed: {formatDate(filing.filedDate)}</p>
        <p className={styles.arn}>ARN: {filing.arn}</p>
      </div>
    </div>
  );
};

export default FilingCard;
