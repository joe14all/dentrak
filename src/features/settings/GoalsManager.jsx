import React, { useState } from 'react';
import { useGoals } from '../../contexts/GoalContext/GoalContext';
import { usePractices } from '../../contexts/PracticeContext/PracticeContext';
import styles from './GoalsManager.module.css'; // Create this CSS file next
import { PlusCircle, Edit, Trash2, Target, Calendar, Repeat } from 'lucide-react';

// Helper to format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0);
};

// Sub-component for the Goal Form (used for adding/editing)
const GoalForm = ({ goalToEdit, onSave, onCancel, practices }) => {
    const [formData, setFormData] = useState(
        goalToEdit || {
            type: 'production',
            timePeriod: 'monthly',
            year: new Date().getFullYear(),
            month: new Date().getMonth(),
            practiceId: null, // Default to overall
            targetAmount: 10000,
        }
    );

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        let processedValue = value;
        if (type === 'number') {
            processedValue = parseFloat(value) || 0;
        } else if (name === 'month' || name === 'year' || name === 'practiceId') {
            processedValue = value === 'overall' ? null : parseInt(value, 10);
        }
         // Ensure month is nullified if timePeriod becomes annual
        if (name === 'timePeriod' && value === 'annual') {
            setFormData(prev => ({ ...prev, month: undefined, [name]: value }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: processedValue }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className={styles.goalForm}>
            <div className={styles.formRow}>
                {/* Goal Type */}
                <div className={styles.formGroup}>
                    <label htmlFor="goalType">Goal Type</label>
                    <select id="goalType" name="type" value={formData.type} onChange={handleChange}>
                        <option value="production">Production</option>
                        <option value="collection">Collection</option>
                        <option value="income">Income (Calculated Pay)</option>
                    </select>
                </div>
                {/* Practice Scope */}
                 <div className={styles.formGroup}>
                    <label htmlFor="practiceId">For Practice</label>
                    <select id="practiceId" name="practiceId" value={formData.practiceId ?? 'overall'} onChange={handleChange}>
                        <option value="overall">Overall (All Practices)</option>
                        {practices.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
            </div>

             <div className={styles.formRow}>
                 {/* Time Period */}
                <div className={styles.formGroup}>
                    <label htmlFor="timePeriod">Time Period</label>
                    <select id="timePeriod" name="timePeriod" value={formData.timePeriod} onChange={handleChange}>
                        <option value="monthly">Monthly</option>
                        <option value="annual">Annual</option>
                    </select>
                </div>
                {/* Year */}
                <div className={styles.formGroup}>
                    <label htmlFor="year">Year</label>
                    <input type="number" id="year" name="year" value={formData.year} onChange={handleChange} />
                </div>
                {/* Month (Conditional) */}
                {formData.timePeriod === 'monthly' && (
                    <div className={styles.formGroup}>
                        <label htmlFor="month">Month</label>
                        <select id="month" name="month" value={formData.month} onChange={handleChange}>
                            {Array.from({ length: 12 }).map((_, i) => (
                                <option key={i} value={i}>
                                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

             <div className={styles.formGroup}>
                <label htmlFor="targetAmount">Target Amount ($)</label>
                <input type="number" id="targetAmount" name="targetAmount" value={formData.targetAmount} onChange={handleChange} step="100" />
            </div>

            <div className={styles.formActions}>
                <button type="button" onClick={onCancel} className={styles.cancelButton}>Cancel</button>
                <button type="submit" className={styles.saveButton}>{goalToEdit ? 'Save Changes' : 'Add Goal'}</button>
            </div>
        </form>
    );
};


// Main Manager Component
const GoalsManager = () => {
    const { goals, isLoading, addNewGoal, editGoal, removeGoal } = useGoals();
    const { practices } = usePractices(); // Get practices for display names
    const [editingGoal, setEditingGoal] = useState(null); // null or the goal object being edited
    const [isAdding, setIsAdding] = useState(false);

    const handleSaveGoal = async (goalData) => {
        try {
            if (editingGoal) {
                await editGoal(editingGoal.id, goalData);
            } else {
                await addNewGoal(goalData);
            }
            setEditingGoal(null);
            setIsAdding(false);
        } catch (error) {
            alert(`Error saving goal: ${error.message}`);
        }
    };

    const handleCancel = () => {
        setEditingGoal(null);
        setIsAdding(false);
    };

    const getPracticeName = (practiceId) => {
        if (practiceId == null) return "Overall";
        const practice = practices.find(p => p.id === practiceId);
        return practice ? practice.name : `Practice ID ${practiceId}`;
    };

     const getTimePeriodDisplay = (goal) => {
        if (goal.timePeriod === 'annual') return goal.year;
        const monthName = new Date(goal.year, goal.month).toLocaleString('default', { month: 'long' });
        return `${monthName} ${goal.year}`;
    };

    if (isLoading) {
        return <p>Loading goals...</p>;
    }

    return (
        <div className={styles.goalsManager}>
            {isAdding || editingGoal ? (
                 <GoalForm
                    goalToEdit={editingGoal}
                    onSave={handleSaveGoal}
                    onCancel={handleCancel}
                    practices={practices}
                 />
            ) : (
                <>
                    <button onClick={() => setIsAdding(true)} className={styles.addButton}>
                        <PlusCircle size={16} /> Add New Goal
                    </button>
                    {goals.length > 0 ? (
                        <ul className={styles.goalList}>
                            {goals.map(goal => (
                                <li key={goal.id} className={styles.goalItem}>
                                    <div className={styles.goalInfo}>
                                        <span className={styles.goalTarget}><Target size={14}/> {formatCurrency(goal.targetAmount)}</span>
                                        <span className={styles.goalType}>{goal.type}</span>
                                        <span className={styles.goalPeriod}><Calendar size={14}/> {getTimePeriodDisplay(goal)}</span>
                                        <span className={styles.goalScope}>{getPracticeName(goal.practiceId)}</span>
                                    </div>
                                    <div className={styles.goalActions}>
                                        <button onClick={() => setEditingGoal(goal)}><Edit size={16} /></button>
                                        <button onClick={() => removeGoal(goal.id)} className={styles.deleteButton}><Trash2 size={16} /></button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className={styles.noGoals}>No goals set yet. Click "Add New Goal" to get started.</p>
                    )}
                </>
            )}
        </div>
    );
};

export default GoalsManager;