import React from 'react';
import styles from './DateRangeSelector.module.css';

const DateRangeSelector = ({ startDate, endDate, onStartDateChange, onEndDateChange }) => {

  const setPreset = (preset) => {
    let end = new Date();
    let start = new Date();
    
    const year = start.getFullYear();
    const month = start.getMonth();

    switch (preset) {
      case 'thisMonth':
        start.setDate(1);
        break;
      case 'lastMonth':
        start = new Date(year, month - 1, 1);
        end = new Date(year, month, 0);
        break;
      case 'thisQuarter': {
        const quarter = Math.floor(month / 3);
        start = new Date(year, quarter * 3, 1);
        end = new Date(year, start.getMonth() + 3, 0);
        break;
      }
      case 'lastQuarter': {
        const quarter = Math.floor(month / 3);
        const startOfCurrentQuarter = new Date(year, quarter * 3, 1);
        end = new Date(startOfCurrentQuarter.setDate(startOfCurrentQuarter.getDate() - 1));
        start = new Date(end.getFullYear(), end.getMonth() - 2, 1);
        break;
      }
      case 'ytd':
        start = new Date(year, 0, 1);
        break;
      case 'lastYear':
        start = new Date(year - 1, 0, 1);
        end = new Date(year - 1, 11, 31);
        break;
      default:
        break;
    }
    
    onStartDateChange(start.toISOString().split('T')[0]);
    onEndDateChange(end.toISOString().split('T')[0]);
  };

  return (
    <div className={styles.formGroup}>
      <label>Date Range</label>
      <div className={styles.dateRow}>
          <input type="date" value={startDate} onChange={e => onStartDateChange(e.target.value)} required/>
          <span>to</span>
          <input type="date" value={endDate} onChange={e => onEndDateChange(e.target.value)} required/>
      </div>
      <div className={styles.presets}>
        <button type="button" onClick={() => setPreset('thisMonth')}>This Month</button>
        <button type="button" onClick={() => setPreset('lastMonth')}>Last Month</button>
        <button type="button" onClick={() => setPreset('thisQuarter')}>This Quarter</button>
        <button type="button" onClick={() => setPreset('lastQuarter')}>Last Quarter</button>
        <button type="button" onClick={() => setPreset('ytd')}>YTD</button>
        <button type="button" onClick={() => setPreset('lastYear')}>Last Year</button>
      </div>
    </div>
  );
};

export default DateRangeSelector;

