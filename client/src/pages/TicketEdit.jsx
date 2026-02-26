import { useEffect, useState } from 'react';
import axios from '../api/axiosInstance.js';
import { useParams, useNavigate } from 'react-router-dom';

export default function TicketEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [users, setUsers] = useState([]);
  const [tagsCatalog, setTagsCatalog] = useState([]);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [t, u, g] = await Promise.all([
          axios.get(`/api/tickets/${id}`),
          axios.get('/api/users'),
          axios.get('/api/tags'),
        ]);
        if (!mounted) return;
        setTicket(t.data);
        setUsers(u.data);
        setTagsCatalog(g.data);
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load ticket');
      }
    };
    load(); return () => { mounted = false; };
  }, [id]);

  const setField = (name, value) => setTicket(t => ({ ...t, [name]: value }));
  const toggleTag = (name) => setTicket(t => {
    const s = new Set(t.tags || []); s.has(name) ? s.delete(name) : s.add(name); return { ...t, tags: Array.from(s) };
  });
  const toggleAssignee = (uid) => setTicket(t => {
    const current = Array.isArray(t.assignees) && t.assignees.length ? t.assignees : (t.assignee ? [t.assignee?._id || t.assignee] : []);
    const s = new Set(current);
    s.has(uid) ? s.delete(uid) : s.add(uid);
    return { ...t, assignees: Array.from(s) };
  });

  const save = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await axios.put(`/api/tickets/${id}`, {
        subject: ticket.subject, description: ticket.description,
        assignees: Array.isArray(ticket.assignees) && ticket.assignees.length ? ticket.assignees : (ticket.assignee ? [ticket.assignee?._id || ticket.assignee] : []),
        tags: ticket.tags, priority: ticket.priority, status: ticket.status, dueAt: ticket.dueAt || null,
        mid: ticket.mid, dba: ticket.dba, contactNumber: ticket.contactNumber, contactPerson: ticket.contactPerson, notes: ticket.notes,
      });
      if (files.length) {
        const fd = new FormData(); for (const f of files) fd.append('files', f);
        await axios.post(`/api/tickets/${id}/attachments`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      navigate('/troubleshooting');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save ticket');
    } finally {
      setSaving(false);
    }
  };

  if (!ticket) return <div className="text-gray-500">Loading…</div>;
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Edit Ticket</h2>
          <p className="text-sm text-gray-500">Ticket ID: {id}</p>
        </div>
        <button onClick={()=>navigate('/troubleshooting')} className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">Back</button>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <form onSubmit={save} className="bg-white border rounded p-4 space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500">Subject</label>
            <input value={ticket.subject} onChange={(e)=>setField('subject', e.target.value)} className="border rounded px-2 py-1 w-full" required />
          </div>
          <div>
            <div className="block text-xs text-gray-500 mb-1">Assignees</div>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-auto border rounded p-2">
              {users.map(u => (
                <label key={u._id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={(ticket.assignees || []).includes(u._id) || (ticket.assignee?._id === u._id) || (ticket.assignee === u._id)}
                    onChange={()=>toggleAssignee(u._id)}
                  />
                  <span>{u.name}</span>
                </label>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-1">{(ticket.assignees || (ticket.assignee ? [ticket.assignee] : [])).length} selected</div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div><label className="block text-xs text-gray-500">MID</label><input value={ticket.mid||''} onChange={(e)=>setField('mid', e.target.value)} className="border rounded px-2 py-1 w-full" /></div>
          <div><label className="block text-xs text-gray-500">Business Name (DBA)</label><input value={ticket.dba||''} onChange={(e)=>setField('dba', e.target.value)} className="border rounded px-2 py-1 w-full" /></div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div><label className="block text-xs text-gray-500">Contact Number</label><input value={ticket.contactNumber||''} onChange={(e)=>setField('contactNumber', e.target.value)} className="border rounded px-2 py-1 w-full" /></div>
          <div><label className="block text-xs text-gray-500">Contact Person</label><input value={ticket.contactPerson||''} onChange={(e)=>setField('contactPerson', e.target.value)} className="border rounded px-2 py-1 w-full" /></div>
        </div>
        <div>
          <label className="block text-xs text-gray-500">Description</label>
          <textarea value={ticket.description} onChange={(e)=>setField('description', e.target.value)} className="border rounded px-2 py-1 w-full" rows="4" required />
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <div className="block text-xs text-gray-500 mb-1">Tags</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {tagsCatalog.map(t => (
                <label key={t._id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={ticket.tags?.includes(t.name)} onChange={()=>toggleTag(t.name)} />
                  <span>{t.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500">Due Date/Time</label>
            <input type="datetime-local" value={ticket.dueAt ? ticket.dueAt.slice(0,16) : ''} onChange={(e)=>setField('dueAt', e.target.value)} className="border rounded px-2 py-1 w-full" />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Priority</label>
            <select value={ticket.priority} onChange={(e)=>setField('priority', e.target.value)} className="border rounded px-2 py-1 w-full" required>
              <option>Low</option><option>Medium</option><option>High</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500">Status</label>
            <select value={ticket.status} onChange={(e)=>setField('status', e.target.value)} className="border rounded px-2 py-1 w-full" required>
              <option>Open</option><option>In Progress</option><option>Solved</option>
            </select>
          </div>
        </div>
        <div><label className="block text-xs text-gray-500">Notes</label><textarea value={ticket.notes||''} onChange={(e)=>setField('notes', e.target.value)} className="border rounded px-2 py-1 w-full" rows="3" /></div>
        <div>
          <label className="block text-xs text-gray-500">Add Attachments</label>
          <input type="file" multiple onChange={(e)=>setFiles(Array.from(e.target.files))} className="border rounded px-2 py-1 w-full" />
        </div>
        {Array.isArray(ticket.attachments) && ticket.attachments.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 mb-1">Existing Attachments</div>
            <ul className="text-sm space-y-1">
              {ticket.attachments.map((a,i)=>(
                <li key={i}><a className="text-blue-600 hover:underline" href={a.url} target="_blank" rel="noreferrer">{a.filename}</a></li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={()=>navigate('/')} type="button" className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">Back</button>
          <button disabled={saving} className="px-3 py-1 rounded bg-primary text-white disabled:opacity-60">{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </form>
    </div>
  );
}
