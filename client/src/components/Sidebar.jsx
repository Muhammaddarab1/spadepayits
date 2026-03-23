// Sidebar navigation with role-aware items
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useState, useEffect } from 'react';
import logo from '../assets/logo.avif';

/**
 * Sidebar
 * Renders left navigation with items gated by permissions and global settings.
 * - Shows Troubleshooting, Sales, Reports based on user.permissions
 */
export default function Sidebar() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const [collapsed, setCollapsed] = useState(false);
  const canSeeSales =
    isAdmin ||
    user?.permissions?.['sales.viewAll'] ||
    user?.permissions?.['sales.create'] ||
    user?.permissions?.['sales.update'];
  const canSeeTroubleshooting =
    isAdmin || user?.permissions?.['troubleshooting.viewMenu'];
  const canSeeReports = isAdmin || user?.permissions?.['reports.generate'];

  useEffect(() => {
    const v = localStorage.getItem('sidebarCollapsed') === '1';
    setCollapsed(v);
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebarCollapsed', next ? '1' : '0');
  };

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-60'} border-r bg-white hidden md:flex flex-col transition-all`}>
      <div className={`h-14 flex items-center px-3 border-b font-semibold ${collapsed ? 'justify-center' : ''}`}>
        <NavLink to="/" className="flex items-center gap-2">
          <img src={logo} alt="logo" className="h-8 w-8 object-contain" />
          {!collapsed && <span className="text-sm">Spade Pay</span>}
        </NavLink>
        <button onClick={toggle} className="ml-auto text-gray-500 hover:text-gray-700 px-2">
          {collapsed ? '▶' : '◀'}
        </button>
      </div>
      <nav className="p-4 space-y-2">
        <NavLink to="/" className={({ isActive }) => `block px-3 py-2 rounded transition ${isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}>
          {!collapsed ? 'Dashboard' : 'DB'}
        </NavLink>
        {canSeeTroubleshooting && (
          <NavLink to="/troubleshooting" className={({ isActive }) => `block px-3 py-2 rounded transition ${isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}>
            {!collapsed ? 'Troubleshooting' : 'TS'}
          </NavLink>
        )}
        {canSeeSales && (
          <NavLink to="/sales" className={({ isActive }) => `block px-3 py-2 rounded transition ${isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}>
            {!collapsed ? 'Sales' : 'SL'}
          </NavLink>
        )}
        {canSeeReports && (
          <NavLink to="/reports" className={({ isActive }) => `block px-3 py-2 rounded transition ${isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}>
            {!collapsed ? 'Reports' : 'RP'}
          </NavLink>
        )}
        {isAdmin && (
          <>
            <NavLink to="/users" className={({ isActive }) => `block px-3 py-2 rounded transition ${isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}>
              {!collapsed ? 'Users' : 'U'}
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
}