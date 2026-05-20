/**
 * @vizzo/admin — AdminLayout Layout Component
 * Standard layout wrapper for authenticated administrative screens.
 * Contains glowing RTL crimson sidebar navigation and content bounds.
 */

import { NavLink, Outlet } from 'react-router-dom';
import { useAdmin } from './AdminGate';

export function AdminLayout() {
  const { adminEmail, signOut } = useAdmin();

  return (
    <div className="admin-app-shell">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar" dir="rtl">
        <div className="sidebar-header">
          <div className="sidebar-logo">Vizzo Admin</div>
          <span className="sidebar-role-badge">المسؤول العام للمنصة</span>
        </div>

        <nav className="sidebar-nav">
          <NavLink 
            to="/" 
            className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
            end
          >
            <span className="nav-icon">📊</span>
            <span className="nav-label">مركز العمليات</span>
          </NavLink>

          <NavLink 
            to="/merchants" 
            className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">🏪</span>
            <span className="nav-label">دليل التجار</span>
          </NavLink>

          <NavLink 
            to="/subscriptions" 
            className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">💸</span>
            <span className="nav-label">دفتر الاشتراكات</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="nav-link-item" style={{ cursor: 'default', background: 'none' }}>
            <span className="nav-icon">👤</span>
            <span className="nav-label" style={{ fontSize: '12px', wordBreak: 'break-all', opacity: 0.8 }}>
              {adminEmail}
            </span>
          </div>
          <button className="logout-btn" onClick={signOut} type="button">
            <span className="nav-icon">🚪</span>
            <span className="nav-label">تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Administrative Screen Render View */}
      <main className="admin-main-content">
        <Outlet />
      </main>
    </div>
  );
}
