import React from 'react';
import styles from './Sidebar.module.css';
import { useAuth } from '../../../contexts/AuthContext/AuthContext';
import { useNavigation } from '../../../contexts/NavigationContext/NavigationContext';
import { LayoutDashboard, Building2, PenSquare, Banknote, Receipt, FileText, Settings, Lock, Stethoscope } from 'lucide-react';

const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Practices', icon: Building2 },
    { name: 'Entries', icon: PenSquare },
    { name: 'Payments', icon: Banknote },
    { name: 'Transactions', icon: Receipt }, // Renamed from 'Cheques'
    { name: 'Reports', icon: FileText },
    { name: 'Settings', icon: Settings },
];

const Sidebar = ({ isCollapsed, onMouseEnter, onMouseLeave }) => {
    const { lockApp } = useAuth();
    const { activePage, setActivePage } = useNavigation();

    return (
        <aside 
          className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
            <div className={styles.logoContainer}>
                <Stethoscope className={styles.logoIcon} size={32} />
                <span className={styles.logoText}>Dentrak</span>
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

