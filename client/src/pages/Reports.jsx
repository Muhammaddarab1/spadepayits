import { useEffect, useState } from 'react';
import axios from '../api/axiosInstance.js';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Reports
 * Centralized reporting hub (Admin/authorized users).
 * - Download ticket reports as CSV or PDF
 * - Display lightweight graphs for ticket distribution
 */
export default function Reports() {
  const { user } = useAuth();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [month, setMonth] = useState('');
  const [summary, setSummary] = useState(null);
  const canGenerate = user?.role === 'Admin' || user?.permissions?.['reports.generate'];

  /**
   * download
   * Downloads a report in the requested format.
   * @param {string} path API path
   * @param {string} name Suggested file name
   * @param {'csv'|'pdf'} format Output format
   */
  const download = async (path, name, format) => {
    const res = await axios.get(path, { params: { format, start, end, month }, responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a'); a.href = url; a.download = name; a.click(); window.URL.revokeObjectURL(url);
  };
  /**
   * loadSummary
   * Loads ticket summary JSON for graphing.
   */
  const loadSummary = async () => {
    const res = await axios.get('/api/reports/tickets', { params: { format: 'json', start, end, month } });
    setSummary(res.data?.summary || null);
  };

  useEffect(() => {
    if (canGenerate) {
      loadSummary().catch(()=>{});
    }
  }, [canGenerate]);

  if (!canGenerate) return <div className="text-gray-500">No access</div>;
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Reports & Analytics</h2>
        <p className="text-sm text-gray-500">Download CSVs and view insights.</p>
      </div>
      <div className="bg-white border rounded p-4 space-y-3">
        <div className="grid md:grid-cols-3 gap-3">
          <div><label className="block text-xs text-gray-500">Month (YYYY-MM)</label><input value={month} onChange={(e)=>setMonth(e.target.value)} className="border rounded px-2 py-1 w-full" placeholder="2026-02" /></div>
          <div><label className="block text-xs text-gray-500">Start</label><input type="date" value={start} onChange={(e)=>setStart(e.target.value)} className="border rounded px-2 py-1 w-full" /></div>
          <div><label className="block text-xs text-gray-500">End</label><input type="date" value={end} onChange={(e)=>setEnd(e.target.value)} className="border rounded px-2 py-1 w-full" /></div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-500 mr-2">Downloads:</span>
          <button onClick={()=>download('/api/reports/tickets', 'ticket-summary.csv', 'csv')} className="px-3 py-1 rounded bg-gray-800 text-white">Tickets CSV</button>
          <button onClick={()=>download('/api/reports/tickets', 'ticket-summary.pdf', 'pdf')} className="px-3 py-1 rounded bg-gray-700 text-white">Tickets PDF</button>
          <button onClick={loadSummary} className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">Load Graphs</button>
        </div>
      </div>
      <Graphs summary={summary} />
    </div>
  );
}

/**
 * Graphs
 * Simple CSS bar charts for ticket distribution.
 * @param {{summary: Array<{status:string, priority:string, isDeleted:boolean, count:number}>}} param0
 */
function Graphs({ summary }) {
  if (!summary) {
    return (
      <div className="text-sm text-gray-500">
        Load graphs to visualize ticket distribution by status and priority.
      </div>
    );
  }
  const totalsByStatus = summary.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + r.count;
    return acc;
  }, {});
  const max = Math.max(1, ...Object.values(totalsByStatus));
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="p-4 rounded border bg-white">
        <div className="text-sm font-medium mb-2">Tickets by Status</div>
        <div className="space-y-2">
          {Object.entries(totalsByStatus).map(([status, count]) => (
            <div key={status}>
              <div className="flex justify-between text-xs text-gray-600">
                <span>{status}</span><span>{count}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded">
                <div className="h-2 bg-blue-600 rounded" style={{ width: `${Math.round((count/max)*100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 rounded border bg-white">
        <div className="text-sm font-medium mb-2">Deleted vs Active</div>
        <div className="space-y-2">
          {['false','true'].map(flag => {
            const c = summary.filter(r => String(r.isDeleted) === flag).reduce((a,b)=>a+b.count,0);
            return (
              <div key={flag}>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{flag === 'true' ? 'Deleted' : 'Active'}</span><span>{c}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded">
                  <div className="h-2 bg-purple-600 rounded" style={{ width: `${Math.round((c/Math.max(1, c)) * 100)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
