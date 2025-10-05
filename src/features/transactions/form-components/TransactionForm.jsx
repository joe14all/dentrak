import React, { useState, useEffect } from 'react';
import styles from './TransactionForm.module.css';

const getInitialState = (type) => ({
  practiceId: '',
  amount: 0,
  notes: '',
  ...(type === 'cheques' ? {
    dateReceived: new Date().toISOString().split('T')[0],
    chequeNumber: '',
    status: 'Pending',
  } : {
    transactionDate: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    sourceBank: '', // for direct deposit
    senderName: '', // for e-transfer
  })
});

const TransactionForm = ({ transactionToEdit, transactionType, practices, onSave, onCancel }) => {
  const [formData, setFormData] = useState(getInitialState(transactionType));

  useEffect(() => {
    if (transactionToEdit) {
      setFormData(transactionToEdit);
    } else {
      setFormData({ ...getInitialState(transactionType), practiceId: practices?.[0]?.id || '' });
    }
  }, [transactionToEdit, transactionType, practices]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ type: transactionType, ...formData });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}><label>Practice</label><select name="practiceId" value={formData.practiceId} onChange={handleChange}>{practices.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
      <div className={styles.formRow}>
        <div className={styles.formGroup}><label>Amount ($)</label><input type="number" name="amount" value={formData.amount} onChange={handleChange} /></div>
        {transactionType === 'cheques' ? (
          <div className={styles.formGroup}><label>Date Received</label><input type="date" name="dateReceived" value={formData.dateReceived} onChange={handleChange} /></div>
        ) : (
          <div className={styles.formGroup}><label>Transaction Date</label><input type="date" name="transactionDate" value={formData.transactionDate} onChange={handleChange} /></div>
        )}
      </div>
      {transactionType === 'cheques' && (
        <div className={styles.formRow}>
            <div className={styles.formGroup}><label>Cheque #</label><input type="text" name="chequeNumber" value={formData.chequeNumber} onChange={handleChange} /></div>
            <div className={styles.formGroup}><label>Status</label><select name="status" value={formData.status} onChange={handleChange}><option>Pending</option><option>Deposited</option><option>Cleared</option><option>Bounced</option></select></div>
        </div>
      )}
      {transactionType === 'directDeposits' && (
         <div className={styles.formRow}>
            <div className={styles.formGroup}><label>Reference #</label><input type="text" name="referenceNumber" value={formData.referenceNumber} onChange={handleChange} /></div>
            <div className={styles.formGroup}><label>Source Bank</label><input type="text" name="sourceBank" value={formData.sourceBank} onChange={handleChange} /></div>
        </div>
      )}
      {transactionType === 'eTransfers' && (
         <div className={styles.formRow}>
            <div className={styles.formGroup}><label>Reference #</label><input type="text" name="referenceNumber" value={formData.referenceNumber} onChange={handleChange} /></div>
            <div className={styles.formGroup}><label>Sender Name</label><input type="text" name="senderName" value={formData.senderName} onChange={handleChange} /></div>
        </div>
      )}
      <div className={styles.formGroup}><label>Notes</label><textarea name="notes" value={formData.notes} onChange={handleChange} rows="3"></textarea></div>
      <div className={styles.formActions}><button type="button" onClick={onCancel}>Cancel</button><button type="submit">Save</button></div>
    </form>
  );
};

export default TransactionForm;
