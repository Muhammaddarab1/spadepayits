// Users management: Admin can create users and assign per-user permissions
import { useEffect, useState } from 'react';
import axios from '../api/axiosInstance.js';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Users
 * Admin-only page to:
 * - Create new users (role fixed to 'User')
 * - Manage per-user permissions via a grouped, module-based editor
 * - Sync users from Microsoft 365
 */
export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'User' });
  const [error, setError] = useState('');
  const [permEdit, setPermEdit] = useState({ open: false, userId: null, map: {} });

  const isAdmin = user?.role === 'Admin';

  const load = async () => {
    try {
      const u = await axios.get('/api/users');
      setUsers(u.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load data');
    }
  };

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault(); setError('');
    try {
      await axios.post('/api/users', { name: form.name, email: form.email, password: form.password, role: form.role });
      setForm({ name: '', email: '', password: '', role: 'User' });
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create user');
    }
  };

  const allPermissionKeys = () => {
    const keys = new Set();
    users.forEach(u => Object.keys(u.permissions || {}).forEach(k => keys.add(k)));
    // ensure core keys are present even if roles list is restricted
    ['tickets.create','tickets.update','tickets.delete','tickets.viewDeleted','tickets.viewAll','reports.generate','users.manage','roles.manage','accounts.delete','members.add'].forEach(k=>keys.add(k));
    return Array.from(keys).sort();
  };

  const openPerms = (u) => {
    const map = { ...(u.permissions || {}) };
    setPermEdit({ open: true, userId: u._id, map });
  };

  const savePerms = async () => {
    try {
      await axios.patch(`/api/users/${permEdit.userId}/permissions`, { permissions: permEdit.map });
      setPermEdit({ open: false, userId: null, map: {} });
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update permissions');
    }
  };

  const closeAccount = async (id) => {
    if (!confirm('Close this account?')) return;
    try {
      await axios.delete(`/api/users/${id}`);
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to close account');
    }
  };

  if (!isAdmin) return <div className="text-sm text-gray-600">Only Admin can manage users.</div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Users</h2>
        <p className="text-sm text-gray-500">Create users as User or Admin, then assign fine-grained permissions.</p>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <MicrosoftSyncPanel onReload={load} />
      <form onSubmit={create} className="bg-white border rounded p-4 grid md:grid-cols-5 gap-2">
        <input className="border rounded px-2 py-1" placeholder="Name" value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} required />
        <input type="email" className="border rounded px-2 py-1" placeholder="Email" value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})} required />
        <input type="password" className="border rounded px-2 py-1" placeholder="Password" value={form.password} onChange={(e)=>setForm({...form, password: e.target.value})} required />
        <select className="border rounded px-2 py-1" value={form.role} onChange={(e)=>setForm({...form, role: e.target.value})}>
          <option>User</option>
          <option>Admin</option>
        </select>
        <button className="px-3 py-1 rounded bg-primary text-white">Create</button>
      </form>
      <div className="bg-white border rounded overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-3 py-2">Name</th>
              <th className="text-left px-3 py-2">Email</th>
              <th className="text-left px-3 py-2">Role</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id} className="border-t">
                <td className="px-3 py-2">{u.name}</td>
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded bg-gray-100 text-xs">{u.role}</span>
                    <button onClick={()=>openPerms(u)} className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">Permissions</button>
                  </div>
                </td>
                <td className="px-3 py-2">{u.deleted ? 'Closed' : 'Active'}</td>
                <td className="px-3 py-2 text-right">
                  {!u.deleted && (
                    <button onClick={()=>closeAccount(u._id)} className="px-3 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100">Close</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TagManager />
      {permEdit.open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded shadow-lg w-full max-width-[700px] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Edit Permissions</div>
              <button onClick={()=>setPermEdit({ open:false, userId:null, map:{} })} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <PermissionGroups
              keys={allPermissionKeys()}
              values={permEdit.map}
              onToggle={(k, v)=>setPermEdit(p=>({ ...p, map: { ...p.map, [k]: v }}))}
            />
            <div className="flex justify-end gap-2">
              <button onClick={()=>setPermEdit({ open:false, userId:null, map:{} })} className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">Cancel</button>
              <button onClick={savePerms} className="px-3 py-1 rounded bg-primary text-white">Save</button>
            </div>
          </div>
        </div>
      )}
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

/**
 * PermissionGroups
 * Renders permissions grouped by module prefix (e.g., 'sales.*', 'tickets.*').
 * Props:
 * - keys: string[] list of permission keys
 * - values: Record<string, boolean> current selection map
 * - onToggle: (key, value) => void to toggle a single permission
 */
function PermissionGroups({ keys, values, onToggle }) {
  const [open, setOpen] = useState({});
  const groups = keys.reduce((acc, k) => {
    const g = k.split('.')[0] || 'general';
    (acc[g] ||= []).push(k);
    return acc;
  }, {});
  const toggleGroup = (g, v) => {
    groups[g].forEach(k => onToggle(k, v));
  };
  return (
    <div className="space-y-3 max-h-[60vh] overflow-auto">
      {Object.keys(groups).sort().map(g => (
        <div key={g} className="border rounded">
          <button
            type="button"
            className="w-full flex items-center justify-between px-3 py-2 text-left"
            onClick={()=>setOpen(o=>({ ...o, [g]: !o[g] }))}
          >
            <span className="font-medium capitalize">{g}</span>
            <span className="text-xs text-gray-500">{open[g] ? 'Hide' : 'Show'}</span>
          </button>
          {open[g] && (
            <div className="px-3 pb-3 grid md:grid-cols-2 gap-2">
              <div className="flex items-center gap-2 mb-1">
                <button type="button" className="text-xs px-2 py-0.5 rounded bg-gray-100" onClick={()=>toggleGroup(g, true)}>Select all</button>
                <button type="button" className="text-xs px-2 py-0.5 rounded bg-gray-100" onClick={()=>toggleGroup(g, false)}>Clear all</button>
              </div>
              {groups[g].sort().map(k => (
                <label key={k} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!values[k]}
                    onChange={(e)=>onToggle(k, e.target.checked)}
                  />
                  <span className="text-sm">{k}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * MicrosoftSyncPanel
 * Admin panel for syncing users from Microsoft 365
 */
function MicrosoftSyncPanel({ onReload }) {
  const [loading, setLoading] = useState(false);
  const [syncStats, setSyncStats] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadStatus = async () => {
    try {
      const res = await axios.get('/api/sync/status');
      setSyncStats(res.data.syncStats);
      if (!res.data.microsoftConfigured) {
        setError(res.data.microsoftMessage);
      }
    } catch (e) {
      setError('Failed to load sync status');
    }
  };

  const handleSync = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await axios.post('/api/sync/users');
      setMessage(`✓ ${res.data.message}`);
      setSyncStats(res.data.summary);
      onReload();
    } catch (e) {
      setError(e.response?.data?.message || 'Sync failed');
    } finally {
      setLoading(false);
    }
  };

  const testEmail = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await axios.get('/api/sync/test-email');
      if (res.data.success) {
        setMessage('✓ Email configuration is working!');
      } else {
        setError('Email test failed: ' + res.data.message);
      }
    } catch (e) {
      setError('Email test failed: ' + e.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold text-blue-900">🔄 Microsoft 365 Integration</div>
          <div className="text-sm text-blue-700">Sync users from your Microsoft 365 tenant and send email notifications</div>
        </div>
      </div>

      {error && <div className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded">{error}</div>}
      {message && <div className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded">{message}</div>}

      {syncStats && (
        <div className="grid md:grid-cols-4 gap-3 text-sm">
          <div className="bg-white rounded p-3 border">
            <div className="text-gray-600">Total Users</div>
            <div className="text-xl font-bold">{syncStats.totalUsers}</div>
          </div>
          <div className="bg-white rounded p-3 border">
            <div className="text-gray-600">Synced from Microsoft</div>
            <div className="text-xl font-bold">{syncStats.syncedUsers}</div>
          </div>
          <div className="bg-white rounded p-3 border">
            <div className="text-gray-600">Not Synced</div>
            <div className="text-xl font-bold">{syncStats.unsyncedUsers}</div>
          </div>
          <div className="bg-white rounded p-3 border">
            <div className="text-gray-600">Sync %</div>
            <div className="text-xl font-bold">{syncStats.syncPercentage}%</div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleSync}
          disabled={loading}
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '⏳ Syncing...' : '📥 Sync All Users from Microsoft'}
        </button>
        <button
          onClick={testEmail}
          disabled={loading}
          className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? '⏳ Testing...' : '✉️ Test Email Configuration'}
        </button>
      </div>

      <div className="text-xs text-blue-600 bg-blue-100 px-3 py-2 rounded">
        💡 <strong>Tip:</strong> Configure environment variables AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET to enable Microsoft 365 sync.
      </div>
    </div>
  );
}
