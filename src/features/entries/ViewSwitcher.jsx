import React from 'react';
import styles from './ViewSwitcher.module.css';
import { LineChart, CalendarCheck } from 'lucide-react';

const ViewSwitcher = ({ activeView, setActiveView }) => {
  const views = [
    { id: 'performance', label: 'Performance', icon: LineChart },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  ];

  return (
    <div className={styles.switcherContainer}>
      {views.map(view => (
        <button
          key={view.id}
          className={`${styles.switchButton} ${activeView === view.id ? styles.active : ''}`}
          onClick={() => setActiveView(view.id)}
        >
          <view.icon size={18} />
          <span>{view.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ViewSwitcher;

