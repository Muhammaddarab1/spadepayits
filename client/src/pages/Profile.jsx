import { useEffect, useState } from 'react';
import axios from '../api/axiosInstance.js';
import { useAuth } from '../context/AuthContext.jsx';
import BackButton from '../components/BackButton.jsx';

export default function Profile() {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState({ name: '', email: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await axios.get('/api/users/me');
        if (!mounted) return;
        setForm({ name: res.data.name || '', email: res.data.email || '' });
      } catch {}
    };
    load(); return () => { mounted = false; };
  }, []);

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setMsg('');
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      if (avatarFile) fd.append('avatar', avatarFile);
      const res = await axios.patch('/api/users/me', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMsg('Profile updated');
      refresh?.();
    } catch (e) {
      setMsg(e.response?.data?.message || 'Failed to update');
    } finally { setSaving(false); }
  };

  // theme handling
  const [theme, setTheme] = useState(localStorage.getItem('theme')||'light');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Profile</h2>
        <BackButton />
      </div>
      <form onSubmit={submit} className="bg-white border rounded p-4 mt-4 space-y-3">
+        <div>
+          <label className="block text-xs text-gray-500">Theme</label>
+          <div className="flex items-center gap-2">
+            <span>Light</span>
+            <input type="checkbox" checked={theme==='dark'} onChange={(e)=>setTheme(e.target.checked?'dark':'light')} />
+            <span>Dark</span>
+          </div>
+        </div>
        <div>
          <label className="block text-xs text-gray-500">Name</label>
          <input value={form.name} onChange={(e)=>setForm(f=>({ ...f, name: e.target.value }))} className="border rounded px-2 py-1 w-full" />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Username</label>
          <input value={form.email} readOnly className="border rounded px-2 py-1 w-full bg-gray-50 text-gray-500 cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Profile Image</label>
          <input type="file" onChange={(e)=>setAvatarFile(e.target.files?.[0]||null)} className="w-full" />
        </div>
        <div className="flex justify-end">
          <button disabled={saving} className="px-3 py-1 rounded bg-primary text-white">{saving ? 'Saving…' : 'Save'}</button>
        </div>
        {msg && <div className="text-sm text-gray-600">{msg}</div>}
      </form>
    </div>
  );
}
