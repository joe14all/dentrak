import React from 'react';
import PracticeList from '../../features/practices/PracticeList';
import styles from './PracticesPage.module.css';

const PracticesPage = () => {
  return (
    <div className={styles.practicesPage}>
      {/* This page component simply renders the feature component */}
      <PracticeList />
    </div>
  );
};

export default PracticesPage;

