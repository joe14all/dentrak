import React from 'react';
import styles from './MetricCard.module.css';
import { TrendingUp, TrendingDown } from 'lucide-react';

const MetricCard = ({ title, value, trend, trendDirection, children }) => (
    // The card now has a flex column layout to ensure consistent alignment
    <div className={styles.metricCard}>
        <div className={styles.metricHeader}>
          <h4 className={styles.metricTitle}>{title}</h4>
           {trend && (
                // The trend indicator is now a self-contained "pill" for better visual parsing
                <div className={`${styles.trendIndicator} ${styles[trendDirection]}`}>
                    {trendDirection === 'positive' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span>{trend}</span>
                </div>
            )}
        </div>
        <p className={styles.metricValue}>{value}</p>
        {/* The breakdown section is now styled to handle its content gracefully */}
        <div className={styles.breakdown}>{children}</div>
    </div>
);

export default MetricCard;