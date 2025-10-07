import React from 'react';
import styles from './AddWidgetPanel.module.css';
import { useDashboard } from '../../contexts/DashboardContext/DashboardContext';
import { Plus } from 'lucide-react';

const AddWidgetPanel = ({ activeWidgetIds, onClose }) => {
    const { widgets, addWidget } = useDashboard();

    const availableWidgets = widgets.filter(w => !activeWidgetIds.includes(w.id));

    const handleAdd = (widgetId) => {
        addWidget(widgetId);
        onClose();
    };

    return (
        <div className={styles.panel}>
            {availableWidgets.length > 0 ? (
                <div className={styles.widgetList}>
                    {availableWidgets.map(widget => (
                        <button key={widget.id} onClick={() => handleAdd(widget.id)} className={styles.widgetItem}>
                            <span>{widget.name}</span>
                            <Plus size={16} />
                        </button>
                    ))}
                </div>
            ) : (
                <p className={styles.noWidgetsText}>All available widgets are already on your dashboard.</p>
            )}
        </div>
    );
};

export default AddWidgetPanel;
