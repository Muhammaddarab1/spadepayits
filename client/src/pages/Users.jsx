// Users management: Admin can create users and assign per-user permissions
import { useEffect, useState } from 'react';
import axios from '../api/axiosInstance.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'User' });
  const [error, setError] = useState('');
  const [permEdit, setPermEdit] = useState({ open: false, userId: null, map: {} });

  const isAdmin = user?.role === 'Admin';

  const load = async () => {
    try {
      const [u, r] = await Promise.all([axios.get('/api/users'), axios.get('/api/roles')]);
      setUsers(u.data);
      setRoles(r.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load data');
    }
  };

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault(); setError('');
    try {
      await axios.post('/api/users', form);
      setForm({ name: '', email: '', password: '', role: 'User' });
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create user');
    }
  };

  const changeRole = async (id, role) => {
    try {
      await axios.patch(`/api/users/${id}/role`, { role });
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update role');
    }
  };

  const allPermissionKeys = () => {
    const keys = new Set();
    roles.forEach(r => Object.keys(r.permissions || {}).forEach(k => keys.add(k)));
    users.forEach(u => Object.keys(u.permissions || {}).forEach(k => keys.add(k)));
    // ensure core keys are present even if roles list is restricted
    ['tickets.create','tickets.update','tickets.delete','tickets.viewDeleted','tickets.viewAll','reports.generate','attendance.record','attendance.report','attendance.requestLeave','attendance.requestCorrection','attendance.approveRequests','users.manage','roles.manage','accounts.delete','members.add'].forEach(k=>keys.add(k));
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
        <p className="text-sm text-gray-500">Create users, assign permissions, optionally set roles.</p>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <form onSubmit={create} className="bg-white border rounded p-4 grid md:grid-cols-5 gap-2">
        <input className="border rounded px-2 py-1" placeholder="Name" value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} required />
        <input type="email" className="border rounded px-2 py-1" placeholder="Email" value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})} required />
        <input type="password" className="border rounded px-2 py-1" placeholder="Password" value={form.password} onChange={(e)=>setForm({...form, password: e.target.value})} required />
        <select className="border rounded px-2 py-1" value={form.role} onChange={(e)=>setForm({...form, role: e.target.value})}>
          <option value="User">User</option>
          <option value="Admin">Admin</option>
          {roles.map(r => <option key={r._id} value={r.name}>{r.name}</option>)}
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
                    <select value={u.role} onChange={(e)=>changeRole(u._id, e.target.value)} className="border rounded px-2 py-1">
                      <option value="User">User</option>
                      <option value="Admin">Admin</option>
                      {roles.map(r => <option key={r._id} value={r.name}>{r.name}</option>)}
                    </select>
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
      {permEdit.open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded shadow-lg w-full max-width-[700px] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Edit Permissions</div>
              <button onClick={()=>setPermEdit({ open:false, userId:null, map:{} })} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="grid md:grid-cols-2 gap-2 max-h-[60vh] overflow-auto">
              {allPermissionKeys().map(k=>(
                <label key={k} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!permEdit.map[k]}
                    onChange={(e)=>setPermEdit(p=>({ ...p, map: { ...p.map, [k]: e.target.checked }}))}
                  />
                  <span className="text-sm">{k}</span>
                </label>
              ))}
            </div>
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
