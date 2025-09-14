import React from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Header from '../Header/Header';
import PageWrapper from '../PageWrapper/PageWrapper';
import styles from './MainLayout.module.css';

// The MainLayout is now simpler, as the sidebar handles its own state via CSS.
const MainLayout = ({ children, pageTitle, activePage, setActivePage }) => {
  return (
    <div className={styles.mainLayout}>
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
      />
      <main className={styles.contentArea}>
        <Header title={pageTitle} />
        <PageWrapper>
          {children}
        </PageWrapper>
      </main>
    </div>
  );
};

export default MainLayout;

