import { useNavigate } from 'react-router-dom';
import ComplianceGauge from './ComplianceGauge';
import styles from './Header.module.css';

const Header = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('complibot_user');
    navigate('/login');
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.userInfo}>
          <div className={styles.infoText}>
            <p className={styles.infoItem}>
              <span className={styles.label}>GSTIN:</span> {user.gstin}
            </p>
            <p className={styles.infoItem}>
              <span className={styles.label}>Shop:</span> {user.trade_name}
            </p>
            <p className={styles.infoItem}>
              <span className={styles.label}>Owner:</span> {user.legal_name}
            </p>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Logout
          </button>
        </div>
        <div className={styles.gaugeSection}>
          <ComplianceGauge score={7} maxScore={10} />
        </div>
      </div>
    </header>
  );
};

export default Header;
