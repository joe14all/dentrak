import React from 'react';
import styles from './PageHeader.module.css';

const PageHeader = ({ title, children }) => {
  return (
    <div className={styles.pageHeader}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.controls}>
        {children}
      </div>
    </div>
  );
};

export default PageHeader;
