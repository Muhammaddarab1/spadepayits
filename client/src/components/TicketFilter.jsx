// TicketFilter provides UI controls to filter tickets by assignee, status, priority, and tags
import { useEffect, useMemo, useState } from 'react';
import axios from '../api/axiosInstance.js';
import { useAuth } from '../context/AuthContext.jsx';
import MultiSelect from './MultiSelect.jsx';

export default function TicketFilter({ onChange }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [tagsCatalog, setTagsCatalog] = useState([]);
  const [filters, setFilters] = useState({ search: '', assignee: '', assignees: [], status: '', priority: '', tags: [] });
  const [assigneeFilterText, setAssigneeFilterText] = useState('');
  const canViewAll = user?.role === 'Admin' || user?.permissions?.['tickets.viewAll'];

  useEffect(() => {
    let mounted = true;
    if (canViewAll) {
      axios.get('/api/users')
        .then(res => { if (mounted) setUsers(res.data); })
        .catch(() => {});
    }
    axios.get('/api/tags')
      .then(r => { if (mounted) setTagsCatalog(r.data); })
      .catch(() => {});
    return () => { mounted = false; };
  }, [canViewAll]);

  useEffect(() => {
    onChange(filters);
  }, [filters, onChange]);

  const handle = (e) => {
    const { name, value, multiple, options } = e.target;
    if (multiple) {
      const vals = Array.from(options).filter(o=>o.selected).map(o=>o.value);
      setFilters(f => ({ ...f, [name]: vals }));
    } else {
      setFilters(f => ({ ...f, [name]: value }));
    }
  };
  const selectAllAssignees = () => {
    const list = filteredUsers;
    if (filters.assignees.length === list.length) {
      setFilters(f => ({ ...f, assignees: [] }));
    } else {
      setFilters(f => ({ ...f, assignees: list.map(u=>u._id) }));
    }
  };

  const filteredUsers = useMemo(() => users.filter(u => u.name.toLowerCase().includes(assigneeFilterText.toLowerCase())), [users, assigneeFilterText]);
  const tagOptions = useMemo(() => tagsCatalog.map(t => ({ value: t.name, label: t.name })), [tagsCatalog]);

  return (
    <div className="bg-white border rounded p-4 grid grid-cols-5 gap-5 items-end">
      <div className="col-span-1">
        <label className="block text-xs text-gray-500">Search</label>
        <input name="search" value={filters.search} onChange={handle} className="border rounded px-2 h-10 w-full" placeholder="Subject or ticket #" />
      </div>
      {canViewAll && (
          <div className="col-span-1">
            <label className="block text-xs text-gray-500">Assignees</label>
            <MultiSelect
              options={filteredUsers.map(u => ({ value: u._id, label: u.name }))}
              value={filters.assignees}
              onChange={(vals)=>setFilters(f=>({ ...f, assignees: vals }))}
              placeholder="Select assignees"
              showFilter={false}
            />
          </div>
      )}
      <div className="col-span-1">
        <label className="block text-xs text-gray-500">Status</label>
        <select name="status" onChange={handle} value={filters.status} className="border rounded px-2 h-10 w-full">
          <option value="">All</option>
          <option>Open</option>
          <option>In Progress</option>
          <option>Solved</option>
        </select>
      </div>
      <div className="col-span-1">
        <label className="block text-xs text-gray-500">Priority</label>
        <select name="priority" onChange={handle} value={filters.priority} className="border rounded px-2 h-10 w-full">
          <option value="">All</option>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
      </div>
      <div className="col-span-1">
        <label className="block text-xs text-gray-500">Tags</label>
        <MultiSelect
          options={tagOptions}
          value={filters.tags}
          onChange={(vals)=>setFilters(f=>({ ...f, tags: vals }))}
          placeholder="Select tags"
        />
      </div>
    </div>
  );
}
