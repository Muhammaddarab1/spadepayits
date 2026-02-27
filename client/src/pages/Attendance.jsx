// Attendance page: record actions and generate reports (Admin/HR)
import { useEffect, useState } from 'react';
import axios from '../api/axiosInstance.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Attendance() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);
  const [month, setMonth] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [leaveForm, setLeaveForm] = useState({ startDate: '', endDate: '', reason: '' });
  const [corrForm, setCorrForm] = useState({ date: '', newClockIn: '', newClockOut: '', reason: '' });
  const [myLeaves, setMyLeaves] = useState([]);
  const [myCorrs, setMyCorrs] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [pendingCorrs, setPendingCorrs] = useState([]);

  const canReport = user?.role === 'Admin' || user?.permissions?.['attendance.report'];
  const canApprove = user?.role === 'Admin' || user?.permissions?.['attendance.approveRequests'];

  const record = async (action) => {
    setMessage(''); setError('');
    try {
      const res = await axios.post('/api/attendance/record', { action });
      setMessage(`Recorded ${action} at ${new Date(res.data.timestamp).toLocaleString()}`);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to record');
    }
  };

  const loadMy = async () => {
    try {
      const [l, c] = await Promise.all([
        axios.get('/api/attendance/leave/mine'),
        axios.get('/api/attendance/corrections/mine'),
      ]);
      setMyLeaves(l.data); setMyCorrs(c.data);
    } catch {}
  };

  const loadPending = async () => {
    if (!canApprove) return;
    try {
      const [l, c] = await Promise.all([
        axios.get('/api/attendance/leave/pending'),
        axios.get('/api/attendance/corrections/pending'),
      ]);
      setPendingLeaves(l.data); setPendingCorrs(c.data);
    } catch {}
  };

  const fetchReport = async () => {
    setError(''); setMessage('');
    try {
      const params = {};
      if (month) params.month = month;
      if (start) params.start = start;
      if (end) params.end = end;
      const res = await axios.get('/api/attendance/report', { params });
      setReport(res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to fetch report');
    }
  };

  const submitLeave = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      await axios.post('/api/attendance/leave', leaveForm);
      setLeaveForm({ startDate: '', endDate: '', reason: '' });
      setMessage('Leave request submitted');
      loadMy();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to submit leave');
    }
  };

  const submitCorrection = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      await axios.post('/api/attendance/corrections', corrForm);
      setCorrForm({ date: '', newClockIn: '', newClockOut: '', reason: '' });
      setMessage('Correction request submitted');
      loadMy();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to submit correction');
    }
  };

  const decide = async (kind, id, approve) => {
    try {
      const path = kind === 'leave' ? `/api/attendance/leave/${id}/decision` : `/api/attendance/corrections/${id}/decision`;
      await axios.patch(path, { approve });
      loadPending();
    } catch {}
  };

  useEffect(() => { loadMy(); loadPending(); }, []); 

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Attendance</h2>
        <p className="text-sm text-gray-500">Clock in/out, request leave or corrections. Admin can run reports and approvals.</p>
      </div>
      {message && <div className="text-sm text-green-700">{message}</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="bg-white border rounded p-4 flex flex-wrap gap-2">
        <button onClick={()=>record('login')} className="px-3 py-1 rounded bg-primary text-white">Clock In</button>
        <button onClick={()=>record('break_start')} className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">Start Break</button>
        <button onClick={()=>record('break_end')} className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">End Break</button>
        <button onClick={()=>record('logout')} className="px-3 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100">Clock Out</button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border rounded p-4 space-y-3">
          <div className="font-semibold">Leave Request</div>
          <form onSubmit={submitLeave} className="space-y-2">
            <div><label className="block text-xs text-gray-500">Start</label><input type="date" value={leaveForm.startDate} onChange={(e)=>setLeaveForm(f=>({...f,startDate:e.target.value}))} className="border rounded px-2 py-1 w-full" required/></div>
            <div><label className="block text-xs text-gray-500">End</label><input type="date" value={leaveForm.endDate} onChange={(e)=>setLeaveForm(f=>({...f,endDate:e.target.value}))} className="border rounded px-2 py-1 w-full" required/></div>
            <div><label className="block text-xs text-gray-500">Reason</label><input value={leaveForm.reason} onChange={(e)=>setLeaveForm(f=>({...f,reason:e.target.value}))} className="border rounded px-2 py-1 w-full" required/></div>
            <button className="px-3 py-1 rounded bg-primary text-white">Submit</button>
          </form>
          <div>
            <div className="font-medium text-sm mt-2">My Leaves</div>
            <ul className="text-sm space-y-1">
              {myLeaves.map(l=> (<li key={l._id}>{new Date(l.startDate).toLocaleDateString()} → {new Date(l.endDate).toLocaleDateString()} — {l.status}</li>))}
              {myLeaves.length===0 && <li className="text-gray-500">No requests</li>}
            </ul>
          </div>
        </div>
        <div className="bg-white border rounded p-4 space-y-3">
          <div className="font-semibold">Attendance Correction</div>
          <form onSubmit={submitCorrection} className="space-y-2">
            <div><label className="block text-xs text-gray-500">Date</label><input type="date" value={corrForm.date} onChange={(e)=>setCorrForm(f=>({...f,date:e.target.value}))} className="border rounded px-2 py-1 w-full" required/></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="block text-xs text-gray-500">New Clock In</label><input type="datetime-local" value={corrForm.newClockIn} onChange={(e)=>setCorrForm(f=>({...f,newClockIn:e.target.value}))} className="border rounded px-2 py-1 w-full"/></div>
              <div><label className="block text-xs text-gray-500">New Clock Out</label><input type="datetime-local" value={corrForm.newClockOut} onChange={(e)=>setCorrForm(f=>({...f,newClockOut:e.target.value}))} className="border rounded px-2 py-1 w-full"/></div>
            </div>
            <div><label className="block text-xs text-gray-500">Reason</label><input value={corrForm.reason} onChange={(e)=>setCorrForm(f=>({...f,reason:e.target.value}))} className="border rounded px-2 py-1 w-full" required/></div>
            <button className="px-3 py-1 rounded bg-primary text-white">Submit</button>
          </form>
          <div>
            <div className="font-medium text-sm mt-2">My Corrections</div>
            <ul className="text-sm space-y-1">
              {myCorrs.map(c=> (<li key={c._id}>{new Date(c.date).toLocaleDateString()} — {c.status}</li>))}
              {myCorrs.length===0 && <li className="text-gray-500">No requests</li>}
            </ul>
          </div>
        </div>
      </div>
      {canReport && (
        <div className="bg-white border rounded p-4 space-y-3">
          <div className="font-semibold">Reports</div>
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500">Month (YYYY-MM)</label>
              <input value={month} onChange={(e)=>setMonth(e.target.value)} className="border rounded px-2 py-1 w-full" placeholder="2026-02" />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Start</label>
              <input type="date" value={start} onChange={(e)=>setStart(e.target.value)} className="border rounded px-2 py-1 w-full" />
            </div>
            <div>
              <label className="block text-xs text-gray-500">End</label>
              <input type="date" value={end} onChange={(e)=>setEnd(e.target.value)} className="border rounded px-2 py-1 w-full" />
            </div>
          </div>
          <button onClick={fetchReport} className="px-3 py-1 rounded bg-primary text-white">Generate Report</button>
          {report && (
            <div className="overflow-auto">
              <table className="min-w-full text-sm mt-3">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-3 py-2">User</th>
                    <th className="text-left px-3 py-2">Action</th>
                    <th className="text-left px-3 py-2">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {report.entries.map((e,i)=>(
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2">{e.user?.name} ({e.user?.role})</td>
                      <td className="px-3 py-2">{e.action}</td>
                      <td className="px-3 py-2">{new Date(e.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {canApprove && (
        <div className="bg-white border rounded p-4 space-y-3">
          <div className="font-semibold">Pending Approvals</div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="font-medium text-sm">Leaves</div>
              <ul className="text-sm space-y-2">
                {pendingLeaves.map(l=>(
                  <li key={l._id} className="flex items-center justify-between border rounded px-2 py-1">
                    <span>{l.user?.name}: {new Date(l.startDate).toLocaleDateString()} → {new Date(l.endDate).toLocaleDateString()}</span>
                    <div className="flex gap-2">
                      <button onClick={()=>decide('leave', l._id, true)} className="px-2 py-1 rounded bg-green-600 text-white">Approve</button>
                      <button onClick={()=>decide('leave', l._id, false)} className="px-2 py-1 rounded bg-red-600 text-white">Reject</button>
                    </div>
                  </li>
                ))}
                {pendingLeaves.length===0 && <li className="text-gray-500">No pending leaves</li>}
              </ul>
            </div>
            <div>
              <div className="font-medium text-sm">Corrections</div>
              <ul className="text-sm space-y-2">
                {pendingCorrs.map(c=>(
                  <li key={c._id} className="flex items-center justify-between border rounded px-2 py-1">
                    <span>{c.user?.name}: {new Date(c.date).toLocaleDateString()}</span>
                    <div className="flex gap-2">
                      <button onClick={()=>decide('correction', c._id, true)} className="px-2 py-1 rounded bg-green-600 text-white">Approve</button>
                      <button onClick={()=>decide('correction', c._id, false)} className="px-2 py-1 rounded bg-red-600 text-white">Reject</button>
                    </div>
                  </li>
                ))}
                {pendingCorrs.length===0 && <li className="text-gray-500">No pending corrections</li>}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
