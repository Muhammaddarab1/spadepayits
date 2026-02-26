import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from '../api/axiosInstance.js';
import TicketTable from '../components/TicketTable.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function MyAssignments() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  const query = useMemo(() => ({ assignee: user?.id || '' }), [user]);

  const fetchTickets = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await axios.get('/api/tickets', { params: query });
      setTickets(res.data);
    } finally { setLoading(false); }
  }, [query, user]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">My Assignments</h2>
        <p className="text-sm text-gray-500">Tickets assigned to you (single or multiple).</p>
      </div>
      {loading ? <div className="text-gray-500">Loading…</div> : <TicketTable tickets={tickets} onRefresh={fetchTickets} />}
    </div>
  );
}
