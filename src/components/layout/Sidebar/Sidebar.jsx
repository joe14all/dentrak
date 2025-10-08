import React from 'react';
import styles from './Sidebar.module.css';
import { useAuth } from '../../../contexts/AuthContext/AuthContext';
import { useNavigation } from '../../../contexts/NavigationContext/NavigationContext';

// Correctly import the image files to get their paths
import logo from '../../../assets/images/logo.png';
import name from '../../../assets/images/name.png'; 

import { LayoutDashboard, Building2, PenSquare, Banknote, Receipt, FileText, Settings, Lock } from 'lucide-react';

const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Practices', icon: Building2 },
    { name: 'Entries', icon: PenSquare },
    { name: 'Payments', icon: Banknote },
    { name: 'Transactions', icon: Receipt }, 
    { name: 'Reports', icon: FileText },
    { name: 'Settings', icon: Settings },
];

// The component is now simpler and only relies on hover (handled in CSS)
const Sidebar = ({ onMouseEnter, onMouseLeave }) => {
    const { lockApp } = useAuth();
    const { activePage, setActivePage } = useNavigation();

    return (
        <aside 
          className={styles.sidebar}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
            <div className={styles.logoContainer}>
                {/* Use the imported paths in the src attribute */}
                <img src={logo} alt="Dentrak Logo" className={styles.logoImage} />
                <img src={name} alt="Dentrak Name" className={styles.logoNameImage} />
            </div>
            <nav className={styles.navigation}>
                <ul>
                    {navItems.map((item) => (
                        <li key={item.name} className={activePage === item.name ? styles.active : ''}>
                            <a href="#" onClick={() => setActivePage(item.name)}>
                                <item.icon className={styles.icon} size={20} />
                                <span className={styles.navText}>{item.name}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className={styles.footer}>
                <button onClick={lockApp} className={styles.lockButton}>
                    <Lock className={styles.icon} size={16} />
                    <span className={styles.navText}>Lock App</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;

