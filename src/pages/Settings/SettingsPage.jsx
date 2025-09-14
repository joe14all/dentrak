import React from 'react';
import { useTheme } from '../../contexts/ThemeContext/ThemeContext';
import styles from './SettingsPage.module.css';
import { Sun, Moon, Laptop, Upload, Download, Trash2 } from 'lucide-react';

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();

  const handleExportData = () => {
    // Placeholder for future export functionality
    alert('Exporting data...');
  };

  const handleImportData = () => {
    // Placeholder for future import functionality
    alert('Importing data...');
  };
  
  const handleClearData = () => {
    // Placeholder for future clear data functionality
    // This should open a confirmation modal in a real app
    if (confirm('Are you sure you want to delete all data? This action cannot be undone.')) {
        alert('All application data has been cleared.');
    }
  };


  return (
    <div className={styles.settingsContainer}>
      {/* --- Appearance Section --- */}
      <div className={styles.settingsSection}>
        <h3 className={styles.sectionTitle}>Appearance</h3>
        <p className={styles.sectionDescription}>
          Customize the look and feel of the application.
        </p>
        <div className={styles.card}>
          <h4>Theme</h4>
          <div className={styles.themeOptions}>
            <button 
              className={`${styles.themeButton} ${theme === 'light' ? styles.active : ''}`}
              onClick={() => setTheme('light')}
            >
              <Sun size={20} /> Light
            </button>
            <button 
              className={`${styles.themeButton} ${theme === 'dark' ? styles.active : ''}`}
              onClick={() => setTheme('dark')}
            >
              <Moon size={20} /> Dark
            </button>
            <button 
              className={`${styles.themeButton} ${theme === 'system' ? styles.active : ''}`}
              onClick={() => setTheme('system')}
            >
              <Laptop size={20} /> System
            </button>
          </div>
        </div>
      </div>

      {/* --- Data Management Section --- */}
      <div className={styles.settingsSection}>
        <h3 className={styles.sectionTitle}>Data Management</h3>
        <p className={styles.sectionDescription}>
          Export, import, or clear your application data.
        </p>
        <div className={styles.card}>
           <div className={styles.dataActions}>
             <button className={styles.dataButton} onClick={handleImportData}>
                <Upload size={16} /> Import Data
             </button>
             <button className={styles.dataButton} onClick={handleExportData}>
                <Download size={16} /> Export Data
             </button>
           </div>
        </div>
      </div>

      {/* --- Danger Zone --- */}
      <div className={styles.settingsSection}>
        <h3 className={`${styles.sectionTitle} ${styles.dangerTitle}`}>Danger Zone</h3>
        <p className={styles.sectionDescription}>
          These actions are permanent and cannot be undone.
        </p>
        <div className={`${styles.card} ${styles.dangerCard}`}>
            <h4>Clear All Data</h4>
            <p>Permanently delete all practices, entries, and cheques.</p>
            <button className={styles.dangerButton} onClick={handleClearData}>
                <Trash2 size={16} /> Clear All Application Data
            </button>
        </div>
      </div>

    </div>
  );
};

export default SettingsPage;

