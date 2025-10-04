import React from 'react';
import styles from './EntryCard.module.css';
import { Edit, Trash2, Calendar, FileText, Briefcase, DollarSign, Building2, Clock } from 'lucide-react';

const EntryCard = ({ entry, practice, onEdit, onDelete }) => {

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount || 0);
  }

  const getEntryIcon = (type) => {
    switch(type) {
        case 'dailySummary': return <Calendar size={16} />;
        case 'periodSummary': return <Briefcase size={16} />;
        case 'individualProcedure': return <FileText size={16} />;
        case 'attendanceRecord': return <Clock size={16} />;
        default: return <DollarSign size={16} />;
    }
  }
  
  const calculateHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return null;
    const start = new Date(`1970-01-01T${checkIn}:00`);
    const end = new Date(`1970-01-01T${checkOut}:00`);
    const diff = (end - start) / 1000 / 60 / 60; // difference in hours
    return diff > 0 ? `${diff.toFixed(2)} hrs` : null;
  }

  const isFinancialEntry = entry.entryType !== 'attendanceRecord';

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.titleGroup}>
            <div className={styles.iconWrapper}>
                {getEntryIcon(entry.entryType)}
            </div>
            <h3 className={styles.entryTitle}>{formatDate(entry.date)}</h3>
        </div>
        <div className={styles.actions}>
          <button onClick={onEdit} className={`${styles.actionButton} ${styles.editButton}`}><Edit size={16} /></button>
          <button onClick={onDelete} className={`${styles.actionButton} ${styles.deleteButton}`}><Trash2 size={16} /></button>
        </div>
      </div>
      
      {practice && (
        <div className={styles.practiceInfo}>
            <Building2 size={14} />
            <span>{practice.name}</span>
        </div>
      )}
      
      <div className={styles.tags}>
        <span className={styles.tag}>{entry.entryType.replace(/([A-Z])/g, ' $1')}</span>
        {entry.patientId && <span className={`${styles.tag} ${styles.patientTag}`}>ID: {entry.patientId}</span>}
      </div>

      {isFinancialEntry ? (
        <div className={styles.cardBody}>
           <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Production</span>
              <span className={`${styles.detailValue} ${styles.production}`}>{formatCurrency(entry.production)}</span>
          </div>
          <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Collection</span>
              <span className={`${styles.detailValue} ${styles.collection}`}>{formatCurrency(entry.collection)}</span>
          </div>
          <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Adjustments</span>
              <span className={`${styles.detailValue} ${styles.adjustments}`}>-{formatCurrency(entry.adjustments?.total)}</span>
          </div>
        </div>
      ) : (
        <div className={`${styles.cardBody} ${styles.attendanceBody}`}>
            <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Check In</span>
                <span className={styles.detailValue}>{entry.checkInTime || 'N/A'}</span>
            </div>
            <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Check Out</span>
                <span className={styles.detailValue}>{entry.checkOutTime || 'N/A'}</span>
            </div>
            <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Total Time</span>
                <span className={styles.detailValue}>{calculateHours(entry.checkInTime, entry.checkOutTime) || 'N/A'}</span>
            </div>
        </div>
      )}
      
      {entry.notes && (
        <div className={styles.cardFooter}>
          <p className={styles.notes}>{entry.notes}</p>
        </div>
      )}
    </div>
  );
};

export default EntryCard;

