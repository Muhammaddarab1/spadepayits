import { useEffect, useState } from 'react';
import axios from '../api/axiosInstance.js';
import { useNavigate, useParams } from 'react-router-dom';

export default function SalesEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [users, setUsers] = useState([]);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([axios.get(`/api/sales/${id}`), axios.get('/api/users')]).then(([s,u]) => {
      if (!mounted) return;
      setItem(s.data); setUsers(u.data);
    }).catch((e)=> setError(e.response?.data?.message || 'Failed to load'));
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
          <p className="text-sm text-gray-500">ID: {id}</p>
        </div>
        <button onClick={()=>navigate('/sales')} className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">Back</button>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <form onSubmit={save} className="bg-white border rounded p-4 space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div><label className="block text-xs text-gray-500">Business Name</label><input value={item.businessName} onChange={(e)=>setField('businessName', e.target.value)} className="border rounded px-2 py-1 w-full" required /></div>
          <div><label className="block text-xs text-gray-500">Address</label><input value={item.address} onChange={(e)=>setField('address', e.target.value)} className="border rounded px-2 py-1 w-full" required /></div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div><label className="block text-xs text-gray-500">Owner Name</label><input value={item.ownerName} onChange={(e)=>setField('ownerName', e.target.value)} className="border rounded px-2 py-1 w-full" required /></div>
          <div><label className="block text-xs text-gray-500">Tax File Name</label><input value={item.taxFileName||''} onChange={(e)=>setField('taxFileName', e.target.value)} className="border rounded px-2 py-1 w-full" /></div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div><label className="block text-xs text-gray-500">Contact Person</label><input value={item.contactPersonName} onChange={(e)=>setField('contactPersonName', e.target.value)} className="border rounded px-2 py-1 w-full" required /></div>
          <div><label className="block text-xs text-gray-500">Contact Number</label><input value={item.contactNumber} onChange={(e)=>setField('contactNumber', e.target.value)} className="border rounded px-2 py-1 w-full" required /></div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div><label className="block text-xs text-gray-500">Email</label><input type="email" value={item.email} onChange={(e)=>setField('email', e.target.value)} className="border rounded px-2 py-1 w-full" required /></div>
          <div><label className="block text-xs text-gray-500">EIN or SSN</label><input value={item.einOrSsn} onChange={(e)=>setField('einOrSsn', e.target.value)} className="border rounded px-2 py-1 w-full" required /></div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div><label className="block text-xs text-gray-500">Due Date/Time</label><input type="datetime-local" value={item.dueAt ? item.dueAt.slice(0,16) : ''} onChange={(e)=>setField('dueAt', e.target.value)} className="border rounded px-2 py-1 w-full" required /></div>
          <div>
            <div className="block text-xs text-gray-500 mb-1">Assignees</div>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-auto border rounded p-2">
              {users.map(u => (
                <label key={u._id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={(item.assignees || []).includes(u._id) || (item.assignee?._id === u._id) || (item.assignee === u._id)}
                    onChange={()=>toggleAssignee(u._id)}
                  />
                  <span>{u.name}</span>
                </label>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-1">{(item.assignees || (item.assignee ? [item.assignee] : [])).length} selected</div>
          </div>
        </div>
        <div><label className="block text-xs text-gray-500">Status</label>
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
        <div className="flex justify-end gap-2">
          <button onClick={()=>navigate('/')} type="button" className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">Back</button>
          <button disabled={saving} className="px-3 py-1 rounded bg-primary text-white disabled:opacity-60">{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </form>
    </div>
  );
}
