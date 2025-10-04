import React, { useState, useEffect } from 'react';
import styles from './BulkEditPanel.module.css';
import { ChevronDown } from 'lucide-react';

const BulkEditPanel = ({ practices, currentDate, onApply, onCancel }) => {
  const [action, setAction] = useState('select');
  const [targetPracticeId, setTargetPracticeId] = useState(practices.length > 0 ? practices[0].id : '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [weekdays, setWeekdays] = useState({ 0: false, 1: true, 2: true, 3: true, 4: true, 5: true, 6: false });
  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // Shortened for space

  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
    const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];
    setStartDate(firstDay);
    setEndDate(lastDay);
  }, [currentDate]);

  const handleWeekdayToggle = (dayIndex) => setWeekdays(prev => ({ ...prev, [dayIndex]: !prev[dayIndex] }));
  const handlePreset = (preset) => {
    if (preset === 'all') setWeekdays({ 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true });
    if (preset === 'weekdays') setWeekdays({ 0: false, 1: true, 2: true, 3: true, 4: true, 5: true, 6: false });
    if (preset === 'weekends') setWeekdays({ 0: true, 1: false, 2: false, 3: false, 4: false, 5: false, 6: true });
  };
  const handleApply = () => {
    const selectedDays = Object.keys(weekdays).filter(day => weekdays[day]).map(Number);
    onApply({ action, targetPracticeId, startDate, endDate, daysOfWeek: selectedDays });
  };

  return (
    <div className={styles.panel}>
      <div className={styles.mainContent}>
        {/* Step 1: Action */}
        <div className={styles.section}>
          <label className={styles.sectionLabel}>1. Choose an Action</label>
          <div className={styles.segmentedControl}>
            <button onClick={() => setAction('select')} className={action === 'select' ? styles.active : ''}>Select Days</button>
            <button onClick={() => setAction('deselect')} className={action === 'deselect' ? styles.active : ''}>Deselect Days</button>
          </div>
        </div>

        {/* Step 2: Target Practice */}
        <div className={styles.section}>
          <label htmlFor="targetPractice" className={styles.sectionLabel}>2. For Practice</label>
          <div className={styles.selectWrapper}>
            <select id="targetPractice" value={targetPracticeId} onChange={e => setTargetPracticeId(parseInt(e.target.value))}>
              {practices.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <ChevronDown size={20} className={styles.selectIcon} />
          </div>
        </div>

        {/* Step 3: Date Range */}
        <div className={styles.section}>
          <label className={styles.sectionLabel}>3. Within Date Range</label>
          <div className={styles.formRow}>
            <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>

        {/* Step 4: Days of Week */}
        <div className={styles.section}>
           <div className={styles.weekdayHeader}>
            <label className={styles.sectionLabel}>4. On these Days</label>
            <div className={styles.presets}>
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
        <button onClick={handleApply} className={styles.applyButton}>Apply </button>
      </div>
    </div>
  );
};

export default BulkEditPanel;

