import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from '../api/axiosInstance.js';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function HomeDashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [t, s] = await Promise.all([
        axios.get('/api/tickets'),
        axios.get('/api/sales'),
      ]);
      setTickets(t.data || []);
      setSales(s.data || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (user) fetchAll();
    const onChanged = () => user && fetchAll();
    window.addEventListener('tickets:changed', onChanged);
    window.addEventListener('sales:changed', onChanged);
    return () => {
      window.removeEventListener('tickets:changed', onChanged);
      window.removeEventListener('sales:changed', onChanged);
    };
  }, [fetchAll, user]);

  const isMe = useCallback((u) => (u?._id || u) === user?.id, [user]);
  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') Notification.requestPermission().catch(()=>{});
  }, []);
  const notifiedRef = useRef(() => {
    try { return new Set(JSON.parse(localStorage.getItem('dueNotified') || '[]')); } catch { return new Set(); }
  });
  const [_, setTick] = useState(0);
  useEffect(() => {
    const checkDue = () => {
      const set = typeof notifiedRef.current === 'function' ? notifiedRef.current() : notifiedRef.current;
      const mine = [...tickets, ...sales].filter(x => (isMe(x.assignee) || (Array.isArray(x.assignees) && x.assignees.some(isMe))) && x.status !== 'Solved' && x.dueAt && new Date(x.dueAt) <= new Date());
      for (const x of mine) {
        if (set.has(x._id)) continue;
        try {
          if (Notification.permission === 'granted') new Notification('Turnaround reached', { body: x.subject || x.businessName || 'Ticket due' });
        } catch {}
        set.add(x._id);
      }
      notifiedRef.current = set;
      try { localStorage.setItem('dueNotified', JSON.stringify(Array.from(set))); } catch {}
      setTick(v => v + 1);
    };
    const timer = setInterval(checkDue, 60000);
    checkDue();
    return () => clearInterval(timer);
  }, [tickets, sales, isMe]);
  const counts = useMemo(() => {
    const t = {
      open: tickets.filter(x => x.status === 'Open').length,
      prog: tickets.filter(x => x.status === 'In Progress').length,
      mine: tickets.filter(x => (isMe(x.assignee) || (Array.isArray(x.assignees) && x.assignees.some(isMe))) && x.status !== 'Solved').length,
      latest: tickets.slice(0, 5),
    };
    const s = {
      open: sales.filter(x => x.status === 'Open').length,
      prog: sales.filter(x => x.status === 'In Progress').length,
      mine: sales.filter(x => (isMe(x.assignee) || (Array.isArray(x.assignees) && x.assignees.some(isMe))) && x.status !== 'Solved').length,
      latest: sales.slice(0, 5),
    };
    return { t, s };
  }, [tickets, sales, isMe]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Welcome, {user?.name}</h2>
        <p className="text-sm text-gray-500">Here is your quick overview.</p>
      </div>
      {loading ? <div className="text-gray-500">Loading…</div> : (
        <>
          <section className="space-y-3">
            <h3 className="font-semibold">Troubleshooting</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 rounded border bg-white"><div className="text-xs text-gray-500">Open</div><div className="text-3xl font-semibold">{counts.t.open}</div></div>
              <div className="p-4 rounded border bg-white"><div className="text-xs text-gray-500">In Progress</div><div className="text-3xl font-semibold">{counts.t.prog}</div></div>
              <div className="p-4 rounded border bg-white"><div className="text-xs text-gray-500">Assigned to Me</div><div className="text-3xl font-semibold">{counts.t.mine}</div></div>
            </div>
            <div className="bg-white border rounded overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600"><tr><th className="px-4 py-2 text-left">Subject</th><th className="px-4 py-2 text-left">Status</th></tr></thead>
                <tbody>
                  {counts.t.latest.map((x) => (<tr key={x._id} className="border-t"><td className="px-4 py-2"><Link className="text-blue-700 hover:underline" to={`/tickets/${x._id}`}>{x.subject}</Link></td><td className="px-4 py-2">{x.status}</td></tr>))}
                  {counts.t.latest.length === 0 && (<tr><td className="px-4 py-6 text-gray-500" colSpan="2">No recent troubleshooting tickets</td></tr>)}
                </tbody>
              </table>
            </div>
          </section>
          <section className="space-y-3">
            <h3 className="font-semibold">Sales</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 rounded border bg-white"><div className="text-xs text-gray-500">Open</div><div className="text-3xl font-semibold">{counts.s.open}</div></div>
              <div className="p-4 rounded border bg-white"><div className="text-xs text-gray-500">In Progress</div><div className="text-3xl font-semibold">{counts.s.prog}</div></div>
              <div className="p-4 rounded border bg-white"><div className="text-xs text-gray-500">Assigned to Me</div><div className="text-3xl font-semibold">{counts.s.mine}</div></div>
            </div>
            <div className="bg-white border rounded overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600"><tr><th className="px-4 py-2 text-left">Business</th><th className="px-4 py-2 text-left">Status</th></tr></thead>
                <tbody>
                  {counts.s.latest.map((x) => (<tr key={x._id} className="border-t"><td className="px-4 py-2"><Link className="text-blue-700 hover:underline" to={`/sales/${x._id}`}>{x.businessName}</Link></td><td className="px-4 py-2">{x.status}</td></tr>))}
                  {counts.s.latest.length === 0 && (<tr><td className="px-4 py-6 text-gray-500" colSpan="2">No recent sales tickets</td></tr>)}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
      <div className="flex gap-3">
        <Link to="/troubleshooting" className="px-3 py-2 rounded bg-blue-600 text-white hover:opacity-90">Troubleshooting</Link>
        <Link to="/sales" className="px-3 py-2 rounded bg-emerald-600 text-white hover:opacity-90">Sales</Link>
      </div>
    </div>
  );
}
