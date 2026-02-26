import { useEffect, useState } from 'react';
import axios from '../api/axiosInstance.js';
import { useNavigate } from 'react-router-dom';

export default function SalesNew() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    businessName: '',
    address: '',
    ownerName: '',
    taxFileName: '',
    contactPersonName: '',
    contactNumber: '',
    email: '',
    einOrSsn: '',
    dueAt: '',
    assignees: [],
    notes: '',
  });
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    axios.get('/api/users').then(r => {
      if (!mounted) return;
      setUsers(r.data); setForm(f => ({ ...f, assignees: r.data[0]?._id ? [r.data[0]._id] : [] }));
    }).catch(()=>{});
    return () => { mounted = false; };
  }, []);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const toggleAssignee = (id) => setForm(f => {
    const s = new Set(f.assignees); s.has(id) ? s.delete(id) : s.add(id); return { ...f, assignees: Array.from(s) };
  });

  const submit = async (e) => {
    e.preventDefault(); setError(''); setSubmitting(true);
    try {
      const created = await axios.post('/api/sales', form);
      if (files.length) {
        const fd = new FormData(); for (const f of files) fd.append('files', f);
        await axios.post(`/api/sales/${created.data._id}/attachments`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      try { window.dispatchEvent(new Event('sales:changed')); } catch {}
      navigate(`/sales/${created.data._id}`);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create sales ticket');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h2 className="text-xl font-semibold">New Sales Ticket</h2>
        <p className="text-sm text-gray-500">Capture business and contact details.</p>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <form onSubmit={submit} className="bg-white border rounded p-4 space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div><label className="block text-xs text-gray-500">Business Name</label><input name="businessName" value={form.businessName} onChange={handle} className="border rounded px-2 py-1 w-full" required /></div>
          <div><label className="block text-xs text-gray-500">Address</label><input name="address" value={form.address} onChange={handle} className="border rounded px-2 py-1 w-full" required /></div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div><label className="block text-xs text-gray-500">Owner Name</label><input name="ownerName" value={form.ownerName} onChange={handle} className="border rounded px-2 py-1 w-full" required /></div>
          <div><label className="block text-xs text-gray-500">Tax File Name</label><input name="taxFileName" value={form.taxFileName} onChange={handle} className="border rounded px-2 py-1 w-full" /></div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div><label className="block text-xs text-gray-500">Contact Person</label><input name="contactPersonName" value={form.contactPersonName} onChange={handle} className="border rounded px-2 py-1 w-full" required /></div>
          <div><label className="block text-xs text-gray-500">Contact Number</label><input name="contactNumber" value={form.contactNumber} onChange={handle} className="border rounded px-2 py-1 w-full" required /></div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div><label className="block text-xs text-gray-500">Email</label><input type="email" name="email" value={form.email} onChange={handle} className="border rounded px-2 py-1 w-full" required /></div>
          <div><label className="block text-xs text-gray-500">EIN or SSN</label><input name="einOrSsn" value={form.einOrSsn} onChange={handle} className="border rounded px-2 py-1 w-full" required /></div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500">Due Date/Time</label>
            <input type="datetime-local" name="dueAt" value={form.dueAt} onChange={handle} className="border rounded px-2 py-1 w-full" required />
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
        <div><label className="block text-xs text-gray-500">Notes</label><textarea name="notes" value={form.notes} onChange={handle} className="border rounded px-2 py-1 w-full" rows="3" /></div>
        <div><label className="block text-xs text-gray-500">Attachments</label><input type="file" multiple onChange={(e)=>setFiles(Array.from(e.target.files))} className="border rounded px-2 py-1 w-full" /></div>
        <div className="flex justify-end gap-2">
          <button onClick={()=>navigate('/sales')} type="button" className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">Cancel</button>
          <button disabled={submitting} className="px-3 py-1 rounded bg-primary text-white disabled:opacity-60">{submitting ? 'Creating…' : 'Create Sales Ticket'}</button>
        </div>
      </form>
    </div>
  );
}
