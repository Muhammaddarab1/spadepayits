import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from '../api/axiosInstance.js';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function HomeDashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [sales, setSales] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const fetchT = axios.get('/api/tickets').then(r => r.data).catch(e => {
        if (e.response?.status !== 403 && e.response?.status !== 423) console.error('Failed to fetch tickets:', e);
        return [];
      });
      const fetchS = axios.get('/api/sales').then(r => r.data).catch(e => {
        if (e.response?.status !== 403 && e.response?.status !== 423) console.error('Failed to fetch sales:', e);
        return [];
      });
      const fetchN = axios.get('/api/notifications').then(r => r.data).catch(e => {
        if (e.response?.status !== 423) console.error('Failed to fetch notifications:', e);
        return [];
      });

      const [t, s, n] = await Promise.all([fetchT, fetchS, fetchN]);
      setTickets(t || []);
      setSales(s || []);
      setNotifications(n || []);
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

  const markRead = async (id) => {
    try {
      await axios.patch(`/api/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`/api/notifications/${id}`);
      setNotifications(notifications.filter(n => n._id !== id));
    } catch {}
  };

  const isMe = useCallback((u) => {
    const targetId = u?._id || u;
    return targetId && targetId === user?.id;
  }, [user]);

  const canSeeSales = user?.role === 'Admin' || user?.permissions?.['sales.viewMenu'];
  const canSeeTroubleshooting = user?.role === 'Admin' || user?.permissions?.['troubleshooting.viewMenu'];

  const counts = useMemo(() => {
    // If user is not admin and has no viewAll, the 'tickets' array already only contains their own tickets.
    // In this case, 'Open' and 'In Progress' cards will show THEIR counts.
    // If they ARE admin or have viewAll, it shows system-wide counts.
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
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slateText">Welcome, {user?.name}</h2>
          <p className="text-sm text-gray-500">Here is what's happening with your tickets today.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Stats and Tickets (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-64 bg-white rounded-xl border">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Troubleshooting Stats */}
              {canSeeTroubleshooting && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slateText">Troubleshooting Overview</h3>
                    <Link to="/troubleshooting" className="text-sm text-primary hover:underline">View All</Link>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Open</div>
                      <div className="text-3xl font-bold text-primary mt-1">{counts.t.open}</div>
                    </div>
                    <div className="p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">In Progress</div>
                      <div className="text-3xl font-bold text-warning mt-1">{counts.t.prog}</div>
                    </div>
                    <div className="p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-primary">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Assigned to Me</div>
                      <div className="text-3xl font-bold text-slateText mt-1">{counts.t.mine}</div>
                    </div>
                  </div>
                  
                  <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50/50 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
                        <tr>
                          <th className="px-6 py-3 text-left">Subject</th>
                          <th className="px-6 py-3 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {counts.t.latest.map((x) => (
                          <tr key={x._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <Link className="font-medium text-slateText hover:text-primary transition-colors" to={`/tickets/${x._id}`}>
                                {x.subject}
                              </Link>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                x.status === 'Open' ? 'bg-blue-100 text-primary' : 
                                x.status === 'In Progress' ? 'bg-yellow-100 text-warning' : 
                                'bg-green-100 text-success'
                              }`}>
                                {x.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {counts.t.latest.length === 0 && (
                          <tr><td className="px-6 py-10 text-center text-gray-400" colSpan="2">No recent troubleshooting tickets</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Sales Overview */}
              {canSeeSales && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slateText">Sales Overview</h3>
                    <Link to="/sales" className="text-sm text-primary hover:underline">View All</Link>
                  </div>
                  <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50/50 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
                        <tr>
                          <th className="px-6 py-3 text-left">Business Name</th>
                          <th className="px-6 py-3 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {counts.s.latest.map((x) => (
                          <tr key={x._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <Link className="font-medium text-slateText hover:text-primary transition-colors" to={`/sales/${x._id}`}>
                                {x.businessName}
                              </Link>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                x.status === 'Open' ? 'bg-blue-100 text-primary' : 
                                x.status === 'In Progress' ? 'bg-yellow-100 text-warning' : 
                                'bg-green-100 text-success'
                              }`}>
                                {x.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {counts.s.latest.length === 0 && (
                          <tr><td className="px-6 py-10 text-center text-gray-400" colSpan="2">No recent sales tickets</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {/* Sidebar Notifications (1/3 width) */}
        <div className="space-y-6">
          <section className="bg-white rounded-xl border shadow-sm flex flex-col h-[600px]">
            <div className="p-4 border-b flex items-center justify-between bg-gray-50/50 rounded-t-xl">
              <h3 className="font-bold text-slateText">Recent Updates</h3>
              <span className="bg-primary/10 text-primary text-[10px] px-2 py-1 rounded-full font-bold">
                {notifications.filter(n => !n.isRead).length} New
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p className="text-xs">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n._id} 
                    className={`p-3 rounded-lg border transition-all ${!n.isRead ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-white hover:bg-gray-50'}`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!n.isRead ? 'font-bold text-slateText' : 'text-gray-700'}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {n.message}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          {n.link && (
                            <Link 
                              to={n.link} 
                              onClick={() => markRead(n._id)}
                              className="text-[10px] text-primary hover:underline font-bold inline-block"
                            >
                              VIEW TICKET
                            </Link>
                          )}
                          {!n.isRead && (
                            <button 
                              onClick={() => markRead(n._id)}
                              className="text-[10px] text-green-600 hover:text-green-700 font-bold"
                              title="Mark as read"
                            >
                              READ
                            </button>
                          )}
                          <button 
                            onClick={() => deleteNotification(n._id)}
                            className="text-[10px] text-red-500 hover:text-red-600 font-bold"
                            title="Delete notification"
                          >
                            REMOVE
                          </button>
                        </div>
                      </div>
                      {!n.isRead && <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 font-medium uppercase tracking-tighter">
                      {new Date(n.createdAt).toLocaleDateString()} • {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 border-t bg-gray-50/50 rounded-b-xl text-center">
               <button 
                onClick={async () => {
                  try {
                    await axios.post('/api/notifications/read-all');
                    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
                  } catch {}
                }}
                className="text-xs font-bold text-gray-500 hover:text-primary transition-colors"
               >
                 MARK ALL AS READ
               </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
