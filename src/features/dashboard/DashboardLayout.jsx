import React, { useRef } from 'react';
import { useDashboard } from '../../contexts/DashboardContext/DashboardContext';
import WidgetWrapper from './WidgetWrapper';
import styles from './DashboardLayout.module.css';

// Import all widget components
import KpiWidget from './widgets/KpiWidget';
import QuickActionsWidget from './widgets/QuickActionsWidget';
import AlertsWidget from './widgets/AlertsWidget';
import RecentActivityWidget from './widgets/RecentActivityWidget';
import PracticeSummaryWidget from './widgets/PracticeSummaryWidget';

const widgetMap = {
  'kpi-production': (props) => <KpiWidget {...props} type="production" />,
  'kpi-collection': (props) => <KpiWidget {...props} type="collection" />,
  'kpi-days-worked': (props) => <KpiWidget {...props} type="days-worked" />,
  'kpi-outstanding-cheques': (props) => <KpiWidget {...props} type="outstanding-cheques" />,
  'quick-actions': QuickActionsWidget,
  'alerts': AlertsWidget,
  'recent-activity': RecentActivityWidget,
  'practice-summary': PracticeSummaryWidget,
};

const DashboardLayout = () => {
  const { layoutOrder, widgets, onLayoutReorder } = useDashboard();
  const dragItem = useRef();
  const dragOverItem = useRef();

  const handleDragStart = (e, index) => {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = 'move';
  };
  
  // This function now updates the layout in real-time for the preview effect.
  const handleDragEnter = (e, index) => {
    if (index === dragItem.current) return; // Don't reorder if dragging over itself

    const newOrder = [...layoutOrder];
    const draggedItemContent = newOrder.splice(dragItem.current, 1)[0];
    newOrder.splice(index, 0, draggedItemContent);
    
    // Update the ref to the new position of the item being dragged
    dragItem.current = index;
    
    // Call the context function to update the state visually
    onLayoutReorder(newOrder);
  };

  const handleDragEnd = () => {
    // Clear refs when the drag is finished
    dragItem.current = null;
    dragOverItem.current = null;
  };

  return (
    <div className={styles.grid}>
      {layoutOrder.map((widgetId, index) => {
        const WidgetComponent = widgetMap[widgetId];
        const widgetConfig = widgets.find(w => w.id === widgetId);
        if (!WidgetComponent || !widgetConfig) return null;

        const style = {
            gridColumn: `span ${widgetConfig.w}`,
            gridRow: `span ${widgetConfig.h}`,
        };

        return (
          <div 
            key={widgetId}
            style={style}
            className={styles.gridItem}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
          >
            <WidgetWrapper widgetId={widgetId}>
              <WidgetComponent />
            </WidgetWrapper>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardLayout;

