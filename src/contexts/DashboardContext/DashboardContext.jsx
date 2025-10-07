import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { getDashboardLayout, saveDashboardLayout, defaultLayout } from '../../database/preferences';

// A simple debounce helper to prevent saving to the database on every pixel moved.
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
  const [layoutOrder, setLayoutOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [widgets, setWidgets] = useState([
    { id: 'kpi-production', name: 'Monthly Production', w: 1, h: 1 },
    { id: 'kpi-collection', name: 'Monthly Collection', w: 1, h: 1 },
    { id: 'kpi-days-worked', name: 'Days Worked', w: 1, h: 1 },
    { id: 'kpi-outstanding-cheques', name: 'Outstanding Cheques', w: 1, h: 1 },
    { id: 'quick-actions', name: 'Quick Actions', w: 2, h: 2 },
    { id: 'alerts', name: 'Alerts & Notifications', w: 2, h: 2 },
    { id: 'recent-activity', name: 'Recent Activity', w: 2, h: 3 },
    { id: 'practice-summary', name: 'Practice Summary', w: 2, h: 3 },
  ]);
  
  // This robust effect ensures the layout is loaded correctly once on mount.
  useEffect(() => {
    let isMounted = true;
    const loadLayout = async () => {
      const savedOrder = await getDashboardLayout();
      if (isMounted) {
        setLayoutOrder(savedOrder);
        setIsLoading(false);
      }
    };
    loadLayout();
    return () => { isMounted = false; };
  }, []);

  // Create a debounced version of the save function that we can call frequently.
  const debouncedSave = useRef(
    debounce((order) => {
      saveDashboardLayout(order);
    }, 500) // Saves 500ms after the last layout change.
  ).current;

  // This function now ONLY updates the state for a live preview.
  const handleLayoutReorder = useCallback((newOrder) => {
    setLayoutOrder(newOrder);
    // Trigger the debounced save, which will execute after the user stops dragging.
    debouncedSave(newOrder);
  }, [debouncedSave]);

  const addWidget = (widgetId) => {
    if (layoutOrder.includes(widgetId)) return;
    const newOrder = [...layoutOrder, widgetId];
    // This now updates the state and saves automatically via the debounced effect.
    handleLayoutReorder(newOrder);
  };
  
  const removeWidget = (widgetId) => {
    const newOrder = layoutOrder.filter(id => id !== widgetId);
    handleLayoutReorder(newOrder);
  };

  const value = {
    layoutOrder,
    widgets,
    isLoading,
    onLayoutReorder: handleLayoutReorder, // This is now safe for previews
    addWidget,
    removeWidget,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) throw new Error('useDashboard must be used within a DashboardProvider');
  return context;
};

