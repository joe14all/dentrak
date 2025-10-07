import React, { useState } from 'react';
// The react-grid-layout CSS imports are no longer needed.
import { useDashboard } from '../../contexts/DashboardContext/DashboardContext';
import DashboardLayout from '../../features/dashboard/DashboardLayout';
import Modal from '../../components/common/Modal/Modal';
import AddWidgetPanel from '../../features/dashboard/AddWidgetPanel';
import styles from './DashboardPage.module.css';
import { LayoutGrid, PlusCircle, LoaderCircle } from 'lucide-react';

const DashboardPage = () => {
  const { layoutOrder, isLoading } = useDashboard();
  const [isAddWidgetOpen, setAddWidgetOpen] = useState(false);

  if (isLoading || !layoutOrder) {
    return (
      <div className={styles.loadingState}>
        <LoaderCircle size={48} className={styles.spinnerIcon} />
        <h3>Loading Dashboard...</h3>
      </div>
    );
  }

  return (
    <div className={styles.dashboardPage}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <LayoutGrid size={20} />
          <h3>My Dashboard</h3>
        </div>
        <button onClick={() => setAddWidgetOpen(true)}>
          <PlusCircle size={16} />
          Add Widget
        </button>
      </div>

      <DashboardLayout />

      <Modal isOpen={isAddWidgetOpen} onClose={() => setAddWidgetOpen(false)} title="Add Widget to Dashboard">
        <AddWidgetPanel
          activeWidgetIds={layoutOrder}
          onClose={() => setAddWidgetOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default DashboardPage;

