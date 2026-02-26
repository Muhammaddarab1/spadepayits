// Reset password page: sets a new password using token from email
import { useState } from 'react';
import axios from '../api/axiosInstance.js';
import { Link, useParams } from 'react-router-dom';

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true); setMsg(''); setError('');
    try {
      const res = await axios.post('/api/auth/reset-password', { token, password });
      setMsg(res.data.message || 'Password updated');
    } catch (e) {
      setError(e.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white border rounded p-6 w-full max-w-sm space-y-3">
        <h2 className="text-xl font-semibold">Reset Password</h2>
        {msg && <div className="text-sm text-green-700">{msg}</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div>
          <label className="block text-xs text-gray-500">New Password</label>
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="border rounded px-2 py-1 w-full" required />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Confirm Password</label>
          <input type="password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} className="border rounded px-2 py-1 w-full" required />
        </div>
        <button disabled={loading} className="w-full px-3 py-2 rounded bg-primary text-white hover:opacity-90 disabled:opacity-60">
          {loading ? 'Updating…' : 'Set New Password'}
        </button>
        <div className="text-sm text-center">
          <Link to="/login" className="text-blue-600">Back to sign in</Link>
        </div>
      </form>
    </div>
  );
}
