// Change password page, forces first-time password update
import { useState } from 'react';
import axios from '../api/axiosInstance.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function ChangePassword() {
  const { user, setAuthState, logout } = useAuth();
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) { setError('Passwords do not match'); return; }
    if (newPassword.length < 8) { setError('New password must be at least 8 characters'); return; }
    setLoading(true); setError(''); setMessage('');
    try {
      const res = await axios.post('/api/auth/change-password', { currentPassword, newPassword });
      setMessage('Password updated');
      setAuthState(res.data.token || null, res.data.user);
      // Validate session before navigating
      try {
        await axios.get('/api/users/me');
        setTimeout(() => navigate('/'), 500);
      } catch (error) {
        console.error('Session validation failed after password change:', error);
        // Still navigate but inform user
        setTimeout(() => navigate('/'), 500);
      }
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to change password';
      setError(msg);
      // If backend signals session invalid, force logout to re-login
      if (e.response?.status === 401 || e.response?.status === 423) logout();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white border rounded p-6 w-full max-w-sm space-y-3">
        <h2 className="text-xl font-semibold">Change Password</h2>
        {user?.mustChangePassword && (
          <div className="text-sm text-orange-700 bg-orange-50 border border-orange-200 p-2 rounded">
            For security, you must change your password before using the system.
          </div>
        )}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {message && <div className="text-sm text-green-700">{message}</div>}
        <div>
          <label className="block text-xs text-gray-500">Current Password</label>
          <input type="password" value={currentPassword} onChange={(e)=>setCurrent(e.target.value)} className="border rounded px-2 py-1 w-full" required />
        </div>
        <div>
          <label className="block text-xs text-gray-500">New Password</label>
          <input type="password" value={newPassword} onChange={(e)=>setNewPass(e.target.value)} className="border rounded px-2 py-1 w-full" required />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Confirm New Password</label>
          <input type="password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} className="border rounded px-2 py-1 w-full" required />
        </div>
        <button disabled={loading} className="w-full px-3 py-2 rounded bg-primary text-white hover:opacity-90 disabled:opacity-60">
          {loading ? 'Updating…' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
