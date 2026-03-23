// TicketTable displays tickets with color-coded statuses and priority indicators
import axios from '../api/axiosInstance.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';

const StatusBadge = ({ status }) => {
  const cls =
    status === 'Open' ? 'badge badge-open' :
    status === 'In Progress' ? 'badge badge-inprogress' :
    'badge badge-solved';
  return <span className={cls}>{status}</span>;
};

const PriorityMark = ({ priority }) => {
  const cls =
    priority === 'High' ? 'priority-high' :
    priority === 'Medium' ? 'priority-medium' : 'priority-low';
  return <span className={cls}>{priority}</span>;
};

export default function TicketTable({ tickets = [], onRefresh }) {
  const { user } = useAuth();


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

  return (
    <div className="bg-white border rounded overflow-hidden">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="text-left px-4 py-2">Subject</th>
            <th className="text-left px-4 py-2">Assignee</th>
            <th className="text-left px-4 py-2">Priority</th>
            <th className="text-left px-4 py-2">Status</th>
            <th className="text-left px-4 py-2">Due / Time Left</th>
            <th className="text-left px-4 py-2">Tags</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map(t => (
            <tr key={t._id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2">
                <Link to={`/tickets/${t._id}`} className="text-blue-700 hover:underline">{t.ticketNumber ? `#${t.ticketNumber} - ` : ''}{t.subject}</Link>
              </td>
              <td className="px-4 py-2">
                <AssigneeChips one={t.assignee} many={t.assignees} />
              </td>
              <td className="px-4 py-2"><PriorityMark priority={t.priority} /></td>
              <td className="px-4 py-2"><StatusBadge status={t.status} /></td>
              <td className="px-4 py-2">
                {t.dueAt ? (() => {
                    const now = new Date();
                    const due = new Date(t.dueAt);
                    const diff = due - now;
                    if (diff <= 0) return <span className="text-red-500">Expired</span>;
                    const days = Math.ceil(diff / 86400000);
                    if (days === 1) return <span>Last day</span>;
                    return <span>{days} days left</span>;
                  })() : <span className="text-gray-400">No due</span>}
              </td>
              <td className="px-4 py-2">{t.tags?.join(', ')}</td>
            </tr>
          ))}
          {tickets.length === 0 && (
            <tr>
              <td colSpan="6" className="px-4 py-8 text-center text-gray-500">No tickets found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
