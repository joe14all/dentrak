import React from 'react';
import { usePractices } from '../../contexts/PracticeContext/PracticeContext';
import PracticeCard from './PracticeCard';
import styles from './PracticeList.module.css';
import { PlusCircle } from 'lucide-react';

const PracticeList = () => {
  const { practices, isLoading } = usePractices();

  const handleAddPractice = () => {
    // This will open a form/modal in the future
    alert('Opening form to add a new practice...');
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading practices...</div>;
  }

  return (
    <div className={styles.practiceListContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Manage Practices</h2>
        <button className={styles.addButton} onClick={handleAddPractice}>
          <PlusCircle size={16} />
          <span>Add New Practice</span>
        </button>
      </div>

      {practices.length > 0 ? (
        <div className={styles.grid}>
          {practices.map((practice) => (
            <PracticeCard key={practice.id} practice={practice} />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>No practices found. Add your first one to get started!</p>
        </div>
      )}
    </div>
  );
};

export default PracticeList;
