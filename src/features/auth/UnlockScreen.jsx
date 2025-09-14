import React from 'react';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import styles from './UnlockScreen.module.css';

const UnlockScreen = () => {
  const { unlockApp, authStatus } = useAuth();

  return (
    <div className={styles.unlockContainer}>
      <div className={styles.unlockBox}>
        <div className={styles.logo}>
          <h1>Dentrak</h1>
        </div>
        <p className={styles.prompt}>
          Please authenticate to continue
        </p>
        <button onClick={unlockApp} className={styles.unlockButton}>
          Unlock with Fingerprint
        </button>
        {authStatus === 'failed' && <p className={styles.error}>Authentication Failed. Please try again.</p>}
        {authStatus === 'pending' && <p className={styles.status}>Waiting for fingerprint...</p>}
      </div>
    </div>
  );
};

export default UnlockScreen;
