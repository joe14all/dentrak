import React, { useState, useEffect } from 'react';
import styles from './ExpenseForm.module.css';
import { usePractices } from '../../contexts/PracticeContext/PracticeContext';
import { Receipt, Calendar, DollarSign, Tag, Building2, FileText } from 'lucide-react';

const ExpenseForm = ({ expenseToEdit, onSave, onCancel }) => {
  const { practices } = usePractices();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    amount: '',
    description: '',
    practiceId: null,
    vendor: '',
    paymentMethod: 'credit_card',
    receiptNumber: '',
    notes: '',
    taxDeductible: true,
  });

  useEffect(() => {
    if (expenseToEdit) {
      setFormData({
        date: expenseToEdit.date?.split('T')[0] || new Date().toISOString().split('T')[0],
        category: expenseToEdit.category || '',
        amount: expenseToEdit.amount || '',
        description: expenseToEdit.description || '',
        practiceId: expenseToEdit.practiceId || null,
        vendor: expenseToEdit.vendor || '',
        paymentMethod: expenseToEdit.paymentMethod || 'credit_card',
        receiptNumber: expenseToEdit.receiptNumber || '',
        notes: expenseToEdit.notes || '',
        taxDeductible: expenseToEdit.taxDeductible !== false,
      });
    }
  }, [expenseToEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const expenseData = {
      ...formData,
      amount: parseFloat(formData.amount) || 0,
      practiceId: formData.practiceId ? parseInt(formData.practiceId) : null,
    };

    onSave(expenseData);
  };

  // Group categories by type
  const categoryGroups = {
    'Vehicle & Travel': ['Mileage', 'Parking & Tolls', 'Travel & Lodging'],
    'Professional Development': ['Continuing Education', 'Professional Dues & Memberships', 'Professional Subscriptions'],
    'Office & Equipment': ['Office Supplies', 'Equipment & Tools', 'Software & Technology'],
    'Insurance': ['Malpractice Insurance', 'Health Insurance', 'Disability Insurance'],
    'Professional Services': ['Accounting & Tax Prep', 'Legal Fees', 'Consulting Services'],
    'Business Operations': ['Marketing & Advertising', 'Phone & Internet', 'Business Meals (50% deductible)'],
    'Other': ['Uniforms & Scrubs', 'Licenses & Permits', 'Other Business Expense'],
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGrid}>
        {/* Date */}
        <div className={styles.formGroup}>
          <label htmlFor="date">
            <Calendar size={16} />
            Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        {/* Amount */}
        <div className={styles.formGroup}>
          <label htmlFor="amount">
            <DollarSign size={16} />
            Amount
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            step="0.01"
            min="0"
            placeholder="0.00"
            required
          />
        </div>

        {/* Category */}
        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
          <label htmlFor="category">
            <Tag size={16} />
            Category
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select a category...</option>
            {Object.entries(categoryGroups).map(([group, cats]) => (
              <optgroup key={group} label={group}>
                {cats.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
          <label htmlFor="description">
            <FileText size={16} />
            Description
          </label>
          <input
            type="text"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Brief description of the expense"
            required
          />
        </div>

        {/* Vendor */}
        <div className={styles.formGroup}>
          <label htmlFor="vendor">
            <Receipt size={16} />
            Vendor/Payee
          </label>
          <input
            type="text"
            id="vendor"
            name="vendor"
            value={formData.vendor}
            onChange={handleChange}
            placeholder="Amazon, Staples, etc."
          />
        </div>

        {/* Receipt Number */}
        <div className={styles.formGroup}>
          <label htmlFor="receiptNumber">Receipt #</label>
          <input
            type="text"
            id="receiptNumber"
            name="receiptNumber"
            value={formData.receiptNumber}
            onChange={handleChange}
            placeholder="Optional"
          />
        </div>

        {/* Practice (Optional) */}
        <div className={styles.formGroup}>
          <label htmlFor="practiceId">
            <Building2 size={16} />
            Related Practice
          </label>
          <select
            id="practiceId"
            name="practiceId"
            value={formData.practiceId || ''}
            onChange={handleChange}
          >
            <option value="">General (All Practices)</option>
            {practices
              .filter(p => p.status === 'active' || !p.status)
              .map(practice => (
                <option key={practice.id} value={practice.id}>
                  {practice.name}
                </option>
              ))}
          </select>
        </div>

        {/* Payment Method */}
        <div className={styles.formGroup}>
          <label htmlFor="paymentMethod">Payment Method</label>
          <select
            id="paymentMethod"
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
          >
            <option value="credit_card">Credit Card</option>
            <option value="debit_card">Debit Card</option>
            <option value="cash">Cash</option>
            <option value="check">Check</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>

        {/* Notes */}
        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
          <label htmlFor="notes">Additional Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            placeholder="Any additional details..."
          />
        </div>

        {/* Tax Deductible Checkbox */}
        <div className={`${styles.formGroup} ${styles.checkboxGroup}`}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="taxDeductible"
              checked={formData.taxDeductible}
              onChange={handleChange}
            />
            <span>Tax deductible expense</span>
          </label>
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" onClick={onCancel} className={styles.cancelButton}>
          Cancel
        </button>
        <button type="submit" className={styles.saveButton}>
          {expenseToEdit ? 'Update Expense' : 'Add Expense'}
        </button>
      </div>
    </form>
  );
};

export default ExpenseForm;
