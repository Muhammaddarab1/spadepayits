import { useEffect, useState } from 'react';
import axios from '../api/axiosInstance.js';
import { useNavigate, useParams } from 'react-router-dom';
import BackButton from '../components/BackButton.jsx';
import MultiSelect from '../components/MultiSelect.jsx';

export default function SalesEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [users, setUsers] = useState([]);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentsList, setCommentsList] = useState([]);
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [s, u] = await Promise.all([
          axios.get(`/api/sales/${id}`),
          axios.get('/api/users'),
        ]);
        if (!mounted) return;
        setItem(s.data);
        setUsers(u.data);
        setCommentsList(s.data.comments || []);
        
        // fetch activity logs for timeline
        try {
          const logs = await axios.get('/api/activityLogs', { params: { salesTicket: id } });
          setTimeline(logs.data || []);
        } catch {}
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load');
      }
    };
    load();
    return () => { mounted = false; };
  }, [id]);

  const setField = (name, value) => setItem(i => ({ ...i, [name]: value }));
  const toggleAssignee = (id) => setItem(i => {
    const current = Array.isArray(i.assignees) && i.assignees.length ? i.assignees : (i.assignee ? [i.assignee?._id || i.assignee] : []);
    const s = new Set(current);
    s.has(id) ? s.delete(id) : s.add(id);
    return { ...i, assignees: Array.from(s) };
  });

  const save = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await axios.patch(`/api/sales/${id}`, {
        businessName: item.businessName, address: item.address, ownerName: item.ownerName, taxFileName: item.taxFileName,
        contactPersonName: item.contactPersonName, contactNumber: item.contactNumber, email: item.email, einOrSsn: item.einOrSsn,
        turnaroundTime: item.turnaroundTime, dueAt: item.dueAt || null, assignees: Array.isArray(item.assignees) && item.assignees.length ? item.assignees : (item.assignee ? [item.assignee?._id || item.assignee] : []), status: item.status, notes: item.notes,
      });
      if (files.length) {
        const fd = new FormData(); for (const f of files) fd.append('files', f);
        await axios.post(`/api/sales/${id}/attachments`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      try { window.dispatchEvent(new Event('sales:changed')); } catch {}
      navigate('/sales');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  if (!item) return <div className="text-gray-500">Loading…</div>;
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
        <h2 className="text-xl font-semibold">Edit Sales Ticket</h2>
        <p className="text-sm text-gray-500">ID: {id}. Fields marked with <span className="text-red-500">*</span> are required.</p>
      </div>
      <BackButton to="/sales" />
    </div>
    {error && <div className="text-sm text-red-600 font-medium bg-red-50 p-2 rounded border border-red-100">{error}</div>}
    <form onSubmit={save} className="bg-white border rounded p-4 space-y-3 shadow-sm">
      <div className="grid md:grid-cols-2 gap-3">
        <div><label className="block text-xs text-gray-500 font-medium">Business Name <span className="text-red-500">*</span></label><input value={item.businessName} onChange={(e)=>setField('businessName', e.target.value)} className="border rounded px-2 py-1 w-full focus:ring-1 focus:ring-primary outline-none" required /></div>
        <div><label className="block text-xs text-gray-500 font-medium">Address <span className="text-red-500">*</span></label><input value={item.address} onChange={(e)=>setField('address', e.target.value)} className="border rounded px-2 py-1 w-full focus:ring-1 focus:ring-primary outline-none" required /></div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div><label className="block text-xs text-gray-500 font-medium">Owner Name <span className="text-red-500">*</span></label><input value={item.ownerName} onChange={(e)=>setField('ownerName', e.target.value)} className="border rounded px-2 py-1 w-full focus:ring-1 focus:ring-primary outline-none" required /></div>
        <div><label className="block text-xs text-gray-500 font-medium">Tax File Name</label><input value={item.taxFileName||''} onChange={(e)=>setField('taxFileName', e.target.value)} className="border rounded px-2 py-1 w-full focus:ring-1 focus:ring-primary outline-none" /></div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div><label className="block text-xs text-gray-500 font-medium">Contact Person <span className="text-red-500">*</span></label><input value={item.contactPersonName} onChange={(e)=>setField('contactPersonName', e.target.value)} className="border rounded px-2 py-1 w-full focus:ring-1 focus:ring-primary outline-none" required /></div>
        <div><label className="block text-xs text-gray-500 font-medium">Contact Number <span className="text-red-500">*</span></label><input value={item.contactNumber} onChange={(e)=>setField('contactNumber', e.target.value)} className="border rounded px-2 py-1 w-full focus:ring-1 focus:ring-primary outline-none" required /></div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div><label className="block text-xs text-gray-500 font-medium">Email <span className="text-red-500">*</span></label><input type="email" value={item.email} onChange={(e)=>setField('email', e.target.value)} className="border rounded px-2 py-1 w-full focus:ring-1 focus:ring-primary outline-none" required /></div>
        <div><label className="block text-xs text-gray-500 font-medium">EIN or SSN <span className="text-red-500">*</span></label><input value={item.einOrSsn} onChange={(e)=>setField('einOrSsn', e.target.value)} className="border rounded px-2 py-1 w-full focus:ring-1 focus:ring-primary outline-none" required /></div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 font-medium">Due Date <span className="text-red-500">*</span></label>
          <input type="date" value={item.dueAt ? item.dueAt.slice(0,10) : ''} onChange={(e)=>setField('dueAt', e.target.value)} className="border rounded px-2 py-1 w-full focus:ring-1 focus:ring-primary outline-none" required />
        </div>
        <div>
          <label className="block text-xs text-gray-500 font-medium">Assignees <span className="text-red-500">*</span></label>
          <MultiSelect
            options={users.map(u => ({ value: u._id, label: u.name }))}
            value={(item.assignees || []).map(a=>a._id || a)}
            onChange={(vals)=>setField('assignees', vals)}
            placeholder="Select assignees"
            showFilter={false}
          />
          <div className="text-xs text-gray-500 mt-1">{(item.assignees || (item.assignee ? [item.assignee] : [])).length} selected</div>
        </div>
      </div>
      <div><label className="block text-xs text-gray-500 font-medium">Status <span className="text-red-500">*</span></label>
          <select value={item.status} onChange={(e)=>setField('status', e.target.value)} className="border rounded px-2 py-1 w-full">
            <option>Open</option><option>In Progress</option><option>Solved</option>
          </select>
        </div>
        <div><label className="block text-xs text-gray-500">Notes</label><textarea value={item.notes||''} onChange={(e)=>setField('notes', e.target.value)} className="border rounded px-2 py-1 w-full" rows="3" /></div>
        <div><label className="block text-xs text-gray-500">Add Attachments</label><input type="file" multiple onChange={(e)=>setFiles(Array.from(e.target.files))} className="border rounded px-2 py-1 w-full" /></div>
        {Array.isArray(item.attachments) && item.attachments.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 mb-1">Existing Attachments</div>
            <ul className="text-sm space-y-1">
              {item.attachments.map((a,i)=>(
                <li key={i}><a className="text-blue-600 hover:underline" href={a.url} target="_blank" rel="noreferrer">{a.filename}</a></li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <div className="text-xs text-gray-500 mb-1">Comments</div>
          <div className="space-y-3">
            {commentsList.map((c, i) => (
              <div key={i} className="border rounded p-2">
                <div className="text-sm">{c.text}</div>
                <div className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</div>
              </div>
            ))}
            <div className="mt-2">
              <textarea value={commentText} onChange={(e)=>setCommentText(e.target.value)} className="w-full border rounded px-2 py-1" rows={3} placeholder="Add a comment..." />
              <div className="flex justify-end mt-2">
                <button type="button" onClick={async ()=>{
                  if (!commentText.trim()) return;
                  try {
                    const res = await axios.post(`/api/sales/${id}/comments`, { text: commentText });
                    setCommentsList(l => [...l, res.data]);
                    setCommentText('');
                  } catch (e) {
                    setError(e.response?.data?.message || 'Failed to post comment');
                  }
                }} className="px-3 py-1 rounded bg-primary text-white">Post Comment</button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-500 mb-1">Timeline</div>
          <div className="space-y-2 text-sm text-gray-600">
            {timeline.length === 0 ? (
              <div className="text-xs text-gray-400 italic">No activity logs yet.</div>
            ) : (
              timeline.map((l, i) => (
                <div key={i} className="border rounded p-2">
                  <div className="font-medium">{l.action}</div>
                  <div className="text-xs">{l.details}</div>
                  <div className="text-xs text-gray-400">{new Date(l.timestamp).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={()=>navigate('/')} type="button" className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">Back</button>
          <button disabled={saving} className="px-3 py-1 rounded bg-primary text-white disabled:opacity-60">{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </form>
    </div>
  );
}
