import React from 'react';
import styles from './PageHeader.module.css';
import ViewSwitcher from './ViewSwitcher';

const PageHeader = ({  activeView, setActiveView }) => {
  return (
    <div className={styles.pageHeader}>

      <div className={styles.controls}>
        <ViewSwitcher activeView={activeView} setActiveView={setActiveView} />
      </div>
    </div>
  );
};

export default PageHeader;

