/**
 * BankSyncPanel Component
 * 
 * Main panel for managing bank connections and syncing transactions.
 * Similar to JBook's BankConnection component but adapted for Dentrak.
 */
import React, { useState, useCallback } from 'react';
import { useBankSync } from '../../contexts/BankSyncContext';
import { usePractices } from '../../contexts/PracticeContext/PracticeContext';
import { getDefaultBankSyncOptions } from '../../services/bankSyncService';
import Modal from '../common/Modal/Modal';
import styles from './BankSyncPanel.module.css';
import { 
  Landmark, 
  CreditCard, 
  RefreshCw, 
  Settings, 
  Unplug, 
  History,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Filter,
} from 'lucide-react';

const BankSyncPanel = () => {
  const {
    connections,
    isLoading,
    isSyncing,
    syncingAccountId,
    syncStatus,
    error,
    openTellerConnect,
    connectAccount,
    disconnectAccount,
    updateConnectionSettings,
    syncAccount,
    clearStatus,
  } = useBankSync();

  // eslint-disable-next-line no-unused-vars
  const { practices } = usePractices();

  // Modal states
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [syncOptions, setSyncOptions] = useState(getDefaultBankSyncOptions());
  
  // Account selection for new connections
  const [availableAccounts, setAvailableAccounts] = useState(null);
  const [showAccountSelectModal, setShowAccountSelectModal] = useState(false);

  // Handle Teller Connect success
  const handleTellerSuccess = useCallback((data) => {
    if (data.accounts && data.accounts.length > 1) {
      setAvailableAccounts(data);
      setShowAccountSelectModal(true);
    } else if (data.accounts && data.accounts.length === 1) {
      connectAccount(data.accounts[0], data.enrollment);
    }
  }, [connectAccount]);

  // Handle connect button click
  const handleConnectBank = useCallback(() => {
    openTellerConnect(handleTellerSuccess);
  }, [openTellerConnect, handleTellerSuccess]);

  // Handle account selection
  const handleSelectAccount = useCallback(async (account) => {
    if (availableAccounts) {
      await connectAccount(account, availableAccounts.enrollment);
    }
  }, [availableAccounts, connectAccount]);

  const handleSelectAllAccounts = useCallback(async () => {
    if (availableAccounts) {
      for (const account of availableAccounts.accounts) {
        await connectAccount(account, availableAccounts.enrollment);
      }
      setShowAccountSelectModal(false);
      setAvailableAccounts(null);
    }
  }, [availableAccounts, connectAccount]);

  // Open sync modal
  const handleOpenSyncModal = (connection) => {
    setSelectedConnection(connection);
    setSyncOptions(connection.defaultSyncOptions || getDefaultBankSyncOptions());
    setShowSyncModal(true);
  };

  // Open settings modal
  const handleOpenSettingsModal = (connection) => {
    setSelectedConnection(connection);
    setShowSettingsModal(true);
  };

  // Open history modal
  const handleOpenHistoryModal = (connection) => {
    setSelectedConnection(connection);
    setShowHistoryModal(true);
  };

  // Handle sync with options
  const handleSync = async () => {
    if (selectedConnection) {
      await syncAccount(selectedConnection, syncOptions);
      setShowSyncModal(false);
    }
  };

  // Handle disconnect
  const handleDisconnect = async (connection) => {
    if (window.confirm(`Disconnect ${connection.institutionName}? This won't delete imported transactions.`)) {
      await disconnectAccount(connection.id);
    }
  };

  // Toggle auto sync
  const handleToggleAutoSync = async (connection) => {
    await updateConnectionSettings(connection.id, {
      autoSyncEnabled: !connection.autoSyncEnabled,
    });
  };

  // Update default sync options
  const handleSaveSettings = async () => {
    if (selectedConnection) {
      await updateConnectionSettings(selectedConnection.id, {
        defaultSyncOptions: syncOptions,
        syncFrequency: selectedConnection.syncFrequency,
      });
      setShowSettingsModal(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <RefreshCw className={styles.spinIcon} size={24} />
        <span>Loading bank connections...</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Status Messages */}
      {(syncStatus || error) && (
        <div className={`${styles.statusBanner} ${error ? styles.error : styles.success}`}>
          {error ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{error || syncStatus}</span>
          <button onClick={clearStatus} className={styles.dismissBtn}>×</button>
        </div>
      )}

      {/* Connected Accounts */}
      {connections.length === 0 ? (
        <div className={styles.emptyState}>
          <Landmark size={48} className={styles.emptyIcon} />
          <h4>No Bank Accounts Connected</h4>
          <p>Connect your business bank accounts to automatically import income transactions.</p>
          <button onClick={handleConnectBank} className={styles.connectBtn}>
            <Plus size={18} /> Connect Bank Account
          </button>
        </div>
      ) : (
        <>
          <div className={styles.accountsTable}>
            <table>
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Institution</th>
                  <th>Auto Sync</th>
                  <th>Last Synced</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {connections.map((connection) => (
                  <tr key={connection.id} className={syncingAccountId === connection.accountId ? styles.syncing : ''}>
                    <td>
                      <div className={styles.accountCell}>
                        {connection.accountType === 'credit' ? (
                          <CreditCard size={20} className={styles.accountIcon} />
                        ) : (
                          <Landmark size={20} className={styles.accountIcon} />
                        )}
                        <div className={styles.accountInfo}>
                          <span className={styles.accountName}>{connection.accountName}</span>
                          <span className={styles.accountNumber}>****{connection.lastFour}</span>
                        </div>
                      </div>
                    </td>
                    <td>{connection.institutionName}</td>
                    <td>
                      <label className={styles.toggleSwitch}>
                        <input
                          type="checkbox"
                          checked={connection.autoSyncEnabled || false}
                          onChange={() => handleToggleAutoSync(connection)}
                        />
                        <span className={styles.slider}></span>
                      </label>
                    </td>
                    <td>
                      {connection.lastSyncAt ? (
                        <span className={styles.lastSync}>
                          {new Date(connection.lastSyncAt).toLocaleDateString()}
                          <span className={styles.lastSyncTime}>
                            {new Date(connection.lastSyncAt).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </span>
                      ) : (
                        <span className={styles.neverSynced}>Never</span>
                      )}
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button
                          onClick={() => handleOpenSyncModal(connection)}
                          disabled={isSyncing}
                          className={styles.actionBtn}
                          title="Sync Transactions"
                          style={{ backgroundColor: '#3B82F6', color: 'white', border: 'none', fontSize: '16px', width: '32px', height: '32px' }}
                        >
                          ↻
                        </button>
                        <button
                          onClick={() => handleOpenSettingsModal(connection)}
                          className={styles.actionBtn}
                          title="Settings"
                          style={{ backgroundColor: '#3B82F6', color: 'white', border: 'none', fontSize: '16px', width: '32px', height: '32px' }}
                        >
                          ⚙
                        </button>
                        <button
                          onClick={() => handleOpenHistoryModal(connection)}
                          className={styles.actionBtn}
                          title="Sync History"
                          style={{ backgroundColor: '#3B82F6', color: 'white', border: 'none', fontSize: '16px', width: '32px', height: '32px' }}
                        >
                          ◷
                        </button>
                        <button
                          onClick={() => handleDisconnect(connection)}
                          className={`${styles.actionBtn} ${styles.disconnectBtn}`}
                          title="Disconnect"
                          style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', fontSize: '16px', width: '32px', height: '32px' }}
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.footer}>
            <button onClick={handleConnectBank} className={styles.addAccountBtn}>
              <Plus size={16} /> Add Another Account
            </button>
          </div>
        </>
      )}

      {/* Account Selection Modal */}
      <Modal
        isOpen={showAccountSelectModal}
        onClose={() => {
          setShowAccountSelectModal(false);
          setAvailableAccounts(null);
        }}
        title="Select Accounts to Connect"
      >
        <div className={styles.accountSelectModal}>
          <p>We found {availableAccounts?.accounts?.length} accounts. Select which ones to connect:</p>
          <div className={styles.accountList}>
            {availableAccounts?.accounts?.map((account) => (
              <div key={account.id} className={styles.accountOption}>
                <div className={styles.accountOptionInfo}>
                  {account.type === 'credit' ? <CreditCard size={20} /> : <Landmark size={20} />}
                  <div>
                    <strong>{account.name}</strong>
                    <span>****{account.last_four}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleSelectAccount(account)}
                  className={styles.selectBtn}
                >
                  Connect
                </button>
              </div>
            ))}
          </div>
          <div className={styles.modalFooter}>
            <button onClick={handleSelectAllAccounts} className={styles.primaryBtn}>
              Connect All Accounts
            </button>
          </div>
        </div>
      </Modal>

      {/* Sync Options Modal */}
      <Modal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        title={`Sync ${selectedConnection?.accountName || 'Account'}`}
      >
        <div className={styles.syncModal}>
          <div className={styles.syncOption}>
            <label>Transaction Types</label>
            <div className={styles.checkboxGroup}>
              <label>
                <input
                  type="checkbox"
                  checked={syncOptions.transactionTypes.income}
                  onChange={(e) => setSyncOptions({
                    ...syncOptions,
                    transactionTypes: { ...syncOptions.transactionTypes, income: e.target.checked }
                  })}
                />
                Income
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={syncOptions.transactionTypes.expense}
                  onChange={(e) => setSyncOptions({
                    ...syncOptions,
                    transactionTypes: { ...syncOptions.transactionTypes, expense: e.target.checked }
                  })}
                />
                Expenses
              </label>
            </div>
          </div>

          <div className={styles.syncOption}>
            <label>Date Range</label>
            <select
              value={syncOptions.dateRange}
              onChange={(e) => setSyncOptions({ ...syncOptions, dateRange: e.target.value })}
            >
              <option value="last-7-days">Last 7 Days</option>
              <option value="last-30-days">Last 30 Days</option>
              <option value="last-90-days">Last 90 Days</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="this-quarter">This Quarter</option>
              <option value="this-year">This Year</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div className={styles.syncOption}>
            <label>Transaction Status</label>
            <select
              value={syncOptions.statusFilter}
              onChange={(e) => setSyncOptions({ ...syncOptions, statusFilter: e.target.value })}
            >
              <option value="posted">Posted Only</option>
              <option value="pending">Pending Only</option>
              <option value="all">All</option>
            </select>
          </div>

          <div className={styles.syncOption}>
            <label>
              <input
                type="checkbox"
                checked={syncOptions.amountFilter?.enabled || false}
                onChange={(e) => setSyncOptions({
                  ...syncOptions,
                  amountFilter: { ...syncOptions.amountFilter, enabled: e.target.checked }
                })}
              />
              Filter by Amount
            </label>
            {syncOptions.amountFilter?.enabled && (
              <div className={styles.amountFilters}>
                <input
                  type="number"
                  placeholder="Min Amount"
                  value={syncOptions.amountFilter.minAmount || ''}
                  onChange={(e) => setSyncOptions({
                    ...syncOptions,
                    amountFilter: { ...syncOptions.amountFilter, minAmount: e.target.value ? parseFloat(e.target.value) : null }
                  })}
                />
                <input
                  type="number"
                  placeholder="Max Amount"
                  value={syncOptions.amountFilter.maxAmount || ''}
                  onChange={(e) => setSyncOptions({
                    ...syncOptions,
                    amountFilter: { ...syncOptions.amountFilter, maxAmount: e.target.value ? parseFloat(e.target.value) : null }
                  })}
                />
              </div>
            )}
          </div>

          <div className={styles.infoBox}>
            <AlertCircle size={16} />
            <span>Transactions will be imported for review. You can approve and link them to practices before finalizing.</span>
          </div>

          <div className={styles.modalFooter}>
            <button onClick={() => setShowSyncModal(false)} className={styles.cancelBtn}>
              Cancel
            </button>
            <button onClick={handleSync} className={styles.primaryBtn} disabled={isSyncing}>
              {isSyncing ? (
                <>
                  <RefreshCw size={16} className={styles.spinIcon} /> Syncing...
                </>
              ) : (
                <>
                  <RefreshCw size={16} /> Sync Now
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title={`${selectedConnection?.accountName || 'Account'} Settings`}
      >
        <div className={styles.settingsModal}>
          <div className={styles.settingGroup}>
            <h4>Auto Sync</h4>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={selectedConnection?.autoSyncEnabled || false}
                onChange={() => {
                  setSelectedConnection({
                    ...selectedConnection,
                    autoSyncEnabled: !selectedConnection?.autoSyncEnabled
                  });
                }}
              />
              Enable automatic sync
            </label>
            {selectedConnection?.autoSyncEnabled && (
              <select
                value={selectedConnection?.syncFrequency || 'daily'}
                onChange={(e) => setSelectedConnection({
                  ...selectedConnection,
                  syncFrequency: e.target.value
                })}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            )}
          </div>

          <div className={styles.settingGroup}>
            <h4>Default Sync Options</h4>
            <p className={styles.hint}>These settings will be used as defaults when syncing this account.</p>
            
            <label>Date Range</label>
            <select
              value={syncOptions.dateRange}
              onChange={(e) => setSyncOptions({ ...syncOptions, dateRange: e.target.value })}
            >
              <option value="last-7-days">Last 7 Days</option>
              <option value="last-30-days">Last 30 Days</option>
              <option value="last-90-days">Last 90 Days</option>
              <option value="this-month">This Month</option>
            </select>
          </div>

          <div className={styles.modalFooter}>
            <button onClick={() => setShowSettingsModal(false)} className={styles.cancelBtn}>
              Cancel
            </button>
            <button onClick={handleSaveSettings} className={styles.primaryBtn}>
              Save Settings
            </button>
          </div>
        </div>
      </Modal>

      {/* History Modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title={`Sync History - ${selectedConnection?.accountName || 'Account'}`}
      >
        <div className={styles.historyModal}>
          {(!selectedConnection?.syncHistory || selectedConnection.syncHistory.length === 0) ? (
            <div className={styles.emptyHistory}>
              <Clock size={32} />
              <p>No sync history yet</p>
            </div>
          ) : (
            <div className={styles.historyList}>
              {selectedConnection.syncHistory.slice().reverse().map((entry, index) => (
                <div key={index} className={`${styles.historyEntry} ${styles[entry.result]}`}>
                  <div className={styles.historyHeader}>
                    <span className={styles.historyDate}>
                      {new Date(entry.date).toLocaleString()}
                    </span>
                    <span className={`${styles.historyBadge} ${styles[entry.result]}`}>
                      {entry.result}
                    </span>
                  </div>
                  <div className={styles.historyCounts}>
                    {entry.counts?.pending > 0 && (
                      <span>📥 {entry.counts.pending} imported</span>
                    )}
                    {entry.counts?.income > 0 && (
                      <span>💰 {entry.counts.income} income</span>
                    )}
                    {entry.counts?.expense > 0 && (
                      <span>💸 {entry.counts.expense} expenses</span>
                    )}
                  </div>
                  {entry.errorMessage && (
                    <div className={styles.historyError}>{entry.errorMessage}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default BankSyncPanel;
