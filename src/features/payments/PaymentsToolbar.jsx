import React from 'react';
import styles from './PaymentsToolbar.module.css';
import { PlusCircle, X } from 'lucide-react';

const PaymentsToolbar = ({ practices, activeFilters, onFilterChange, onAddPayment }) => {
  
  const handleFilterChange = (field, value) => {
    onFilterChange(prev => ({ ...prev, [field]: value }));
  };

  const handleMethodChange = (method) => {
    const newMethods = new Set(activeFilters.methods);
    if (newMethods.has(method)) {
      newMethods.delete(method);
    } else {
      newMethods.add(method);
    }
    onFilterChange(prev => ({ ...prev, methods: Array.from(newMethods) }));
  };

  const handleClear = () => {
    onFilterChange({
      practiceId: 'all',
      methods: [],
      startDate: '',
      endDate: ''
    });
  };

  const paymentMethodOptions = ['cheque', 'e-transfer', 'directDeposit', 'cash'];
  
  const activeFilterCount = 
    (activeFilters.practiceId !== 'all' ? 1 : 0) +
    activeFilters.methods.length +
    (activeFilters.startDate ? 1 : 0) +
    (activeFilters.endDate ? 1 : 0);

  return (
    <div className={styles.toolbar}>
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Practice</label>
          <select value={activeFilters.practiceId} onChange={e => handleFilterChange('practiceId', e.target.value)}>
            <option value="all">All Practices</option>
            {(practices || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        
        <div className={styles.filterGroup}>
          <label>Payment Method</label>
          <div className={styles.checkboxGroup}>
            {paymentMethodOptions.map(method => (
                <label key={method} className={activeFilters.methods.includes(method) ? styles.active : ''}>
                    <input 
                        type="checkbox" 
                        checked={activeFilters.methods.includes(method)}
                        onChange={() => handleMethodChange(method)}
                    />
                    {method.replace(/([A-Z])/g, ' $1')}
                </label>
            ))}
          </div>
        </div>
        
        <div className={styles.filterGroup}>
          <label>Date Range</label>
          <div className={styles.dateInputs}>
            <input type="date" value={activeFilters.startDate} onChange={e => handleFilterChange('startDate', e.target.value)} />
            <span>-</span>
            <input type="date" value={activeFilters.endDate} onChange={e => handleFilterChange('endDate', e.target.value)} />
          </div>
        </div>
        
        {activeFilterCount > 0 && (
          <button onClick={handleClear} className={styles.clearButton}>
            <X size={14} /> Clear ({activeFilterCount})
          </button>
        )}
      </div>
      <button className={styles.addButton} onClick={onAddPayment}>
        <PlusCircle size={16} />
        <span>Log Payment</span>
      </button>
    </div>
  );
};

export default PaymentsToolbar;

