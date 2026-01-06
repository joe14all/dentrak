/**
 * BankSyncSettings Component
 * 
 * Settings panel for configuring bank sync preferences,
 * practice matching patterns, and sync defaults.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useBankSync } from '../../contexts/BankSyncContext';
import { usePractices } from '../../contexts/PracticeContext/PracticeContext';
import { getUniqueBankSenders } from '../../database/bankSync';
import styles from './BankSyncSettings.module.css';
import {
  Plus,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Link2,
  Building2,
  Download,
  Landmark,
} from 'lucide-react';

const BankSyncSettings = () => {
  const { 
    settings, 
    updateSettings, 
    updatePracticePatterns, 
    connections, 
    syncAccount,
    isSyncing,
    openTellerConnect,
    connectAccount,
    clearAllPending,
    getPendingCount,
    getAutoMatchedCount,
    getNeedReviewCount,
  } = useBankSync();
  const { practices } = usePractices();

  // Local state for editing
  const [practicePatterns, setPracticePatterns] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  
  // Sender selection state
  const [uniqueSenders, setUniqueSenders] = useState([]);
  const [loadingSenders, setLoadingSenders] = useState(true);
  const [selectedSender, setSelectedSender] = useState('');
  const [selectedPractice, setSelectedPractice] = useState('');
  const [fetchingTransactions, setFetchingTransactions] = useState(false);

  // All active practices (both contractor and employment)
  const activePractices = practices.filter(p => p.status === 'active');

  // Load patterns from settings
  useEffect(() => {
    if (settings?.practicePatterns) {
      setPracticePatterns([...settings.practicePatterns]);
    }
  }, [settings]);

  // Load unique senders from bank transactions
  const loadSenders = useCallback(async () => {
    setLoadingSenders(true);
    try {
      const senders = await getUniqueBankSenders();
      setUniqueSenders(senders);
    } catch (err) {
      console.error('Failed to load senders:', err);
    } finally {
      setLoadingSenders(false);
    }
  }, []);

  useEffect(() => {
    loadSenders();
  }, [loadSenders]);

  // Fetch transactions from all connected accounts
  const handleFetchTransactions = async () => {
    if (connections.length === 0) return;
    
    setFetchingTransactions(true);
    try {
      // Sync all connected accounts to get income transactions (last 6 months)
      for (const connection of connections) {
        await syncAccount(connection, {
          transactionTypes: { income: true, expense: false },
          dateRange: 'last-6-months',
          statusFilter: 'posted',
          destination: 'pending-review',
        });
      }
      // Reload senders after sync
      await loadSenders();
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setFetchingTransactions(false);
    }
  };

  // Clear all pending and re-sync with new patterns
  const handleClearAndResync = async () => {
    if (connections.length === 0) return;
    if (!window.confirm('This will clear all pending transactions and re-import them with current sender links. Continue?')) {
      return;
    }
    
    setFetchingTransactions(true);
    try {
      // First clear all pending
      await clearAllPending();
      
      // Then re-sync
      for (const connection of connections) {
        await syncAccount(connection, {
          transactionTypes: { income: true, expense: false },
          dateRange: 'last-6-months',
          statusFilter: 'posted',
          destination: 'pending-review',
        });
      }
      // Reload senders after sync
      await loadSenders();
    } catch (err) {
      console.error('Failed to clear and re-sync:', err);
    } finally {
      setFetchingTransactions(false);
    }
  };

  // Handle Teller Connect for adding bank
  const handleConnectBank = () => {
    openTellerConnect((data) => {
      if (data.accounts && data.accounts.length > 0) {
        // Connect first account automatically
        connectAccount(data.accounts[0], data.enrollment);
      }
    });
  };

  // Track changes
  useEffect(() => {
    const originalPatterns = settings?.practicePatterns || [];
    const hasPatternChanges = JSON.stringify(practicePatterns) !== JSON.stringify(originalPatterns);
    setHasChanges(hasPatternChanges);
  }, [practicePatterns, settings]);

  // Add sender-practice link
  const handleAddLink = () => {
    if (!selectedSender || !selectedPractice) {
      return;
    }

    // Check if sender is already linked
    const exists = practicePatterns.some(p => 
      p.pattern.toUpperCase() === selectedSender.toUpperCase()
    );
    
    if (exists) {
      setSaveStatus('duplicate');
      setTimeout(() => setSaveStatus(null), 3000);
      return;
    }

    setPracticePatterns([
      ...practicePatterns,
      { 
        pattern: selectedSender, 
        practiceName: selectedPractice, 
        isRegex: false,
        id: Date.now() 
      }
    ]);
    setSelectedSender('');
    setSelectedPractice('');
  };

  // Remove pattern
  const handleRemovePattern = (index) => {
    const updated = [...practicePatterns];
    updated.splice(index, 1);
    setPracticePatterns(updated);
  };

  // Update pattern practice
  const handleUpdatePractice = (index, practiceName) => {
    const updated = [...practicePatterns];
    updated[index] = { ...updated[index], practiceName };
    setPracticePatterns(updated);
  };

  // Save patterns
  const handleSave = async () => {
    try {
      await updatePracticePatterns(practicePatterns);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  // Get unlinked senders (not yet in patterns)
  const unlinkedSenders = uniqueSenders.filter(s => 
    !practicePatterns.some(p => p.pattern.toUpperCase() === s.sender.toUpperCase())
  );

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);
  };

  return (
    <div className={styles.container}>
      {/* Status Message */}
      {saveStatus && (
        <div className={`${styles.statusMessage} ${styles[saveStatus]}`}>
          {saveStatus === 'success' ? (
            <>
              <CheckCircle2 size={18} />
              <span>Settings saved successfully!</span>
            </>
          ) : saveStatus === 'duplicate' ? (
            <>
              <AlertCircle size={18} />
              <span>This sender is already linked to a practice.</span>
            </>
          ) : (
            <>
              <AlertCircle size={18} />
              <span>Failed to save settings. Please try again.</span>
            </>
          )}
        </div>
      )}

      {/* Pending Stats & Re-sync */}
      {connections.length > 0 && (
        <div className={styles.syncStats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{getNeedReviewCount()}</span>
            <span className={styles.statLabel}>pending</span>
          </div>
          <div className={styles.statItem}>
            <span className={`${styles.statValue} ${styles.autoMatched}`}>{getAutoMatchedCount()}</span>
            <span className={styles.statLabel}>auto-matched</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{getPendingCount()}</span>
            <span className={styles.statLabel}>need review</span>
          </div>
          <button 
            onClick={handleClearAndResync}
            className={styles.resyncBtn}
            disabled={fetchingTransactions || isSyncing}
          >
            <RefreshCw size={14} className={fetchingTransactions || isSyncing ? styles.spinIcon : ''} />
            Clear & Re-sync
          </button>
        </div>
      )}

      {/* Practice Auto-Linking Section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <Link2 size={20} />
            <h4>Sender → Practice Links</h4>
          </div>
          <p className={styles.sectionDescription}>
            Link transaction senders to practices. When new transactions arrive from a linked sender, 
            they will be automatically assigned to the corresponding practice.
          </p>
        </div>

        {/* Existing Links */}
        {practicePatterns.length > 0 && (
          <div className={styles.linksList}>
            <div className={styles.linksHeader}>
              <span>Sender</span>
              <span>Practice</span>
              <span></span>
            </div>
            {practicePatterns.map((pattern, index) => (
              <div key={pattern.id || index} className={styles.linkItem}>
                <div className={styles.senderName}>
                  <Building2 size={16} />
                  <span>{pattern.pattern}</span>
                </div>
                <select
                  value={pattern.practiceName}
                  onChange={(e) => handleUpdatePractice(index, e.target.value)}
                  className={styles.practiceSelect}
                >
                  <option value="">Select practice...</option>
                  {activePractices.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleRemovePattern(index)}
                  className={styles.removeBtn}
                  title="Remove link"
                  style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', fontSize: '14px', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Link */}
        <div className={styles.addLinkSection}>
          <h5>Add New Link</h5>
          
          {loadingSenders ? (
            <div className={styles.loadingState}>
              <RefreshCw size={18} className={styles.spinIcon} />
              <span>Loading transaction senders...</span>
            </div>
          ) : connections.length === 0 ? (
            /* No bank connected */
            <div className={styles.connectBankPrompt}>
              <Landmark size={24} />
              <p>Connect your bank account to fetch transaction senders</p>
              <button onClick={handleConnectBank} className={styles.connectBankBtn}>
                <Plus size={16} /> Connect Bank Account
              </button>
            </div>
          ) : uniqueSenders.length === 0 ? (
            /* Bank connected but no transactions fetched */
            <div className={styles.fetchTransactionsPrompt}>
              <Download size={24} />
              <p>Fetch transactions from your connected bank to see senders</p>
              <button 
                onClick={handleFetchTransactions} 
                className={styles.fetchBtn}
                disabled={fetchingTransactions || isSyncing}
              >
                {fetchingTransactions || isSyncing ? (
                  <>
                    <RefreshCw size={16} className={styles.spinIcon} />
                    Fetching...
                  </>
                ) : (
                  <>
                    <Download size={16} /> Fetch Transactions
                  </>
                )}
              </button>
            </div>
          ) : unlinkedSenders.length === 0 ? (
            <div className={styles.allLinkedState}>
              <CheckCircle2 size={18} />
              <span>All senders have been linked to practices!</span>
              <button 
                onClick={handleFetchTransactions} 
                className={styles.refreshBtn}
                disabled={fetchingTransactions || isSyncing}
                title="Fetch new transactions"
              >
                <RefreshCw size={14} className={fetchingTransactions || isSyncing ? styles.spinIcon : ''} />
              </button>
            </div>
          ) : (
            /* Senders available - show selection */
            <>
              <div className={styles.addLinkForm}>
                <div className={styles.senderSelectGroup}>
                  <label>Select Sender</label>
                  <select
                    value={selectedSender}
                    onChange={(e) => setSelectedSender(e.target.value)}
                    className={styles.senderSelect}
                  >
                    <option value="">Choose a sender...</option>
                    {unlinkedSenders.map((s, idx) => (
                      <option key={idx} value={s.sender}>
                        {s.sender} ({s.count} transaction{s.count > 1 ? 's' : ''} • {formatCurrency(s.totalAmount)})
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.practiceSelectGroup}>
                  <label>Link to Practice</label>
                  <select
                    value={selectedPractice}
                    onChange={(e) => setSelectedPractice(e.target.value)}
                  >
                    <option value="">Select practice...</option>
                    {activePractices.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAddLink}
                  className={styles.addBtn}
                  disabled={!selectedSender || !selectedPractice}
                >
                  <Plus size={18} /> Link
                </button>
              </div>
              <div className={styles.refreshRow}>
                <button 
                  onClick={handleFetchTransactions} 
                  className={styles.refreshSendersBtn}
                  disabled={fetchingTransactions || isSyncing}
                >
                  <RefreshCw size={14} className={fetchingTransactions || isSyncing ? styles.spinIcon : ''} />
                  {fetchingTransactions || isSyncing ? 'Fetching...' : 'Fetch new transactions'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Help Text */}
        <div className={styles.helpText}>
          <Sparkles size={16} />
          <div>
            <p><strong>How it works:</strong> When you sync transactions from your bank, the system checks each transaction&apos;s sender against your links.</p>
            <p>Matched transactions will have the practice pre-selected when you review them, saving you time.</p>
          </div>
        </div>
      </div>

      {/* Auto Sync Settings */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <RefreshCw size={20} />
            <h4>Auto Sync Settings</h4>
          </div>
          <p className={styles.sectionDescription}>
            Configure automatic synchronization for connected bank accounts.
          </p>
        </div>

        <div className={styles.settingRow}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={settings?.globalAutoSync?.enabled || false}
              onChange={(e) => updateSettings({
                ...settings,
                globalAutoSync: {
                  ...settings?.globalAutoSync,
                  enabled: e.target.checked,
                  frequency: settings?.globalAutoSync?.frequency || 'daily',
                }
              })}
            />
            <span>Enable Global Auto Sync</span>
          </label>
          <p className={styles.settingHint}>
            Automatically sync all connected accounts with auto-sync enabled.
          </p>
        </div>

        {settings?.globalAutoSync?.enabled && (
          <div className={styles.settingRow}>
            <label>Sync Frequency</label>
            <select
              value={settings?.globalAutoSync?.frequency || 'daily'}
              onChange={(e) => updateSettings({
                ...settings,
                globalAutoSync: {
                  ...settings?.globalAutoSync,
                  enabled: true,
                  frequency: e.target.value,
                }
              })}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        )}
      </div>

      {/* Save Button */}
      {hasChanges && (
        <div className={styles.saveBar}>
          <span>You have unsaved changes</span>
          <button onClick={handleSave} className={styles.saveBtn}>
            <Save size={18} /> Save Changes
          </button>
        </div>
      )}
    </div>
  );
};

export default BankSyncSettings;
