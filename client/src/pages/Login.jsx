// Login page for existing users
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import background from '../assets/backround.png';
  
export default function Login() {
  const auth = useAuth();
  if (!auth) return null;
  const { login } = auth;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const original = document.documentElement.style.fontSize || '';
    document.documentElement.style.fontSize = '12px'; // 75% of default 16px
    return () => { document.documentElement.style.fontSize = original; };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (e) {
      setError(e.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 bg-slate-900">
      <img
        src={background}
        alt=""
        className="pointer-events-none select-none absolute inset-0 w-full h-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/30" />
      <form
        onSubmit={submit}
        className="relative w-full max-w-sm space-y-4 rounded-xl border border-white/30 bg-white/5 backdrop-blur-md shadow-2xl p-6 text-white"
      >
        <h2 className="text-xl font-semibold text-center">Login</h2>
        {error && <div className="text-sm text-red-200 bg-red-600/40 border border-red-300/40 rounded px-3 py-2 text-center">{error}</div>}
        <div>
          <label className="block text-xs text-white/80">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            className="mt-1 w-full h-11 rounded px-3 py-2 border border-white/60 bg-white/10 text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-white/70"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-white/80">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            className="mt-1 w-full h-11 rounded px-3 py-2 border border-white/60 bg-white/10 text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-white/70"
            required
          />
        </div>
        <button
          disabled={loading}
          className="w-full h-11 rounded bg-teal-500/90 hover:bg-teal-500 transition text-white font-medium disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Login'}
        </button>
        <div className="text-sm text-right">
          <Link to="/forgot-password" className="text-white/90 underline decoration-white/50 hover:decoration-white">
            Forgot password?
          </Link>
        </div>
      </form>
    </div>
  );
}
