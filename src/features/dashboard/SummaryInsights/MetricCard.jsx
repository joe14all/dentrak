import React from 'react';
import styles from './MetricCard.module.css';
import { TrendingUp, TrendingDown } from 'lucide-react';

const MetricCard = ({ title, value, trend, trendDirection, children }) => (
    <div className={styles.metricCard}>
        <div className={styles.metricHeader}>
          <span className={styles.metricTitle}>{title}</span>
           {trend && (
                <div className={`${styles.trendIndicator} ${styles[trendDirection]}`}>
                    {trendDirection === 'positive' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span>{trend}</span>
                </div>
            )}
        </div>
        <p className={styles.metricValue}>{value}</p>
        <div className={styles.breakdown}>{children}</div>
    </div>
);

export default MetricCard;
