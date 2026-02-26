// Roles management: Admin can create roles and toggle permissions, including reports.generate
import { useEffect, useState } from 'react';
import axios from '../api/axiosInstance.js';
import { useAuth } from '../context/AuthContext.jsx';

const ALL_PERMS = [
  'tickets.create',
  'tickets.update',
  'tickets.delete',
  'tickets.viewDeleted',
  'tickets.viewAll',
  'reports.generate',
  'tags.manage',
  'users.manage',
  'roles.manage',
  'accounts.delete',
  'members.add',
];

export default function Roles() {
  const { user } = useAuth();
  const [roles, setRoles] = useState([]);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'Admin';

  const load = async () => {
    try {
      const res = await axios.get('/api/roles');
      setRoles(res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load roles');
    }
  };

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/roles', { name, description: desc, permissions: {} });
      setName(''); setDesc('');
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create role');
    }
  };

  const togglePerm = async (role, perm) => {
    try {
      const permissions = { ...(role.permissions || {}) };
      permissions[perm] = !permissions[perm];
      await axios.patch(`/api/roles/${role._id}`, { permissions });
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update permissions');
    }
  };

  if (!isAdmin) return <div className="text-sm text-gray-600">Only Admin can manage roles.</div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Roles</h2>
        <p className="text-sm text-gray-500">Create and manage role permissions. Grant “reports.generate” to delegate reporting.</p>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <form onSubmit={create} className="bg-white border rounded p-4 flex gap-3">
        <input value={name} onChange={(e)=>setName(e.target.value)} className="border rounded px-2 py-1" placeholder="Role name" required />
        <input value={desc} onChange={(e)=>setDesc(e.target.value)} className="border rounded px-2 py-1 flex-1" placeholder="Description" />
        <button className="px-3 py-1 rounded bg-primary text-white">Create</button>
      </form>
      <div className="space-y-4">
        {roles.map(r => (
          <div key={r._id} className="bg-white border rounded p-4">
            <div className="font-semibold">{r.name}</div>
            <div className="text-sm text-gray-500">{r.description}</div>
            <div className="mt-3 grid md:grid-cols-3 gap-2">
              {ALL_PERMS.map(p => (
                <label key={p} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(r.permissions?.[p])}
                    onChange={()=>togglePerm(r, p)}
                  />
                  <span>{p}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <TagManager />
    </div>
  );
}

function TagManager() {
  const [tags, setTags] = useState([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const res = await axios.get('/api/tags/all');
      setTags(res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load tags');
    }
  };
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/tags', { name: name.trim() });
      setName(''); load();
    } catch (e) { setError(e.response?.data?.message || 'Failed to add tag'); }
  };
  const toggle = async (t) => {
    try {
      await axios.patch(`/api/tags/${t._id}`, { active: !t.active });
      load();
    } catch (e) { setError(e.response?.data?.message || 'Failed to update tag'); }
  };
  const remove = async (t) => {
    if (!confirm('Delete this tag?')) return;
    try {
      await axios.delete(`/api/tags/${t._id}`); load();
    } catch (e) { setError(e.response?.data?.message || 'Failed to delete tag'); }
  };

  return (
    <div className="bg-white border rounded p-4 space-y-3">
      <div className="font-semibold">Tags</div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <form onSubmit={add} className="flex gap-2">
        <input value={name} onChange={(e)=>setName(e.target.value)} className="border rounded px-2 py-1" placeholder="New tag name" required />
        <button className="px-3 py-1 rounded bg-primary text-white">Add</button>
      </form>
      <div className="grid md:grid-cols-3 gap-2">
        {tags.map(t => (
          <div key={t._id} className="border rounded p-2 flex items-center justify-between">
            <div className="text-sm">{t.name} {!t.active && <span className="text-xs text-gray-500">(inactive)</span>}</div>
            <div className="flex gap-2">
              <button onClick={()=>toggle(t)} className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-xs">
                {t.active ? 'Deactivate' : 'Activate'}
              </button>
              <button onClick={()=>remove(t)} className="px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 text-xs">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
