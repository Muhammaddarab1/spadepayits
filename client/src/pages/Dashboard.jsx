// Dashboard shows tickets list and a button to create new tickets
import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from '../api/axiosInstance.js';
import TicketFilter from '../components/TicketFilter.jsx';
import TicketTable from '../components/TicketTable.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Link, useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [filters, setFilters] = useState({ assignee: '', assignees: [], status: '', priority: '', tags: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const canGenerateReport = user?.role === 'Admin' || user?.permissions?.['reports.generate'];

  const query = useMemo(() => {
    const q = {};
    if (filters.assignee) q.assignee = filters.assignee;
    if (filters.assignees && filters.assignees.length) q.assignees = filters.assignees.join(',');
    if (filters.status) q.status = filters.status;
    if (filters.priority) q.priority = filters.priority;
    if (filters.tags) q.tags = filters.tags;
    return q;
  }, [filters]);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/tickets', { params: query });
      setTickets(res.data);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Troubleshooting Tickets</h2>
          <p className="text-sm text-gray-500">View and manage troubleshooting tickets only.</p>
        </div>
        <div className="flex gap-2">
          {canGenerateReport && (
            <button
              onClick={async ()=>{
                const res = await axios.get('/api/reports/tickets', { params: { format: 'csv' }, responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const a = document.createElement('a'); a.href = url; a.download = 'ticket-summary.csv'; a.click(); window.URL.revokeObjectURL(url);
              }}
              className="px-3 py-2 rounded bg-gray-800 text-white hover:opacity-90"
            >
              One-Click Report
            </button>
          )}
          {(user?.permissions?.['tickets.create'] || user?.role === 'Admin') && (
            <Link to="/tickets/new" className="px-3 py-2 rounded bg-primary text-white hover:opacity-90">
              Create Ticket
            </Link>
          )}
        </div>
      </div>
      <TicketFilter onChange={setFilters} />
      {loading ? (
        <div className="text-gray-500">Loading…</div>
      ) : (
        <TicketTable tickets={tickets} onRefresh={fetchTickets} />
      )}
    </div>
  );
}
