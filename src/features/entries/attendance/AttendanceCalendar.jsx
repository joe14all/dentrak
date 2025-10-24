import React, { useState, useEffect } from 'react';
import styles from './AttendanceCalendar.module.css';
import { Plus, Minus, Star, Lock } from 'lucide-react'; // Added Lock icon

const AttendanceCalendar = ({
  currentDate,
  attendanceEntries,
  practices,
  colorMap,
  pendingAttendanceChanges, // Renamed
  scheduleBlocks,           // Added
  pendingBlockChanges,      // Added
  onDayClick,               // Will handle both modes via parent
  editMode,                 // Added
  isDateBlocked             // Added utility function from context
}) => {
  const [holidays, setHolidays] = useState(new Map());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Effect to fetch holidays (keep as is)
  useEffect(() => {
      // ... existing holiday fetch logic ...
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
  }, [year]);

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
    const holidayName = holidays.get(dateStr);

    // --- Block Status Calculation ---
    const isEffectivelyBlocked = isDateBlocked(dateStr); // Is it blocked by existing, non-pending-removal block?
    const isStagedForBlocking = !!pendingBlockChanges.additions[dateStr];
    const existingBlockCoveringDay = scheduleBlocks.find(block =>
        new Date(`${dateStr}T00:00:00Z`) >= new Date(`${block.startDate}T00:00:00Z`) &&
        new Date(`${dateStr}T00:00:00Z`) <= new Date(`${block.endDate}T00:00:00Z`)
    );
    const isStagedForUnblocking = existingBlockCoveringDay && pendingBlockChanges.removals.has(existingBlockCoveringDay.id);

    let dayBlockedClass = '';
    let blockIcon = null;
    if (isStagedForBlocking) {
      dayBlockedClass = styles.stagedBlockAdd; // New style for pending block
      blockIcon = <Plus size={10} className={styles.blockStatusIcon} />;
    } else if (isStagedForUnblocking) {
       dayBlockedClass = styles.stagedBlockRemove; // New style for pending removal
       blockIcon = <Minus size={10} className={styles.blockStatusIcon} />;
    } else if (isEffectivelyBlocked) {
      dayBlockedClass = styles.dayBlocked; // Style for effectively blocked day
      blockIcon = <Lock size={10} className={styles.blockStatusIcon} />;
    }


    const entriesForDay = attendanceEntries.filter(e => e.date === dateStr);

    calendarDays.push(
      <div
        key={dateStr}
        // Apply blocked class to the whole cell, handle click based on mode
        className={`${styles.dayCell} ${holidayName ? styles.holiday : ''} ${dayBlockedClass}`}
        onClick={() => {
            // Only allow blocking/unblocking via click if in 'blocks' mode
            if (editMode === 'blocks') {
                 onDayClick(dateStr, null); // practiceId is irrelevant for blocks
            }
             // Clicks for attendance are handled within the practice dot conditional logic below
         }}
      >
        <div className={styles.dayHeader}>
          <span className={`${styles.dayNumber} ${isToday ? styles.today : ''}`}>{day}</span>
          {/* Show Block Icon if applicable (based on effective or pending state) */}
          {blockIcon}
          {holidayName && !blockIcon && <Star size={12} className={styles.holidayIcon} title={holidayName} />}
        </div>

        {holidayName && (
          <div className={styles.holidayInfo}>
            <p className={styles.holidayName}>{holidayName}</p>
          </div>
        )}

        {/* Attendance Dots - Render based on attendance state, but disable clicks if day is blocked */}
        <div className={styles.practiceDots}>
          {(practices || []).map(practice => {
            const entry = entriesForDay.find(e => e.practiceId === practice.id);
            const isStagedForRemoval = entry && pendingAttendanceChanges.removals.has(entry.id);
            const isStagedForAddition = pendingAttendanceChanges.additions[`${dateStr}-${practice.id}`];

            let stateClass = '';
            if (isStagedForAddition) stateClass = styles.stagedAdd;
            if (isStagedForRemoval) stateClass = styles.stagedRemove;

            // Determine if clicking this dot should be allowed (in attendance mode and not blocked)
            const allowAttendanceClick = editMode === 'attendance' && !isEffectivelyBlocked && !isStagedForBlocking;


            return (
              <div
                key={practice.id}
                className={`${styles.dot} ${stateClass} ${!allowAttendanceClick ? styles.dotDisabled : ''}`} // Add disabled style
                style={{ '--practice-color': colorMap[practice.id] }}
                onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering the cell's block click handler
                    if (allowAttendanceClick) {
                        onDayClick(dateStr, practice.id); // Call handler only if allowed
                    }
                }}
                title={!allowAttendanceClick && editMode === 'attendance' ? "Day is blocked" : ""} // Add tooltip
              >
                {/* Visual indicators for attendance state */}
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