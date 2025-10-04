import React, { useState, useEffect } from 'react';
import styles from './PaymentForm.module.css';

const getInitialState = () => ({
  practiceId: '',
  paymentDate: new Date().toISOString().split('T')[0],
  amount: 0,
  paymentMethod: 'cheque',
  referenceNumber: '',
  notes: '',
});

const PaymentForm = ({ paymentToEdit, practices, onSave, onCancel }) => {
  const [formData, setFormData] = useState(getInitialState());

  useEffect(() => {
    if (paymentToEdit) {
      setFormData({
        ...getInitialState(),
        ...paymentToEdit,
        paymentDate: new Date(paymentToEdit.paymentDate).toISOString().split('T')[0],
      });
    } else {
      setFormData({ ...getInitialState(), practiceId: practices?.[0]?.id || '' });
    }
  }, [paymentToEdit, practices]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="practiceId">Practice</label>
        <select id="practiceId" name="practiceId" value={formData.practiceId} onChange={handleChange} required>
          {practices.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="paymentDate">Payment Date</label>
          <input type="date" id="paymentDate" name="paymentDate" value={formData.paymentDate} onChange={handleChange} required />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="amount">Amount ($)</label>
          <input type="number" step="0.01" id="amount" name="amount" value={formData.amount} onChange={handleChange} required />
        </div>
      </div>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="paymentMethod">Payment Method</label>
          <select id="paymentMethod" name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}>
            <option value="cheque">Cheque</option>
            <option value="e-transfer">E-Transfer</option>
            <option value="directDeposit">Direct Deposit</option>
            <option value="cash">Cash</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="referenceNumber">Reference #</label>
          <input type="text" id="referenceNumber" name="referenceNumber" value={formData.referenceNumber} onChange={handleChange} />
        </div>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="notes">Notes</label>
        <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows="3"></textarea>
      </div>
      <div className={styles.formActions}>
        <button type="button" onClick={onCancel} className={styles.cancelButton}>Cancel</button>
        <button type="submit" className={styles.saveButton}>{paymentToEdit ? 'Save Changes' : 'Add Payment'}</button>
      </div>
    </form>
  );
};

export default PaymentForm;
