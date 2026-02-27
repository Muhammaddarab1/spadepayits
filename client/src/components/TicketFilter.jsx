// TicketFilter provides UI controls to filter tickets by assignee, status, priority, and tags
import { useEffect, useState } from 'react';
import axios from '../api/axiosInstance.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function TicketFilter({ onChange }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ assignee: '', assignees: [], status: '', priority: '', tags: '' });
  const canViewAll = user?.role === 'Admin' || user?.permissions?.['tickets.viewAll'];

  useEffect(() => {
    let mounted = true;
    if (canViewAll) {
      axios.get('/api/users')
        .then(res => { if (mounted) setUsers(res.data); })
        .catch(() => {});
    }
    return () => { mounted = false; };
  }, [canViewAll]);

  useEffect(() => {
    onChange(filters);
  }, [filters, onChange]);

  const handle = (e) => setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));
  const toggleAssignee = (id) => setFilters(f => {
    const s = new Set(f.assignees);
    s.has(id) ? s.delete(id) : s.add(id);
    return { ...f, assignees: Array.from(s) };
  });

  return (
    <div className="bg-white border rounded p-4 flex flex-wrap gap-3 items-end">
      {canViewAll && (
        <>
          <div>
            <label className="block text-xs text-gray-500">Assignee</label>
            <select name="assignee" onChange={handle} value={filters.assignee} className="border rounded px-2 py-1">
              <option value="">All</option>
              {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <div className="block text-xs text-gray-500 mb-1">Assignees (multi)</div>
            <div className="grid grid-cols-2 gap-2 max-h-24 overflow-auto border rounded p-2 min-w-[220px]">
              {users.map(u => (
                <label key={u._id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={filters.assignees.includes(u._id)} onChange={() => toggleAssignee(u._id)} />
                  <span>{u.name}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
      <div>
        <label className="block text-xs text-gray-500">Status</label>
        <select name="status" onChange={handle} value={filters.status} className="border rounded px-2 py-1">
          <option value="">All</option>
          <option>Open</option>
          <option>In Progress</option>
          <option>Solved</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500">Priority</label>
        <select name="priority" onChange={handle} value={filters.priority} className="border rounded px-2 py-1">
          <option value="">All</option>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
      </div>
      <div className="flex-1 min-w-[200px]">
        <label className="block text-xs text-gray-500">Tags (comma separated)</label>
        <input name="tags" onChange={handle} value={filters.tags} className="border rounded px-2 py-1 w-full" placeholder="bug, onboarding" />
      </div>
      <button onClick={() => setFilters({ assignee: '', status: '', priority: '', tags: '' })}
        className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">Reset</button>
    </div>
  );
}
