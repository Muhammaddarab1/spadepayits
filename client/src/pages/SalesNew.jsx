import { useEffect, useState } from 'react';
import axios from '../api/axiosInstance.js';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton.jsx';
import MultiSelect from '../components/MultiSelect.jsx';

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
      // Add turnaroundTime fallback if not provided by form
      const payload = { 
        ...form, 
        turnaroundTime: form.turnaroundTime || '24h' 
      };
      const created = await axios.post('/api/sales', payload);
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
        <p className="text-sm text-gray-500">Capture business and contact details. Fields marked with <span className="text-red-500">*</span> are required.</p>
      </div>
      {error && <div className="text-sm text-red-600 font-medium bg-red-50 p-2 rounded border border-red-100">{error}</div>}
      <form onSubmit={submit} className="bg-white border rounded p-4 space-y-3 shadow-sm">
        <div className="grid md:grid-cols-2 gap-3">
          <div><label className="block text-xs text-gray-500 font-medium">Business Name <span className="text-red-500">*</span></label><input name="businessName" value={form.businessName} onChange={handle} className="border rounded px-2 py-1 w-full focus:ring-1 focus:ring-primary outline-none" required /></div>
          <div><label className="block text-xs text-gray-500 font-medium">Address <span className="text-red-500">*</span></label><input name="address" value={form.address} onChange={handle} className="border rounded px-2 py-1 w-full focus:ring-1 focus:ring-primary outline-none" required /></div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div><label className="block text-xs text-gray-500 font-medium">Owner Name <span className="text-red-500">*</span></label><input name="ownerName" value={form.ownerName} onChange={handle} className="border rounded px-2 py-1 w-full focus:ring-1 focus:ring-primary outline-none" required /></div>
          <div><label className="block text-xs text-gray-500 font-medium">Tax File Name</label><input name="taxFileName" value={form.taxFileName} onChange={handle} className="border rounded px-2 py-1 w-full focus:ring-1 focus:ring-primary outline-none" /></div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div><label className="block text-xs text-gray-500 font-medium">Contact Person <span className="text-red-500">*</span></label><input name="contactPersonName" value={form.contactPersonName} onChange={handle} className="border rounded px-2 py-1 w-full focus:ring-1 focus:ring-primary outline-none" required /></div>
          <div><label className="block text-xs text-gray-500 font-medium">Contact Number <span className="text-red-500">*</span></label><input name="contactNumber" value={form.contactNumber} onChange={handle} className="border rounded px-2 py-1 w-full focus:ring-1 focus:ring-primary outline-none" required /></div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div><label className="block text-xs text-gray-500 font-medium">Email <span className="text-red-500">*</span></label><input type="email" name="email" value={form.email} onChange={handle} className="border rounded px-2 py-1 w-full focus:ring-1 focus:ring-primary outline-none" required /></div>
          <div><label className="block text-xs text-gray-500 font-medium">EIN or SSN <span className="text-red-500">*</span></label><input name="einOrSsn" value={form.einOrSsn} onChange={handle} className="border rounded px-2 py-1 w-full focus:ring-1 focus:ring-primary outline-none" required /></div>
        </div>
          <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 font-medium">Due Date <span className="text-red-500">*</span></label>
            <input type="date" name="dueAt" value={form.dueAt} onChange={handle} className="border rounded px-2 py-1 w-full focus:ring-1 focus:ring-primary outline-none" required />
          </div>
          <div>
            <label className="block text-xs text-gray-500 font-medium">Assignees <span className="text-red-500">*</span></label>
            <MultiSelect
              options={users.map(u => ({ value: u._id, label: u.name }))}
              value={form.assignees}
              onChange={(vals)=>setForm(f=>({ ...f, assignees: vals }))}
              placeholder="Select assignees"
              showFilter={false}
            />
            <div className="text-xs text-gray-500 mt-1">{form.assignees.length} selected</div>
          </div>
        </div>
        <div><label className="block text-xs text-gray-500">Notes</label><textarea name="notes" value={form.notes} onChange={handle} className="border rounded px-2 py-1 w-full" rows="3" /></div>
        <div><label className="block text-xs text-gray-500">Attachments</label><input type="file" multiple onChange={(e)=>setFiles(Array.from(e.target.files))} className="border rounded px-2 py-1 w-full" /></div>
        <div className="flex justify-end gap-2">
          <BackButton to="/sales">Cancel</BackButton>
          <button disabled={submitting} className="px-3 py-1 rounded bg-primary text-white disabled:opacity-60">{submitting ? 'Creating…' : 'Create Sales Ticket'}</button>
        </div>
      </form>
    </div>
  );
}
