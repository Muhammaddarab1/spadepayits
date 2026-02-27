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

  const canEdit = (t) => {
    const inAssignees = Array.isArray(t.assignees) && t.assignees.some(u => (u?._id || u) === user?.id);
    return user?.role === 'Admin' || user?.role === 'Agent' || t.assignee?._id === user?.id || inAssignees || t.createdBy?._id === user?.id;
  };

  const updateStatus = async (id, status) => {
    await axios.patch(`/api/tickets/${id}/status`, { status });
    onRefresh?.();
    try { window.dispatchEvent(new Event('tickets:changed')); } catch {}
  };

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
            <th className="text-left px-4 py-2">Tags</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {tickets.map(t => (
            <tr key={t._id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2">
                <Link to={`/tickets/${t._id}`} className="text-blue-700 hover:underline">{t.subject}</Link>
              </td>
              <td className="px-4 py-2">
                <AssigneeChips one={t.assignee} many={t.assignees} />
              </td>
              <td className="px-4 py-2"><PriorityMark priority={t.priority} /></td>
              <td className="px-4 py-2"><StatusBadge status={t.status} /></td>
              <td className="px-4 py-2">{t.tags?.join(', ')}</td>
              <td className="px-4 py-2">
                {canEdit(t) ? (
                  <select
                    value={t.status}
                    onChange={(e) => updateStatus(t._id, e.target.value)}
                    className="border rounded px-2 py-1"
                  >
                    <option>Open</option>
                    <option>In Progress</option>
                    <option>Solved</option>
                  </select>
                ) : (
                  <span className="text-gray-400">View only</span>
                )}
              </td>
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
