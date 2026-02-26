// Forgot password page: requests a password reset email
import { useState } from 'react';
import axios from '../api/axiosInstance.js';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(''); setError('');
    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      setMsg(res.data.message || 'If that email exists, a reset link has been sent');
    } catch (e) {
      setError(e.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white border rounded p-6 w-full max-w-sm space-y-3">
        <h2 className="text-xl font-semibold">Forgot Password</h2>
        {msg && <div className="text-sm text-green-700">{msg}</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div>
          <label className="block text-xs text-gray-500">Email</label>
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="border rounded px-2 py-1 w-full" required />
        </div>
        <button disabled={loading} className="w-full px-3 py-2 rounded bg-primary text-white hover:opacity-90 disabled:opacity-60">
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
        <div className="text-sm text-center">
          <Link to="/login" className="text-blue-600">Back to sign in</Link>
        </div>
      </form>
    </div>
  );
}
