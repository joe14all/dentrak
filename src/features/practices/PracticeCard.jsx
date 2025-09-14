import React from 'react';
import styles from './PracticeCard.module.css';
import { Edit, Trash2, Briefcase, Percent } from 'lucide-react';

const PracticeCard = ({ practice }) => {

  const handleEdit = () => {
    alert(`Editing ${practice.name}`);
  };

  const handleDelete = () => {
    // In a real app, this would show a confirmation modal
    if (confirm(`Are you sure you want to delete ${practice.name}?`)) {
        alert(`Deleting ${practice.name}`);
    }
  };

  const isEmployment = practice.paymentType === 'employment';

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.practiceName}>{practice.name}</h3>
        <div className={styles.actions}>
          <button onClick={handleEdit} className={`${styles.actionButton} ${styles.editButton}`}>
            <Edit size={16} />
          </button>
          <button onClick={handleDelete} className={`${styles.actionButton} ${styles.deleteButton}`}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.detail}>
          {isEmployment ? <Briefcase size={16} /> : <Percent size={16} />}
          <span>
            {isEmployment ? `Employment (Base: $${practice.basePay}/day)` : `Percentage (${practice.percentage}%)`}
          </span>
        </div>
        {practice.notes && (
          <p className={styles.notes}>
            {practice.notes}
          </p>
        )}
      </div>
    </div>
  );
};

export default PracticeCard;
