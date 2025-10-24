import React from 'react';
import styles from './AttendanceToolbar.module.css';
import { ChevronLeft, ChevronRight, Save, RotateCcw, Zap, CalendarDays, Ban } from 'lucide-react'; // Added Ban icon

// Reusable Segmented Control
const SegmentedControl = ({ name, options, selectedValue, onChange }) => (
  <div className={styles.modeSwitcher}> {/* Use a specific class */}
    {options.map(option => (
      <button
        key={option.value}
        type="button"
        className={`${styles.modeButton} ${selectedValue === option.value ? styles.active : ''}`}
        onClick={() => onChange(option.value)}
      >
        <option.icon size={16} />
        <span>{option.label}</span>
      </button>
    ))}
  </div>
);


const AttendanceToolbar = ({
  currentDate,
  setCurrentDate,
  pendingAttendanceChanges, // Renamed for clarity
  pendingBlockChanges,      // Added for blocks
  onSave,
  onRevert,
  onAutomate,
  editMode,                 // Added: 'attendance' or 'blocks'
  setEditMode               // Added: Function to change mode
}) => {
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

  // Calculate total pending changes
  const attendanceChangeCount = pendingAttendanceChanges.removals.size + Object.keys(pendingAttendanceChanges.additions).length;
  const blockChangeCount = pendingBlockChanges.removals.size + Object.keys(pendingBlockChanges.additions).length;
  const totalChangeCount = attendanceChangeCount + blockChangeCount;

  const modeOptions = [
    { label: 'Attendance', value: 'attendance', icon: CalendarDays },
    { label: 'Blocks', value: 'blocks', icon: Ban },
  ];

  return (
    <div className={styles.toolbar}>
      <div className={styles.leftSection}>
        {/* Mode Switcher */}
        <SegmentedControl
            name="editMode"
            options={modeOptions}
            selectedValue={editMode}
            onChange={setEditMode}
        />

        {/* Date Navigator */}
        <div className={styles.monthNavigator}>
          <button onClick={handlePrevMonth} className={styles.navButton}><ChevronLeft size={20} /></button>
          <span className={styles.monthDisplay}>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
          <button onClick={handleNextMonth} className={styles.navButton}><ChevronRight size={20} /></button>
        </div>
        <button onClick={handleToday} className={styles.todayButton}>Today</button>

        {/* Quick Selection Button (Contextual) */}
        <button className={styles.automateButton} onClick={onAutomate}>
          <Zap size={16}/>
           Quick {editMode === 'attendance' ? 'Attendance' : 'Blocking'}
        </button>
      </div>

      <div className={styles.rightSection}>
        {totalChangeCount > 0 && (
          <>
            <span className={styles.changeIndicator}>{totalChangeCount} unsaved change{totalChangeCount > 1 ? 's' : ''}</span>
            <button className={styles.revertButton} onClick={onRevert} title="Revert all attendance and block changes"><RotateCcw size={16} /> Revert All</button>
            <button className={styles.saveButton} onClick={onSave} title="Save all attendance and block changes"><Save size={16} /> Save All Changes</button>
          </>
        )}
      </div>
    </div>
  );
};

export default AttendanceToolbar;