// TicketForm modal for creating tickets
import { useEffect, useState } from 'react';
import axios from '../api/axiosInstance.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function TicketForm({ open, onClose, onCreated }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [tagsCatalog, setTagsCatalog] = useState([]);
  const [form, setForm] = useState({
    subject: '',
    description: '',
    assignee: '',
    tags: [],
    priority: 'Medium',
    status: 'Open',
    mid: '',
    dba: '',
    contactNumber: '',
    contactPerson: '',
    notes: '',
  });
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    Promise.all([
      axios.get('/api/users'),
      axios.get('/api/tags'),
    ])
      .then(([u, t]) => {
        if (!mounted) return;
        setUsers(u.data);
        setTagsCatalog(t.data);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [open]);

  useEffect(() => {
    if (users.length && !form.assignee) setForm(f => ({ ...f, assignee: user?.id || users[0]._id }));
  }, [users, user, form.assignee]);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const toggleTag = (name) => setForm(f => {
    const next = new Set(f.tags);
    if (next.has(name)) next.delete(name); else next.add(name);
    return { ...f, tags: Array.from(next) };
  });

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        subject: form.subject.trim(),
        description: form.description.trim(),
        assignee: form.assignee,
        tags: form.tags,
        priority: form.priority,
        status: form.status,
        mid: form.mid.trim(),
        dba: form.dba.trim(),
        contactNumber: form.contactNumber.trim(),
        contactPerson: form.contactPerson.trim(),
        notes: form.notes.trim(),
      };
      if (!payload.subject || !payload.description || !payload.assignee || !payload.tags.length) {
        setError('All fields are required'); setSubmitting(false); return;
      }
      const created = await axios.post('/api/tickets', payload);
      if (files.length) {
        const fd = new FormData();
        for (const f of files) fd.append('files', f);
        await axios.post(`/api/tickets/${created.data._id}/attachments`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      onCreated?.();
      onClose?.();
      setForm({ subject: '', description: '', assignee: '', tags: [], priority: 'Medium', status: 'Open', mid: '', dba: '', contactNumber: '', contactPerson: '', notes: '' });
      setFiles([]);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded shadow-lg w-full max-w-2xl">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Create Ticket</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <form onSubmit={submit} className="p-4 space-y-3">
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500">Subject</label>
              <input name="subject" value={form.subject} onChange={handle} className="border rounded px-2 py-1 w-full" required />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Assignee</label>
              <select name="assignee" value={form.assignee} onChange={handle} className="border rounded px-2 py-1 w-full" required>
                <option value="">Select</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
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
            <button type="button" onClick={onClose} className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">Cancel</button>
            <button disabled={submitting} className="px-3 py-1 rounded bg-primary text-white hover:opacity-90 disabled:opacity-60">
              {submitting ? 'Creating…' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
