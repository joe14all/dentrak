import React from 'react';
import styles from './AttendanceToolbar.module.css';
import { ChevronLeft, ChevronRight, Save, RotateCcw, Zap } from 'lucide-react';

const AttendanceToolbar = ({ currentDate, setCurrentDate, pendingChanges, onSave, onRevert, onAutomate }) => {
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

  const changeCount = pendingChanges.removals.size + Object.keys(pendingChanges.additions).length;

  return (
    <div className={styles.toolbar}>
      <div className={styles.leftSection}>
        <button onClick={handleToday} className={styles.todayButton}>Today</button>
        <div className={styles.monthNavigator}>
          <button onClick={handlePrevMonth} className={styles.navButton}><ChevronLeft size={20} /></button>
          <span className={styles.monthDisplay}>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
          <button onClick={handleNextMonth} className={styles.navButton}><ChevronRight size={20} /></button>
        </div>
        <button className={styles.automateButton} onClick={onAutomate}>
          <Zap size={16}/>
          Quick Selection
        </button>
      </div>
     
      <div className={styles.rightSection}>
        {changeCount > 0 && (
          <>
            <span className={styles.changeIndicator}>{changeCount} unsaved change{changeCount > 1 ? 's' : ''}</span>
            <button className={styles.revertButton} onClick={onRevert}><RotateCcw size={16} /> Revert</button>
            <button className={styles.saveButton} onClick={onSave}><Save size={16} /> Save Changes</button>
          </>
        )}
      </div>
    </div>
  );
};

export default AttendanceToolbar;

