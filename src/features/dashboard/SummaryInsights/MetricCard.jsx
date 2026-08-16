import React from 'react';
import styles from './MetricCard.module.css'; // Assuming this is MetricCard.module.css

// Accept trendIndicator and goalIndicator as direct JSX props
const MetricCard = ({ title, value, trendNote, trendIndicator, goalIndicator, children }) => (
    <div className={styles.metricCard}>
        {/* UPDATED: Header is now a grid container */}
        <div className={styles.metricHeader}>
          {/* Column 1: Title */}
          <div className={styles.metricTitleGroup}>
            <h4 className={styles.metricTitle}>{title}</h4>
          </div>

          {/* Column 2: Stacked Indicators */}
          {(trendIndicator || goalIndicator || trendNote) && (
            <div className={styles.indicatorContainer}>
                {trendIndicator}
                {trendNote && <span className={styles.metricHeaderNote}>{trendNote}</span>}
                {goalIndicator}
            </div>
          )}
        </div>

        {/* Value remains separate, below the header grid */}
        <p className={styles.metricValue}>{value}</p>

        {/* Breakdown section */}
        <div className={styles.breakdown}>{children}</div>
    </div>
);

export default MetricCard;