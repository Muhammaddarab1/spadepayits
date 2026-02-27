// Auth context handles authentication state and role-based rendering
// - Stores the current user and exposes login/logout helpers
// - On mount, validates session via /api/users/me
// - Uses HTTP-only cookies for authentication (no token in localStorage)
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from '../api/axiosInstance.js';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });
  const navigate = useNavigate();

  // Restore auth token from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  useEffect(() => {
    const validate = async () => {
      try {
        const res = await axios.get('/api/users/me');
        // Preserve permissions and mustChangePassword from backend
        setUser(res.data);
      } catch {
        // No valid session; clear user without calling logout endpoint
        setUser(null);
      }
    };
    validate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    // store token received from backend
    if (res.data.token) {
      localStorage.setItem('authToken', res.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    }
    setUser(res.data.user);
    if (res.data.user?.mustChangePassword) navigate('/change-password');
    else navigate('/');
  };

  const setAuthState = (newToken, newUser) => {
    if (newToken) {
      localStorage.setItem('authToken', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    }
    setUser(newUser);
  };

  const logout = () => {
    try { axios.post('/api/auth/logout').catch(()=>{}); } catch {}
    // Clear all auth data
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    navigate('/login');
  };

  const value = useMemo(() => ({ user, login, logout, setAuthState }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
