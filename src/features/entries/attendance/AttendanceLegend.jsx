import React from 'react';
import styles from './AttendanceLegend.module.css';

const AttendanceLegend = ({ practices, colorMap }) => {
  return (
    <div className={styles.legendContainer}>
      <h4 className={styles.title}>Practices</h4>
      <div className={styles.legendItems}>
        {practices.map(practice => (
          <div key={practice.id} className={styles.legendItem}>
            <span 
              className={styles.colorSwatch} 
              style={{ backgroundColor: colorMap[practice.id] }}
            ></span>
            <span className={styles.practiceName}>{practice.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttendanceLegend;
