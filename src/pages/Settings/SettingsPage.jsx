import React, { useState, useRef } from 'react';
import styles from './SettingsPage.module.css';
import { useTheme } from '../../contexts/ThemeContext/ThemeContext';
import { db } from '../../database/db';
import Modal from '../../components/common/Modal/Modal';
import ConfirmationModal from '../../components/common/Modal/ConfirmationModal';
import GoalsManager from '../../features/settings/GoalsManager';
import TemplateManager from '../../features/entries/TemplateManager';
import { Sun, Moon, Laptop, Upload, Download, Trash2, Target, Copy } from 'lucide-react'; 
const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const [isClearModalOpen, setClearModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleExportData = async () => {
    try {
      const allData = {
        practices: await db.practices.toArray(),
        entries: await db.entries.toArray(),
        payments: await db.payments.toArray(),
        cheques: await db.cheques.toArray(),
        directDeposits: await db.directDeposits.toArray(),
        eTransfers: await db.eTransfers.toArray(),
      };
      
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dentrak_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export data:", error);
      alert("Error exporting data. Check the console for details.");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (window.confirm("Are you sure you want to import this data? This will overwrite all existing data.")) {
          await db.transaction('rw', db.tables, async () => {
            for (const tableName of Object.keys(data)) {
              if (db[tableName]) {
                await db[tableName].clear();
                await db[tableName].bulkAdd(data[tableName]);
              }
            }
          });
          alert("Data imported successfully! The app will now reload.");
          window.location.reload();
        }
      } catch (error) {
        console.error("Failed to import data:", error);
        alert("Error importing data. Make sure it's a valid backup file.");
      }
    };
    reader.readAsText(file);
    event.target.value = null; // Reset file input
  };
  
  const handleClearData = async () => {
    try {
      await db.delete(); // Deletes the entire database
      alert("All application data has been cleared. The app will now reload.");
      window.location.reload();
    } catch (error) {
      console.error("Failed to clear data:", error);
      alert("Error clearing data. Check console for details.");
    }
    setClearModalOpen(false);
  };


  return (
    <div className={styles.settingsContainer}>
      {/* --- Appearance Section --- */}
      <div className={styles.settingsSection}>
        <h3 className={styles.sectionTitle}>Appearance</h3>
        <p className={styles.sectionDescription}>Customize the look and feel of the application.</p>
        <div className={styles.card}>
          <h4>Theme</h4>
          <p className={styles.cardDescription}>Choose how Dentrak looks. "System" will match your OS setting.</p>
          <div className={styles.themeOptions}>
            <button className={`${styles.themeButton} ${theme === 'light' ? styles.active : ''}`} onClick={() => setTheme('light')}>
              <Sun size={18} /> Light
            </button>
            <button className={`${styles.themeButton} ${theme === 'dark' ? styles.active : ''}`} onClick={() => setTheme('dark')}>
              <Moon size={18} /> Dark
            </button>
            <button className={`${styles.themeButton} ${theme === 'system' ? styles.active : ''}`} onClick={() => setTheme('system')}>
              <Laptop size={18} /> System
            </button>
          </div>
        </div>
      </div>

      {/* --- Goal Setting Section (New Section) --- */}
      <div className={styles.settingsSection}>
        <h3 className={styles.sectionTitle}><Target size={20} /> Performance Goals</h3>
        <p className={styles.sectionDescription}>Set monthly or annual goals for production, collection, or income.</p>
        <div className={styles.card}>
           <GoalsManager /> 
        </div>
      </div>

      {/* --- Entry Templates Section --- */}
      <div className={styles.settingsSection}>
        <h3 className={styles.sectionTitle}><Copy size={20} /> Entry Templates</h3>
        <p className={styles.sectionDescription}>Create and manage templates for quick entry creation.</p>
        <div className={styles.card}>
           <TemplateManager /> 
        </div>
      </div>

      {/* --- Data Management Section --- */}
      <div className={styles.settingsSection}>
        <h3 className={styles.sectionTitle}>Data Management</h3>
        <p className={styles.sectionDescription}>Export, import, or clear your application data.</p>
        <div className={styles.card}>
           <div className={styles.dataActions}>
             <button className={styles.dataButton} onClick={handleImportClick}>
                <Upload size={16} /> Import from Backup
             </button>
             <input type="file" ref={fileInputRef} onChange={handleImportData} style={{ display: 'none' }} accept=".json"/>
             <button className={styles.dataButton} onClick={handleExportData}>
                <Download size={16} /> Export to Backup
             </button>
           </div>
        </div>
      </div>

      {/* --- Danger Zone --- */}
      <div className={styles.settingsSection}>
        <h3 className={`${styles.sectionTitle} ${styles.dangerTitle}`}>Danger Zone</h3>
        <p className={styles.sectionDescription}>These actions are permanent and cannot be undone.</p>
        <div className={`${styles.card} ${styles.dangerCard}`}>
            <h4>Clear All Data</h4>
            <p>Permanently delete all practices, entries, and transactions from this device.</p>
            <button className={styles.dangerButton} onClick={() => setClearModalOpen(true)}>
                <Trash2 size={16} /> Clear All Application Data
            </button>
        </div>
      </div>

      <Modal isOpen={isClearModalOpen} onClose={() => setClearModalOpen(false)} title="">
          <ConfirmationModal onConfirm={handleClearData} onCancel={() => setClearModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default SettingsPage;