import React from 'react';
import styles from './PracticeSelector.module.css';
import { Check } from 'lucide-react';

const PracticeSelector = ({ practices, selectedPractices, onChange }) => {

  const handleToggle = (practiceId) => {
    const newSelection = new Set(selectedPractices);
    if (newSelection.has(practiceId)) {
      newSelection.delete(practiceId);
    } else {
      newSelection.add(practiceId);
    }
    onChange(Array.from(newSelection));
  };

  const handleSelectAll = () => {
    onChange(practices.map(p => p.id));
  };

  return (
    <div className={styles.formGroup}>
      <div className={styles.header}>
        <label>Practices</label>
        <div>
          <button type="button" onClick={() => onChange([])}>Clear</button>
          <button type="button" onClick={handleSelectAll}>Select All</button>
        </div>
      </div>
      <div className={styles.practiceList}>
        {practices.map(p => (
          <div 
            key={p.id} 
            className={`${styles.practiceItem} ${selectedPractices.includes(p.id) ? styles.selected : ''}`}
            onClick={() => handleToggle(p.id)}
          >
            <div className={styles.checkbox}>
              {selectedPractices.includes(p.id) && <Check size={12} />}
            </div>
            <span>{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PracticeSelector;
