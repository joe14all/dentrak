import React from 'react';
import styles from './Sidebar.module.css';
import { useAuth } from '../../../contexts/AuthContext/AuthContext';
import { LayoutDashboard, Building2, PenSquare, Receipt, FileText, Settings, Lock, Stethoscope } from 'lucide-react';

const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: 'Dashboard' },
    { name: 'Practices', icon: Building2, path: 'Practices' },
    { name: 'Entries', icon: PenSquare, path: 'Entries' },
    { name: 'Cheques', icon: Receipt, path: 'Cheques' },
    { name: 'Reports', icon: FileText, path: 'Reports' },
    { name: 'Settings', icon: Settings, path: 'Settings' },
];

// isCollapsed prop is no longer needed
const Sidebar = ({ activePage, setActivePage }) => {
    const { lockApp } = useAuth();

    return (
        // The component now manages its collapsed/expanded state based on hover
        <aside className={styles.sidebar}>
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

