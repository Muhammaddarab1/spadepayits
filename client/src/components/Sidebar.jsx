// Sidebar navigation with role-aware items
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Sidebar() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  return (
    <aside className="w-60 border-r bg-white hidden md:flex flex-col">
      <NavLink
        to="/"
        className="h-14 flex items-center px-4 border-b font-semibold hover:bg-gray-50"
      >
        SPADE PAY
      </NavLink>
      <nav className="p-4 space-y-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `block px-3 py-2 rounded transition ${
              isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
            }`
          }
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/troubleshooting"
          className={({ isActive }) =>
            `block px-3 py-2 rounded transition ${
              isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
            }`
          }
        >
          Troubleshooting
        </NavLink>
        <NavLink
          to="/sales"
          className={({ isActive }) =>
            `block px-3 py-2 rounded transition ${
              isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
            }`
          }
        >
          Sales
        </NavLink>
        {isAdmin && (
          <>
            <NavLink
              to="/users"
              className={({ isActive }) =>
                `block px-3 py-2 rounded transition ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                }`
              }
            >
              Users
            </NavLink>
            <NavLink
              to="/roles"
              className={({ isActive }) =>
                `block px-3 py-2 rounded transition ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                }`
              }
            >
              Roles
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
}
