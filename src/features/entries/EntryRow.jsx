import React from 'react';
import styles from './EntryRow.module.css';
import { Edit, Trash2 } from 'lucide-react';

const EntryRow = ({ entry, practice, onEdit, onDelete }) => {

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
  };

  const formatCurrency = (amount) => {
    const value = amount || 0;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(value);
  };
  
  const totalAdjustments = entry.adjustments?.reduce((acc, item) => acc + item.amount, 0) || 0;
  const adjustmentsTitle = entry.adjustments?.length > 0
    ? entry.adjustments.map(adj => `${adj.name}: ${formatCurrency(adj.amount)}`).join('\n')
    : 'No adjustments';

  const dateDisplay = entry.entryType === 'periodSummary' 
    ? `${formatDate(entry.periodStartDate)} - ${formatDate(entry.periodEndDate)}`
    : formatDate(entry.date);

  return (
    <tr className={styles.tableRow}>
      <td className={styles.cellDate}>{dateDisplay}</td>
      <td className={styles.cellPractice}>{practice?.name || 'N/A'}</td>
      <td>
        <span className={`${styles.tag} ${styles[entry.entryType]}`}>
          {entry.entryType.replace(/([A-Z])/g, ' $1')}
        </span>
      </td>
      <td className={styles.cellCurrency}>{formatCurrency(entry.production)}</td>
      <td className={styles.cellCurrency}>{formatCurrency(entry.collection)}</td>
      <td className={styles.cellCurrency} title={adjustmentsTitle}>
        <span className={totalAdjustments > 0 ? styles.adjustmentsValue : ''}>
          -{formatCurrency(totalAdjustments)}
        </span>
      </td>
      <td className={styles.cellActions}>
        <div className={styles.actions}>
          <button onClick={onEdit} className={styles.actionButton}><Edit size={16} /></button>
          <button onClick={onDelete} className={styles.actionButton}><Trash2 size={16} /></button>
        </div>
      </td>
    </tr>
  );
};

export default EntryRow;
