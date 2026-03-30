import { useEffect, useState } from 'react';
import axios from '../api/axiosInstance.js';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import BackButton from '../components/BackButton.jsx';
import MultiSelect from '../components/MultiSelect.jsx';

export default function TicketEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [users, setUsers] = useState([]);
  const [tagsCatalog, setTagsCatalog] = useState([]);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentsList, setCommentsList] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [activeTab, setActiveTab] = useState('details');
  const [showTimeline, setShowTimeline] = useState(false);

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
        setCommentsList(t.data.comments || []);
        // fetch activity logs for timeline
        try {
          const logs = await axios.get('/api/activityLogs', { params: { ticket: id } });
          setTimeline(logs.data || []);
        } catch {}
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
        subject: ticket.subject,
        description: ticket.description,
        assignees: (Array.isArray(ticket.assignees) ? ticket.assignees : []).map(a => a._id || a),
        tags: ticket.tags,
        priority: ticket.priority,
        status: ticket.status,
        dueAt: ticket.dueAt || null,
        mid: ticket.mid,
        dba: ticket.dba,
        contactNumber: ticket.contactNumber,
        contactPerson: ticket.contactPerson,
        notes: ticket.notes,
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

  if (!ticket) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading ticket details...</div>;

  const TabButton = ({ id, label, count }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
        activeTab === id
          ? 'border-primary text-primary bg-primary/5'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      }`}
    >
      {label}
      {count !== undefined && (
        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
          activeTab === id ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="flex h-[calc(100vh-120px)] overflow-hidden -m-6">
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${showTimeline ? 'mr-80' : ''}`}>
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-white border-b shadow-sm px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <BackButton to="/troubleshooting" />
              <div>
                <h2 className="text-xl font-bold text-slateText truncate max-w-md">
                  {ticket.subject}
                </h2>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="font-mono">#{ticket.ticketNumber || id.slice(-6)}</span>
                  <span>•</span>
                  <span>Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowTimeline(!showTimeline)}
                className={`p-2 rounded-lg transition-colors ${
                  showTimeline ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Toggle Timeline"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button
                disabled={saving}
                onClick={save}
                className="px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50 shadow-sm transition-all"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Status:</span>
              <select 
                value={ticket.status} 
                onChange={(e)=>setField('status', e.target.value)}
                className={`text-xs font-bold px-2 py-1 rounded-full border-none focus:ring-2 focus:ring-primary/20 ${
                  ticket.status === 'Solved' ? 'bg-green-100 text-green-700' :
                  ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}
              >
                <option>Open</option>
                <option>In Progress</option>
                <option>Solved</option>
              </select>
            </div>
            <div className="flex items-center gap-2 border-l pl-4">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Priority:</span>
              <select 
                value={ticket.priority} 
                onChange={(e)=>setField('priority', e.target.value)}
                className={`text-xs font-bold px-2 py-1 rounded-full border-none focus:ring-2 focus:ring-primary/20 ${
                  ticket.priority === 'High' ? 'bg-red-100 text-red-700' :
                  ticket.priority === 'Medium' ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-700'
                }`}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white border-b px-6 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <TabButton id="details" label="Details" />
          <TabButton id="comments" label="Comments" count={commentsList.length} />
          <TabButton id="attachments" label="Attachments" count={(ticket.attachments || []).length} />
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {activeTab === 'details' && (
            <div className="max-w-4xl space-y-6">
              <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Subject</label>
                    <input 
                      value={ticket.subject} 
                      onChange={(e)=>setField('subject', e.target.value)} 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                      required 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assignees</label>
                    <MultiSelect
                      options={users.map(u => ({ value: u._id, label: u.name }))}
                      value={(ticket.assignees || []).map(a=>a._id || a)}
                      onChange={(vals)=>setField('assignees', vals)}
                      placeholder="Select assignees"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Merchant ID (MID)</label>
                    <input 
                      value={ticket.mid||''} 
                      onChange={(e)=>setField('mid', e.target.value)} 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-sm font-mono" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Business Name (DBA)</label>
                    <input 
                      value={ticket.dba||''} 
                      onChange={(e)=>setField('dba', e.target.value)} 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-sm" 
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contact Number</label>
                    <input 
                      value={ticket.contactNumber||''} 
                      onChange={(e)=>setField('contactNumber', e.target.value)} 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-sm" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contact Person</label>
                    <input 
                      value={ticket.contactPerson||''} 
                      onChange={(e)=>setField('contactPerson', e.target.value)} 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-sm" 
                    />
                  </div>
                </div>

                <div className="space-y-1 pt-4 border-t">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description</label>
                  <textarea 
                    value={ticket.description} 
                    onChange={(e)=>setField('description', e.target.value)} 
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-sm min-h-[120px]" 
                    required 
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tags</label>
                    <MultiSelect
                      options={tagsCatalog.map(t => ({ value: t.name, label: t.name }))}
                      value={ticket.tags || []}
                      onChange={(vals)=>setField('tags', vals)}
                      placeholder="Select tags"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Due Date</label>
                    <input 
                      type="date" 
                      value={ticket.dueAt ? ticket.dueAt.slice(0,10) : ''} 
                      onChange={(e)=>setField('dueAt', e.target.value)} 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-sm" 
                    />
                  </div>
                </div>

                <div className="space-y-1 pt-4 border-t">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Internal Notes</label>
                  <textarea 
                    value={ticket.notes||''} 
                    onChange={(e)=>setField('notes', e.target.value)} 
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-sm min-h-[80px]" 
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="max-w-4xl space-y-6">
              <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
                <div className="space-y-4">
                  {commentsList.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <p>No comments yet.</p>
                    </div>
                  ) : (
                    commentsList.map((c, i) => (
                      <div key={i} className="flex gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 group transition-all">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                          {c.author?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-slateText">{c.author?.name || 'Unknown User'}</span>
                            <span className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{c.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-6 border-t">
                  <div className="relative">
                    <textarea 
                      placeholder="Add a comment..."
                      value={commentText} 
                      onChange={(e)=>setCommentText(e.target.value)} 
                      className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[100px]" 
                    />
                    <div className="flex justify-end mt-3">
                      <button 
                        type="button"
                        onClick={async ()=>{
                          if (!commentText.trim()) return;
                          try {
                            const res = await axios.post(`/api/tickets/${id}/comments`, { text: commentText });
                            // The backend returns the raw comment object, we need to add the user info manually or re-fetch
                            const newComment = {
                              ...res.data,
                              author: { name: user.name }
                            };
                            setCommentsList(l => [...l, newComment]);
                            setCommentText('');
                          } catch (e) {}
                        }} 
                        className="px-6 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-sm"
                      >
                        Post Comment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="max-w-4xl space-y-6">
              <div className="bg-white p-6 rounded-xl border shadow-sm space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Upload New Files</label>
                  <div className="relative group border-2 border-dashed border-gray-200 hover:border-primary/50 rounded-xl p-8 transition-all text-center">
                    <input 
                      type="file" 
                      multiple 
                      onChange={(e)=>setFiles(Array.from(e.target.files))} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    />
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-600 font-medium">Click or drag files to upload</p>
                      {files.length > 0 && (
                        <p className="text-xs text-primary font-bold">{files.length} files selected</p>
                      )}
                    </div>
                  </div>
                </div>

                {Array.isArray(ticket.attachments) && ticket.attachments.length > 0 && (
                  <div className="space-y-4 pt-6 border-t">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Existing Attachments</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {ticket.attachments.map((a, i) => {
                        const downloadUrl = a.url ? a.url.replace('/uploads/', `/api/tickets/${id}/attachments/`) : '';
                        const isImage = a.mimetype?.startsWith?.('image/');
                        return (
                          <div key={i} className="flex items-center gap-4 p-3 rounded-xl border hover:border-primary/30 transition-all bg-gray-50/50 group">
                            <div className="w-16 h-16 shrink-0 bg-white border rounded-lg overflow-hidden flex items-center justify-center">
                              {isImage ? (
                                <img src={a.url} alt={a.filename} className="w-full h-full object-cover" />
                              ) : (
                                <div className="text-[10px] font-bold text-gray-400 text-center uppercase p-1 truncate">
                                  {a.filename.split('.').pop()}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slateText truncate">{a.filename}</p>
                              <p className="text-[10px] text-gray-400">{Math.round((a.size||0)/1024)} KB</p>
                              <div className="flex gap-2 mt-2">
                                <a href={a.url} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-primary hover:underline">View</a>
                                <a href={downloadUrl} target="_blank" rel="noreferrer" download className="text-[10px] font-bold text-primary hover:underline border-l pl-2">Download</a>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slide Panel for Timeline */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col border-l ${
          showTimeline ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 border-b flex items-center justify-between bg-gray-50">
          <h3 className="font-bold text-slateText flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Activity Log
          </h3>
          <button 
            onClick={() => setShowTimeline(false)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {timeline.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-12">No activity recorded yet.</p>
          ) : (
            timeline.map((l, i) => (
              <div key={i} className="relative pl-6 pb-6 border-l border-gray-100 last:border-0">
                <div className="absolute left-[-5px] top-0 w-[9px] h-[9px] rounded-full bg-primary/30 border-2 border-white ring-2 ring-primary/10 shadow-sm" />
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slateText">{l.action}</div>
                  <p className="text-xs text-gray-500 leading-relaxed">{l.details}</p>
                  <div className="text-[10px] text-gray-400">{new Date(l.timestamp).toLocaleString()}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Overlay for Sidebar */}
      {showTimeline && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setShowTimeline(false)}
        />
      )}
    </div>
  );
}
