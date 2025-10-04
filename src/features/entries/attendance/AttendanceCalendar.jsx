import React, { useState, useEffect } from 'react';
import styles from './AttendanceCalendar.module.css';
import { Plus, Minus, Star } from 'lucide-react';

// This component is now simplified to only display data and report clicks.
const AttendanceCalendar = ({ currentDate, attendanceEntries, practices, colorMap, pendingChanges, onDayClick }) => {
  const [holidays, setHolidays] = useState(new Map());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Effect to fetch holidays for the current year
  useEffect(() => {
    const fetchHolidays = async () => {
      // Assuming US holidays. This could be made dynamic in settings later.
      const countryCode = 'US';
      try {
        const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`);
        if (!response.ok) {
          throw new Error('Failed to fetch holiday data.');
        }
        const holidayData = await response.json();
        const holidayMap = new Map();
        holidayData.forEach(holiday => {
          holidayMap.set(holiday.date, holiday.localName);
        });
        setHolidays(holidayMap);
      } catch (error) {
        console.error("Error fetching holidays:", error);
        setHolidays(new Map()); // Clear holidays on error to prevent stale data
      }
    };

    fetchHolidays();
  }, [year]); // Re-fetch only when the year changes

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className={styles.emptyCell}></div>);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
    
    const entriesForDay = attendanceEntries.filter(e => e.date === dateStr);
    const holidayName = holidays.get(dateStr);

    calendarDays.push(
      <div 
        key={dateStr} 
        className={`${styles.dayCell} ${holidayName ? styles.holiday : ''}`}
      >
        <div className={styles.dayHeader}>
            <span className={`${styles.dayNumber} ${isToday ? styles.today : ''}`}>{day}</span>
            {holidayName && <Star size={12} className={styles.holidayIcon} title={holidayName} />}
        </div>
        
        {holidayName && (
            <div className={styles.holidayInfo}>
                <p className={styles.holidayName}>{holidayName}</p>
            </div>
        )}

        <div className={styles.practiceDots}>
          {(practices || []).map(practice => {
            const entry = entriesForDay.find(e => e.practiceId === practice.id);
            const isStagedForRemoval = entry && pendingChanges.removals.has(entry.id);
            const isStagedForAddition = pendingChanges.additions[`${dateStr}-${practice.id}`];

            let stateClass = '';
            if (isStagedForAddition) stateClass = styles.stagedAdd;
            if (isStagedForRemoval) stateClass = styles.stagedRemove;

            return (
              <div
                key={practice.id}
                className={`${styles.dot} ${stateClass}`}
                style={{ '--practice-color': colorMap[practice.id] }}
                onClick={() => onDayClick(dateStr, practice.id)}
              >
                {entry && !isStagedForRemoval && <div className={styles.filledDot}></div>}
                {isStagedForAddition && <Plus size={12} />}
                {isStagedForRemoval && <Minus size={12} />}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.daysOfWeek}>
        {daysOfWeek.map(day => <div key={day}>{day}</div>)}
      </div>
      <div className={styles.calendarGrid}>
        {calendarDays}
      </div>
    </div>
  );
};

export default AttendanceCalendar;

