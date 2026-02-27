// App routes and layout with role-based protection
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import HomeDashboard from './pages/HomeDashboard.jsx';
import Login from './pages/Login.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import Roles from './pages/Roles.jsx';
import Users from './pages/Users.jsx';
import ChangePassword from './pages/ChangePassword.jsx';
import TicketNew from './pages/TicketNew.jsx';
import TicketEdit from './pages/TicketEdit.jsx';
import SalesNew from './pages/SalesNew.jsx';
import SalesEdit from './pages/SalesEdit.jsx';
import SalesList from './pages/SalesList.jsx';
import MyAssignments from './pages/MyAssignments.jsx';

const Protected = () => {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }
  return <Outlet />;
};

const AppLayout = () => (
  <div className="h-screen flex">
    <Sidebar />
    <div className="flex-1 flex flex-col">
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
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/change-password" element={<Protected />} >
        <Route index element={<ChangePassword />} />
      </Route>
      <Route element={<Protected />}>
        <Route element={<AppLayout />}>
          <Route index element={<HomeDashboard />} />
          <Route path="troubleshooting" element={<Dashboard />} />
          <Route path="roles" element={<Roles />} />
          <Route path="users" element={<Users />} />
          <Route path="tickets/new" element={<TicketNew />} />
          <Route path="tickets/:id" element={<TicketEdit />} />
          <Route path="assignments" element={<MyAssignments />} />
          <Route path="sales" element={<SalesList />} />
          <Route path="sales/new" element={<SalesNew />} />
          <Route path="sales/:id" element={<SalesEdit />} />
        </Route>
      </Route>
    </Routes>
  );
}
