// Top navigation bar with user actions
import { useAuth } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

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
    <header className="h-14 flex items-center justify-between border-b bg-white px-4">
      <h1 className="text-lg font-semibold">Ticket Management</h1>
      <div className="flex items-center gap-2">
        <div className="relative" ref={menuRef}>
        <button
          aria-label="Account menu"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-center h-9 w-9 rounded hover:bg-gray-100 overflow-hidden"
        >
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name || 'Me'} className="h-9 w-9 object-cover" />
          ) : (
            <div className="h-9 w-9 flex items-center justify-center bg-gray-200 text-gray-700 font-medium">{(user?.name || '?')[0]}</div>
          )}
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-56 rounded border bg-white shadow">
            <div className="px-3 py-2 text-sm text-gray-700 border-b">
              <div className="font-medium truncate">{user?.name}</div>
              <div className="text-xs text-gray-500">{user?.role}</div>
            </div>
            <Link
              to="/change-password"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm hover:bg-gray-50"
            >
              Change Password
            </Link>
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="w-full text-left block px-3 py-2 text-sm hover:bg-gray-50"
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
