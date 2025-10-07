import React from 'react';
import styles from './WidgetWrapper.module.css';
import { useDashboard } from '../../contexts/DashboardContext/DashboardContext';
import { X, GripVertical } from 'lucide-react';

const WidgetWrapper = ({ widgetId, children }) => {
    const { widgets, removeWidget } = useDashboard();
    const widget = widgets.find(w => w.id === widgetId);

    return (
        <div className={styles.widgetWrapper}>
            <div className={styles.widgetHeader}>
                <div className={`${styles.dragHandle} drag-handle`} title="Drag to move">
                    <GripVertical size={16} />
                </div>
                <h4 className={styles.widgetTitle}>{widget?.name || 'Widget'}</h4>
                <button 
                    onClick={() => removeWidget(widgetId)} 
                    className={styles.removeButton} 
                    title="Remove widget"
                >
                    <X size={14} />
                </button>
            </div>
            <div className={styles.widgetContent}>
                {children}
            </div>
        </div>
    );
};

export default WidgetWrapper;

