import React, { useState, useEffect } from 'react';
import styles from './BulkEditPanel.module.css';
import { ChevronDown } from 'lucide-react';

const BulkEditPanel = ({ practices, currentDate, onApply, onCancel, mode }) => { // Added mode prop
  // Determine initial action based on mode
  const initialAction = mode === 'attendance' ? 'select' : 'block';
  const [action, setAction] = useState(initialAction);

  // Keep practice selection relevant only for attendance
  const [targetPracticeId, setTargetPracticeId] = useState(
      mode === 'attendance' && practices.length > 0 ? practices[0].id : ''
  );

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [weekdays, setWeekdays] = useState({ 0: false, 1: true, 2: true, 3: true, 4: true, 5: true, 6: false });
  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Update dates based on currentDate (keep as is)
  useEffect(() => {
      // ... existing date setting logic ...
        const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
    const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];
    setStartDate(firstDay);
    setEndDate(lastDay);
  }, [currentDate]);

  // Update action state if mode changes while panel is open (edge case)
   useEffect(() => {
        setAction(mode === 'attendance' ? 'select' : 'block');
        if (mode === 'blocks') {
            setTargetPracticeId(''); // Clear practice ID if switching to blocks mode
        } else if (mode === 'attendance' && !targetPracticeId && practices.length > 0) {
             setTargetPracticeId(practices[0].id); // Reset practice ID if switching to attendance
        }
    }, [mode, practices, targetPracticeId]);


  const handleWeekdayToggle = (dayIndex) => setWeekdays(prev => ({ ...prev, [dayIndex]: !prev[dayIndex] }));
  const handlePreset = (preset) => {
    // ... (keep existing preset logic) ...
     if (preset === 'all') setWeekdays({ 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true });
    if (preset === 'weekdays') setWeekdays({ 0: false, 1: true, 2: true, 3: true, 4: true, 5: true, 6: false });
    if (preset === 'weekends') setWeekdays({ 0: true, 1: false, 2: false, 3: false, 4: false, 5: false, 6: true });
  };

  const handleApply = () => {
    const selectedDays = Object.keys(weekdays).filter(day => weekdays[day]).map(Number);
    // Pass the raw action back; the parent component (AttendanceTracker) will map it based on mode
    onApply({
        action, // 'select'/'deselect' or 'block'/'unblock'
        targetPracticeId: mode === 'attendance' ? targetPracticeId : undefined, // Only relevant for attendance
        startDate,
        endDate,
        daysOfWeek: selectedDays
    });
  };

  // Determine button labels based on mode
  const actionLabels = mode === 'attendance'
    ? { primary: 'Select Days', secondary: 'Deselect Days', primaryAction: 'select', secondaryAction: 'deselect' }
    : { primary: 'Block Days', secondary: 'Unblock Days', primaryAction: 'block', secondaryAction: 'unblock' };


  return (
    <div className={styles.panel}>
      <div className={styles.mainContent}>
        {/* Step 1: Action */}
        <div className={styles.section}>
          <label className={styles.sectionLabel}>1. Choose an Action</label>
          <div className={styles.segmentedControl}>
            <button onClick={() => setAction(actionLabels.primaryAction)} className={action === actionLabels.primaryAction ? styles.active : ''}>
              {actionLabels.primary}
            </button>
            <button onClick={() => setAction(actionLabels.secondaryAction)} className={action === actionLabels.secondaryAction ? styles.active : ''}>
              {actionLabels.secondary}
            </button>
          </div>
        </div>

        {/* Step 2: Target Practice (Conditional) */}
        {mode === 'attendance' && (
            <div className={styles.section}>
            <label htmlFor="targetPractice" className={styles.sectionLabel}>2. For Practice</label>
            <div className={styles.selectWrapper}>
                <select id="targetPractice" value={targetPracticeId} onChange={e => setTargetPracticeId(parseInt(e.target.value))}>
                {practices.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <ChevronDown size={20} className={styles.selectIcon} />
            </div>
            </div>
        )}

        {/* Step 3 & 4: Date Range & Days (Keep as is, labels are generic) */}
        <div className={styles.section}>
          <label className={styles.sectionLabel}>{mode === 'attendance' ? '3.' : '2.'} Within Date Range</label>
          <div className={styles.formRow}>
            <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>

        <div className={styles.section}>
           <div className={styles.weekdayHeader}>
            <label className={styles.sectionLabel}>{mode === 'attendance' ? '4.' : '3.'} On these Days</label>
            <div className={styles.presets}>
                {/* ... (preset buttons remain the same) ... */}
                 <button onClick={() => handlePreset('weekdays')}>Weekdays</button>
                <button onClick={() => handlePreset('weekends')}>Weekends</button>
                <button onClick={() => handlePreset('all')}>All</button>
            </div>
          </div>
          <div className={styles.weekdaySelector}>
            {daysOfWeek.map((day, index) => (
              <button key={day + index} onClick={() => handleWeekdayToggle(index)} className={weekdays[index] ? styles.active : ''}>{day}</button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button onClick={onCancel} className={styles.cancelButton}>Cancel</button>
        <button onClick={handleApply} className={styles.applyButton}>Apply</button>
      </div>
    </div>
  );
};

export default BulkEditPanel;