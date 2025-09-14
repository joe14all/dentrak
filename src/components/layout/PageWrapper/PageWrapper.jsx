import React from 'react';
import styles from './PageWrapper.module.css';

const PageWrapper = ({ children }) => {
  return (
    <div className={styles.pageWrapper}>
      {children}
    </div>
  );
};

export default PageWrapper;
