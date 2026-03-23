// Top navigation bar with user actions
import { useAuth } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import NotificationBell from './NotificationBell.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);


  return (
    <header className="h-14 flex items-center justify-between border-b bg-white px-4 shadow-sm">
      <h1 className="text-lg font-semibold text-primary">Ticket Management</h1>
      <div className="flex items-center gap-4">
        <NotificationBell />
        <div className="relative border-l pl-4" ref={menuRef}>
        <button
          aria-label="Account menu"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-gray-100 overflow-hidden ring-2 ring-transparent hover:ring-primary/20 transition-all"
        >
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name || 'Me'} className="h-9 w-9 object-cover" />
          ) : (
            <div className="h-9 w-9 flex items-center justify-center bg-primary/10 text-primary font-bold">{(user?.name || '?')[0]}</div>
          )}
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-56 rounded-lg border bg-white shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 text-sm text-gray-700 border-b bg-gray-50/50">
              <div className="font-bold truncate">{user?.name}</div>
              <div className="text-xs text-gray-500 font-medium">{user?.role}</div>
            </div>
            <Link
              to="/change-password"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
            >
              Change Password
            </Link>
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="w-full text-left block px-4 py-2.5 text-sm hover:bg-red-50 text-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        )}
        </div>
      </div>
    </header>
  );
}
