import React from 'react';
import styles from './Header.module.css';
import { ChevronsLeft } from 'lucide-react';

const Header = ({ title }) => {
  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        
        <h1 className={styles.title}>{title || 'Page Title'}</h1>
      </div>
      
      {/* The right section has been removed as requested */}
    </header>
  );
};

export default Header;

