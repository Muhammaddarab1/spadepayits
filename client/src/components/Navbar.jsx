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
      <div className="relative" ref={menuRef}>
        <button
          aria-label="Account menu"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-center h-9 w-9 rounded hover:bg-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
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
    </header>
  );
}
