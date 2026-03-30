import { useEffect, useState } from 'react';
import axios from '../api/axiosInstance.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate, useLocation } from 'react-router-dom';
import BackButton from '../components/BackButton.jsx';
import MultiSelect from '../components/MultiSelect.jsx';

export default function TicketNew() {
  const { user } = useAuth();
  const location = useLocation();
  const preData = location.state || {};

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
    mid: preData.mid || '',
    dba: preData.dba || '',
    contactNumber: preData.contactNumber || '',
    contactPerson: preData.contactPerson || '',
    notes: preData.notes || '',
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
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-xl border shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <BackButton to="/troubleshooting" />
          <div>
            <h2 className="text-2xl font-bold text-slateText text-center">New Ticket</h2>
            <p className="text-sm text-gray-500">Provide ticket details below</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            type="button"
            onClick={() => navigate('/troubleshooting')}
            className="px-6 py-2 rounded-lg bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={submit}
            disabled={submitting} 
            className="px-6 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm"
          >
            {submitting ? 'Creating...' : 'Create Ticket'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-center gap-2 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-6 space-y-8">
          {/* Primary Info */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Subject</label>
              <input 
                name="subject" 
                value={form.subject} 
                onChange={handle} 
                placeholder="Briefly describe the issue"
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium" 
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assignees</label>
              <MultiSelect
                options={users.map(u => ({ value: u._id, label: u.name }))}
                value={form.assignees}
                onChange={(vals)=>setForm(f=>({ ...f, assignees: vals }))}
                placeholder="Select assignees"
              />
            </div>
          </div>

          {/* Customer Context */}
          <div className="pt-8 border-t space-y-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Merchant ID (MID)</label>
                <input 
                  name="mid" 
                  value={form.mid} 
                  onChange={handle} 
                  placeholder="Enter MID"
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-mono" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Business Name (DBA)</label>
                <input 
                  name="dba" 
                  value={form.dba} 
                  onChange={handle} 
                  placeholder="Enter DBA Name"
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" 
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contact Number</label>
                <input 
                  name="contactNumber" 
                  value={form.contactNumber} 
                  onChange={handle} 
                  placeholder="Phone number"
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contact Person</label>
                <input 
                  name="contactPerson" 
                  value={form.contactPerson} 
                  onChange={handle} 
                  placeholder="Name of contact"
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" 
                />
              </div>
            </div>
          </div>

          {/* Ticket Details */}
          <div className="pt-8 border-t space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description</label>
              <textarea 
                name="description" 
                value={form.description} 
                onChange={handle} 
                placeholder="Detailed description of the problem..."
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm min-h-[150px]" 
                required 
              />
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Priority</label>
                <select 
                  name="priority" 
                  value={form.priority} 
                  onChange={handle} 
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-bold ${
                    form.priority === 'High' ? 'text-red-600 bg-red-50/30' : 
                    form.priority === 'Medium' ? 'text-orange-600 bg-orange-50/30' : 
                    'text-gray-600 bg-gray-50/30'
                  }`}
                  required
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Due Date</label>
                <input 
                  type="date" 
                  name="dueAt" 
                  value={form.dueAt} 
                  onChange={handle} 
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tags</label>
                <MultiSelect
                  options={tagsCatalog.map(t => ({ value: t.name, label: t.name }))}
                  value={form.tags}
                  onChange={(vals)=>setForm(f=>({ ...f, tags: vals }))}
                  placeholder="Select tags"
                />
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="pt-8 border-t space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Internal Notes</label>
              <textarea 
                name="notes" 
                value={form.notes} 
                onChange={handle} 
                placeholder="Any internal-only notes..."
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm min-h-[100px]" 
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Attachments</label>
              <div className="relative group border-2 border-dashed border-gray-200 hover:border-primary/50 rounded-xl p-8 transition-all text-center bg-gray-50/30">
                <input 
                  type="file" 
                  multiple 
                  onChange={(e)=>setFiles(Array.from(e.target.files))} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                />
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto text-gray-400 group-hover:text-primary group-hover:shadow-md transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">Click or drag files to upload</p>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Max 5 files</p>
                  {files.length > 0 && (
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {files.map((f, i) => (
                        <span key={i} className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-bold border border-primary/20">
                          {f.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
