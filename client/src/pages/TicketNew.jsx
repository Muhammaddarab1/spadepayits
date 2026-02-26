import { useEffect, useState } from 'react';
import axios from '../api/axiosInstance.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function TicketNew() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [tagsCatalog, setTagsCatalog] = useState([]);
  const [form, setForm] = useState({
    subject: '',
    description: '',
    assignees: [],
    tags: [],
    priority: 'Medium',
    status: 'Open',
    dueAt: '',
    mid: '',
    dba: '',
    contactNumber: '',
    contactPerson: '',
    notes: '',
  });
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    Promise.all([axios.get('/api/users'), axios.get('/api/tags')]).then(([u, t]) => {
      if (!mounted) return;
      setUsers(u.data); setTagsCatalog(t.data);
      const me = user?.id || u.data[0]?._id || '';
      setForm(f => ({ ...f, assignees: me ? [me] : [] }));
    }).catch(() => {});
    return () => { mounted = false; };
  }, [user]);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const toggleTag = (name) => setForm(f => {
    const s = new Set(f.tags); s.has(name) ? s.delete(name) : s.add(name); return { ...f, tags: Array.from(s) };
  });
  const toggleAssignee = (id) => setForm(f => {
    const s = new Set(f.assignees); s.has(id) ? s.delete(id) : s.add(id); return { ...f, assignees: Array.from(s) };
  });

  const submit = async (e) => {
    e.preventDefault(); setError(''); setSubmitting(true);
    try {
      const payload = {
        ...form,
        subject: form.subject.trim(),
        description: form.description.trim(),
        mid: form.mid.trim(),
        dba: form.dba.trim(),
        contactNumber: form.contactNumber.trim(),
        contactPerson: form.contactPerson.trim(),
        notes: form.notes.trim(),
        dueAt: form.dueAt || null,
      };
      if (!payload.subject || !payload.description || payload.assignees.length === 0 || !payload.tags.length) {
        setError('All required fields must be filled'); setSubmitting(false); return;
      }
      const created = await axios.post('/api/tickets', payload);
      if (files.length) {
        const fd = new FormData(); for (const f of files) fd.append('files', f);
        await axios.post(`/api/tickets/${created.data._id}/attachments`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      navigate(`/tickets/${created.data._id}`);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h2 className="text-xl font-semibold">New Ticket</h2>
        <p className="text-sm text-gray-500">Provide details; you can edit later.</p>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <form onSubmit={submit} className="bg-white border rounded p-4 space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500">Subject</label>
            <input name="subject" value={form.subject} onChange={handle} className="border rounded px-2 py-1 w-full" required />
          </div>
          <div>
            <div className="block text-xs text-gray-500 mb-1">Assignees</div>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-auto border rounded p-2">
              {users.map(u => (
                <label key={u._id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.assignees.includes(u._id)} onChange={()=>toggleAssignee(u._id)} />
                  <span>{u.name}</span>
                </label>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-1">{form.assignees.length} selected</div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500">MID</label>
            <input name="mid" value={form.mid} onChange={handle} className="border rounded px-2 py-1 w-full" />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Business Name (DBA)</label>
            <input name="dba" value={form.dba} onChange={handle} className="border rounded px-2 py-1 w-full" />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500">Contact Number</label>
            <input name="contactNumber" value={form.contactNumber} onChange={handle} className="border rounded px-2 py-1 w-full" />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Contact Person</label>
            <input name="contactPerson" value={form.contactPerson} onChange={handle} className="border rounded px-2 py-1 w-full" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500">Description</label>
          <textarea name="description" value={form.description} onChange={handle} className="border rounded px-2 py-1 w-full" rows="4" required />
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <div className="block text-xs text-gray-500 mb-1">Tags</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {tagsCatalog.map(t => (
                <label key={t._id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.tags.includes(t.name)} onChange={()=>toggleTag(t.name)} />
                  <span>{t.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500">Due Date/Time</label>
            <input type="datetime-local" name="dueAt" value={form.dueAt} onChange={handle} className="border rounded px-2 py-1 w-full" />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Priority</label>
            <select name="priority" value={form.priority} onChange={handle} className="border rounded px-2 py-1 w-full" required>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500">Status</label>
            <select name="status" value={form.status} onChange={handle} className="border rounded px-2 py-1 w-full" required>
              <option>Open</option>
              <option>In Progress</option>
              <option>Solved</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500">Notes</label>
          <textarea name="notes" value={form.notes} onChange={handle} className="border rounded px-2 py-1 w-full" rows="3" />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Attachments</label>
          <input type="file" multiple onChange={(e)=>setFiles(Array.from(e.target.files))} className="border rounded px-2 py-1 w-full" />
          <div className="text-xs text-gray-500 mt-1">Up to 5 files</div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={()=>navigate('/troubleshooting')} type="button" className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">Cancel</button>
          <button disabled={submitting} className="px-3 py-1 rounded bg-primary text-white hover:opacity-90 disabled:opacity-60">
            {submitting ? 'Creating…' : 'Create Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
}
