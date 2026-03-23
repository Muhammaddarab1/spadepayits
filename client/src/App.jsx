// App routes and layout with role-based protection
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import HomeDashboard from './pages/HomeDashboard.jsx';
import Login from './pages/Login.jsx';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import Roles from './pages/Roles.jsx';
import Users from './pages/Users.jsx';
import ChangePassword from './pages/ChangePassword.jsx';
import TicketNew from './pages/TicketNew.jsx';
import TicketEdit from './pages/TicketEdit.jsx';
import Profile from './pages/Profile.jsx';
import SalesNew from './pages/SalesNew.jsx';
import SalesEdit from './pages/SalesEdit.jsx';
import SalesList from './pages/SalesList.jsx';
import MyAssignments from './pages/MyAssignments.jsx';
import Reports from './pages/Reports.jsx';
import Customers from './pages/Customers.jsx';

const Protected = () => {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }
  return <Outlet />;
};

const SalesProtected = () => {
  const { user } = useAuth();
  const canSales =
    user?.role === 'Admin' ||
    user?.permissions?.['sales.viewMenu'];
  return canSales ? <Outlet /> : <Navigate to="/" replace />;
};
const TroubleshootingProtected = () => {
  const { user } = useAuth();
  const canTs =
    user?.role === 'Admin' ||
    user?.permissions?.['troubleshooting.viewMenu'];
  return canTs ? <Outlet /> : <Navigate to="/" replace />;
};

const AppLayout = () => (
  <div className="h-screen flex bg-bgSoft">
    <Sidebar />
    <div className="flex-1 flex flex-col min-w-0">
      <Navbar />
      <main className="p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  </div>
);

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/change-password" element={<Protected />} >
        <Route index element={<ChangePassword />} />
      </Route>
      <Route element={<Protected />}>
        <Route element={<AppLayout />}>
          <Route index element={<HomeDashboard />} />
          <Route element={<TroubleshootingProtected />}>
            <Route path="troubleshooting" element={<Dashboard />} />
            <Route path="tickets/new" element={<TicketNew />} />
            <Route path="tickets/:id" element={<TicketEdit />} />
            <Route path="assignments" element={<MyAssignments />} />
          </Route>
          <Route path="roles" element={<Roles />} />
          <Route path="users" element={<Users />} />
          <Route path="profile" element={<Profile />} />
          <Route path="reports" element={<Reports />} />
          <Route path="customers" element={<Customers />} />
          <Route element={<SalesProtected />}>
            <Route path="sales" element={<SalesList />} />
            <Route path="sales/new" element={<SalesNew />} />
            <Route path="sales/:id" element={<SalesEdit />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
