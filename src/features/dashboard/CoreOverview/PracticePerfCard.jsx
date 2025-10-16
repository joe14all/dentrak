import React from 'react';
import styles from './PracticePerfCard.module.css';
import { useNavigation } from '../../../contexts/NavigationContext/NavigationContext';
import { ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';

const formatCurrency = (val, compact = false) => {
  const options = { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 };
  if (compact) {
    options.notation = 'compact';
    options.maximumFractionDigits = 1;
  }
  return new Intl.NumberFormat('en-US', options).format(val || 0);
};

const PracticePerfCard = ({ practice, performance }) => {
  const { setActivePage } = useNavigation();

  const isAboveBase = performance.calculatedPay > performance.basePayOwed;
  const difference = performance.calculatedPay - performance.basePayOwed;
  
  // Calculate progress for the bar, ensuring it's between 0 and 100
  let progress = 0;
  if (performance.basePayOwed > 0) {
      progress = Math.min((performance.calculatedPay / performance.basePayOwed) * 100, 100);
  } else if (performance.calculatedPay > 0) {
      progress = 100; // If no base pay, any pay is 100% progress
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h4 className={styles.practiceTitle}>{practice.name}</h4>
        <button className={styles.detailsButton} onClick={() => setActivePage('Entries')}>
            <ExternalLink size={14} />
        </button>
      </div>
      
      <div className={styles.metrics}>
        <div className={styles.metricItem}><span>Production</span> <p>{formatCurrency(performance.productionTotal, true)}</p></div>
        <div className={styles.metricItem}><span>Collection</span> <p>{formatCurrency(performance.collectionTotal, true)}</p></div>
      </div>

      <div className={styles.analysis}>
        <div className={styles.progressBarContainer}>
            <div className={styles.progressBar} style={{ width: `${progress}%` }}></div>
        </div>
        <div className={styles.payBreakdown}>
            <p>{formatCurrency(performance.calculatedPay)} <span>Est. Pay</span></p>
            <div className={`${styles.trend} ${isAboveBase ? styles.positive : styles.negative}`}>
                {isAboveBase ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                <span>{formatCurrency(difference)}</span>
                <small>vs Base</small>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PracticePerfCard;