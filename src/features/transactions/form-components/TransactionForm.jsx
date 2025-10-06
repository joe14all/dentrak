/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import styles from './TransactionForm.module.css';

const getInitialState = (type) => ({
  practiceId: '',
  amount: 0,
  notes: '',
  dateReceived: new Date().toISOString().split('T')[0],
  chequeNumber: '',
  status: 'Pending',
  paymentDate: new Date().toISOString().split('T')[0],
  transactionId: '',
  sourceBank: '',
  confirmationNumber: '',
  senderEmail: '',
});

const TransactionForm = ({ transactionToEdit, initialType, practices, onSave, onCancel }) => {
  const [formType, setFormType] = useState(initialType);
  const [formData, setFormData] = useState(getInitialState(initialType));

  useEffect(() => {
    if (transactionToEdit) {
      const type = transactionToEdit.type;
      setFormType(type);
      setFormData({ 
          ...getInitialState(type), 
          ...transactionToEdit,
          dateReceived: transactionToEdit.dateReceived ? new Date(transactionToEdit.dateReceived).toISOString().split('T')[0] : '',
          paymentDate: transactionToEdit.paymentDate ? new Date(transactionToEdit.paymentDate).toISOString().split('T')[0] : '',
      });
    } else {
      setFormType(initialType);
      setFormData({ ...getInitialState(initialType), practiceId: practices?.[0]?.id || '' });
    }
  }, [transactionToEdit, initialType, practices]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleTypeChange = (newType) => {
    setFormType(newType);
    // Reset form data to defaults for the new type, but keep common fields
    setFormData(prev => ({
      ...getInitialState(newType),
      practiceId: prev.practiceId,
      amount: prev.amount,
      notes: prev.notes,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ type: formType, ...formData });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
            <label>Transaction Type</label>
            <div className={styles.segmentedControl}>
                <button type="button" onClick={() => handleTypeChange('cheques')} className={formType === 'cheques' ? styles.active : ''}>Cheque</button>
                <button type="button" onClick={() => handleTypeChange('directDeposits')} className={formType === 'directDeposits' ? styles.active : ''}>Direct Deposit</button>
                <button type="button" onClick={() => handleTypeChange('eTransfers')} className={formType === 'eTransfers' ? styles.active : ''}>E-Transfer</button>
            </div>
        </div>

      <div className={styles.formGroup}><label>Practice</label><select name="practiceId" value={formData.practiceId} onChange={handleChange}>{practices.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
      
      {formType === 'cheques' && (
        <>
          <div className={styles.formRow}><div className={styles.formGroup}><label>Amount ($)</label><input type="number" name="amount" value={formData.amount} onChange={handleChange} /></div><div className={styles.formGroup}><label>Date Received</label><input type="date" name="dateReceived" value={formData.dateReceived} onChange={handleChange} /></div></div>
          <div className={styles.formRow}><div className={styles.formGroup}><label>Cheque #</label><input type="text" name="chequeNumber" value={formData.chequeNumber} onChange={handleChange} /></div><div className={styles.formGroup}><label>Status</label><select name="status" value={formData.status} onChange={handleChange}><option>Pending</option><option>Deposited</option><option>Cleared</option><option>Bounced</option></select></div></div>
        </>
      )}
      
      {formType === 'directDeposits' && (
         <>
          <div className={styles.formRow}><div className={styles.formGroup}><label>Amount ($)</label><input type="number" name="amount" value={formData.amount} onChange={handleChange} /></div><div className={styles.formGroup}><label>Payment Date</label><input type="date" name="paymentDate" value={formData.paymentDate} onChange={handleChange} /></div></div>
          <div className={styles.formRow}><div className={styles.formGroup}><label>Transaction ID</label><input type="text" name="transactionId" value={formData.transactionId} onChange={handleChange} /></div><div className={styles.formGroup}><label>Source Bank</label><input type="text" name="sourceBank" value={formData.sourceBank} onChange={handleChange} /></div></div>
        </>
      )}
      
      {formType === 'eTransfers' && (
         <>
            <div className={styles.formRow}><div className={styles.formGroup}><label>Amount ($)</label><input type="number" name="amount" value={formData.amount} onChange={handleChange} /></div><div className={styles.formGroup}><label>Payment Date</label><input type="date" name="paymentDate" value={formData.paymentDate} onChange={handleChange} /></div></div>
            <div className={styles.formRow}><div className={styles.formGroup}><label>Confirmation #</label><input type="text" name="confirmationNumber" value={formData.confirmationNumber} onChange={handleChange} /></div><div className={styles.formGroup}><label>Sender Email</label><input type="email" name="senderEmail" value={formData.senderEmail} onChange={handleChange} /></div></div>
         </>
      )}
      
      <div className={styles.formGroup}><label>Notes</label><textarea name="notes" value={formData.notes} onChange={handleChange} rows="3"></textarea></div>
      <div className={styles.formActions}><button type="button" onClick={onCancel}>Cancel</button><button type="submit">Save</button></div>
    </form>
  );
};

export default TransactionForm;

