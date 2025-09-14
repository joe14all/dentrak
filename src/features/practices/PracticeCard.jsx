import React from 'react';
import styles from './PracticeCard.module.css';
import { Edit, Trash2, Building2, User, Percent, DollarSign, Archive } from 'lucide-react';

// Now accepts onEdit and onDelete props
const PracticeCard = ({ practice, onEdit, onDelete }) => {
  const isArchived = practice.status === 'archived';

  return (
    <div className={`${styles.card} ${isArchived ? styles.archived : ''}`}>
      <div className={styles.cardHeader}>
        <div className={styles.titleGroup}>
          <Building2 size={20} className={styles.titleIcon} />
          <h3 className={styles.practiceName}>{practice.name}</h3>
        </div>
        <div className={styles.actions}>
          { <button onClick={onEdit} className={`${styles.actionButton} ${styles.editButton}`}><Edit size={16} /></button>}
          <button onClick={onDelete} className={`${styles.actionButton} ${styles.deleteButton}`}><Trash2 size={16} /></button>
        </div>
      </div>
      
      <div className={styles.tags}>
        <span className={`${styles.tag} ${styles[practice.taxStatus]}`}>
          {practice.taxStatus === 'employee' ? <User size={12} /> : <Percent size={12} />}
          {practice.taxStatus}
        </span>
        {isArchived && <span className={`${styles.tag} ${styles.archivedTag}`}><Archive size={12} /> Archived</span>}
      </div>

      <div className={styles.cardBody}>
        <div className={styles.detailGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Pay Model</span>
            <span className={styles.detailValue}>
              {practice.paymentType === 'percentage' ? `${practice.percentage}% of ${practice.calculationBase}` : 'Daily Rate'}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Base / Guarantee</span>
            <span className={styles.detailValue}>
              <DollarSign size={14} />
              {practice.paymentType === 'percentage' ? `${practice.dailyGuarantee || 'N/A'}` : `${practice.basePay}`}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Pay Cycle</span>
            <span className={styles.detailValue}>{practice.payCycle}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Deductions</span>
            <span className={styles.detailValue}>{practice.deductions.length > 0 ? `${practice.deductions.length} Rule(s)`: 'None'}</span>
          </div>
        </div>
      </div>
      
      {practice.notes && (
        <div className={styles.cardFooter}>
          <p className={styles.notes}>{practice.notes}</p>
        </div>
      )}
    </div>
  );
};

export default PracticeCard;

