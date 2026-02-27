import { useEffect, useState } from 'react';
import axios from '../api/axiosInstance.js';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function SalesList() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const colorFor = (name) => {
    const palette = ['bg-blue-500','bg-emerald-500','bg-pink-500','bg-indigo-500','bg-amber-500','bg-rose-500','bg-teal-500'];
    let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return palette[h % palette.length];
  };

  const AssigneeChips = ({ one, many }) => {
    const list = Array.isArray(many) && many.length ? many : (one ? [one] : []);
    return (
      <div className="flex flex-wrap gap-1">
        {list.map((a, i) => {
          const n = a?.name || '';
          const ch = (n[0] || '?').toUpperCase();
          const cls = colorFor(n);
          return (
            <span key={i} className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-2 py-0.5">
              <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-white text-[10px] ${cls}`}>{ch}</span>
              <span className="text-xs">{n}</span>
            </span>
          );
        })}
      </div>
    );
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/sales');
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Sales Tickets</h2>
          <p className="text-sm text-gray-500">View and manage sales tickets only.</p>
        </div>
        {(user?.permissions?.['sales.create'] || user?.role === 'Admin') && (
          <Link to="/sales/new" className="px-3 py-2 rounded bg-emerald-600 text-white hover:opacity-90">
            Create Sales Ticket
          </Link>
        )}
      </div>
      {loading ? (
        <div className="text-gray-500">Loading…</div>
      ) : (
        <div className="bg-white border rounded overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-2">Business</th>
                <th className="text-left px-4 py-2">Assignees</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Turnaround</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it._id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2"><Link to={`/sales/${it._id}`} className="text-blue-700 hover:underline">{it.businessName}</Link></td>
                  <td className="px-4 py-2"><AssigneeChips one={it.assignee} many={it.assignees} /></td>
                  <td className="px-4 py-2">{it.status}</td>
                  <td className="px-4 py-2">{it.turnaroundTime}</td>
                  <td className="px-4 py-2">
                    <Link to={`/sales/${it._id}`} className="text-blue-600 hover:underline">Open</Link>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">No sales tickets found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
