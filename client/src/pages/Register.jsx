// Registration page for new users
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import background from '../assets/background.jpg';      

export default function Register() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(name, email, password);
    } catch (e) {
      setError(e.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{ background: `url(${background})` }} // Replace with your actual image path
    >
      {/* Dark overlay to make the login box pop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>
    
      <form onSubmit={submit} className="bg-white border rounded p-6 w-full max-w-sm space-y-3">
        <h2 className="text-xl font-semibold">Create Account</h2>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div>
          <label className="block text-xs text-gray-500">Name</label>
          <input value={name} onChange={(e)=>setName(e.target.value)} className="border rounded px-2 py-1 w-full" required />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Email</label>
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="border rounded px-2 py-1 w-full" required />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Password</label>
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="border rounded px-2 py-1 w-full" required />
        </div>
        <button disabled={loading} className="w-full px-3 py-2 rounded bg-primary text-white hover:opacity-90 disabled:opacity-60">
          {loading ? 'Creating…' : 'Create Account'}
        </button>
        <div className="text-sm text-center">
          <Link to="/login" className="text-blue-600">Already have an account? Sign in</Link>
        </div>
      </form>
    </div>
  );
}
