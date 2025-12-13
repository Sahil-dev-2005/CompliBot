import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import styles from './ComplianceGauge.module.css';

const ComplianceGauge = ({ score, maxScore }) => {
  const percentage = (score / maxScore) * 100;
  
  const getColor = () => {
    if (percentage > 70) return '#C6CFD2';
    if (percentage >= 50) return '#DA1C25';
    return '#DA1C25';
  };

  return (
    <div className={styles.gaugeContainer}>
      <div className={styles.gauge}>
        <CircularProgressbar
          value={percentage}
          text={`${score}/${maxScore}`}
          styles={buildStyles({
            textSize: '20px',
            pathColor: getColor(),
            textColor: '#ffffff',
            trailColor: '#473437',
          })}
        />
      </div>
      <p className={styles.label}>Compliance Score</p>
    </div>
  );
};

export default ComplianceGauge;
