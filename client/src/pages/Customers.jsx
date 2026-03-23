import { useEffect, useState, useRef } from 'react';
import axios from '../api/axiosInstance.js';
import { useAuth } from '../context/AuthContext.jsx';
import * as XLSX from 'xlsx';

export default function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importData, setImportData] = useState([]);
  const fileInputRef = useRef(null);

  const canEdit = user?.role === 'Admin' || user?.permissions?.['users.manage'];

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/customers?search=${search}`);
      setCustomers(res.data);
    } catch (e) {
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      // Map common Excel column names to our schema based on provided headers
      const mappedData = data.map(row => ({
        status: String(row['Account Status'] || 'Active'),
        customerId: String(row['Customer ID'] || ''),
        legalName: String(row['Legal Business Name'] || ''),
        dba: String(row['DBA Name'] || ''),
        merchantId: String(row['Reporting MID'] || ''),
        salesCode: String(row['Sales Code'] || ''),
        partnerType: String(row['Partner Type'] || ''),
        registrationDate: row['Registration Date'] ? new Date(row['Registration Date']) : null,
        backEndPlatform: String(row['Back End Platform'] || ''),
        mccDescription: String(row['MCC Description'] || ''),
        pricingType: String(row['Pricing Type'] || ''),
        pciCompliance: String(row['PCI Compliance'] || ''),
        mtdVolume: String(row['MTD Volume'] || ''),
        pciProgram: String(row['PCI Program'] || ''),
        // Fallbacks for optional fields
        email: row['Email'] || '',
        phone: row['Phone'] || '',
        address: row['Address'] || '',
        city: row['City'] || '',
        state: row['State'] || '',
        zipCode: String(row['Zip'] || ''),
        notes: row['Notes'] || '',
      })).filter(c => c.merchantId && c.dba); // Only keep valid entries

      setImportData(mappedData);
      setShowImport(true);
    };
    reader.readAsBinaryString(file);
    // Reset input so the same file can be uploaded again if needed
    e.target.value = '';
  };

  const handleImportConfirm = async () => {
    setLoading(true);
    try {
      await axios.post('/api/customers/import', { customers: importData });
      setShowImport(false);
      setImportData([]);
      load();
      alert(`Successfully imported ${importData.length} customers!`);
    } catch (e) {
      setError(e.response?.data?.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slateText">Customers</h2>
          <p className="text-sm text-gray-500">Manage merchant accounts and details.</p>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleExcelUpload} 
                className="hidden" 
                accept=".xlsx, .xls, .csv" 
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload Excel
              </button>
            </>
          )}
          <input
            type="text"
            placeholder="Search Merchant ID, DBA..."
            className="border rounded-lg px-3 py-2 text-sm w-64 focus:ring-2 focus:ring-primary/20 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {showImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slateText">Confirm Customer Import</h3>
              <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <p className="text-sm text-gray-500">We found {importData.length} customers in your file. Please review before importing.</p>
            
            <div className="flex-1 overflow-auto border rounded-lg">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">MID</th>
                    <th className="px-3 py-2 text-left">DBA</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Legal Name</th>
                    <th className="px-3 py-2 text-left">Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {importData.map((c, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2">{c.merchantId}</td>
                      <td className="px-3 py-2">{c.dba}</td>
                      <td className="px-3 py-2">{c.status}</td>
                      <td className="px-3 py-2 text-gray-500">{c.legalName}</td>
                      <td className="px-3 py-2 text-gray-500">{c.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setShowImport(false)} 
                className="px-6 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleImportConfirm} 
                disabled={loading}
                className="px-6 py-2 text-sm font-bold bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm"
              >
                {loading ? '⏳ Importing...' : 'Confirm & Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Customer List */}
        <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider border-b">
              <tr>
                <th className="px-4 py-3 text-left">Account Status</th>
                <th className="px-4 py-3 text-left">Reporting MID</th>
                <th className="px-4 py-3 text-left">DBA Name</th>
                <th className="px-4 py-3 text-left">Customer ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="4" className="px-4 py-8 text-center animate-pulse">Loading...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-400">No customers found</td></tr>
              ) : (
                customers.map((c) => (
                  <tr
                    key={c._id}
                    onClick={() => setSelected(c)}
                    className={`cursor-pointer hover:bg-blue-50/50 transition-colors ${selected?._id === c._id ? 'bg-blue-50 border-l-4 border-l-primary' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        c.status === 'Active' || c.status === 'Open' ? 'bg-green-100 text-success' : 
                        c.status === 'Pending' ? 'bg-yellow-100 text-warning' : 
                        'bg-red-100 text-danger'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slateText">{c.merchantId}</td>
                    <td className="px-4 py-3">{c.dba}</td>
                    <td className="px-4 py-3 text-gray-500">{c.customerId || 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Details Panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border shadow-sm p-6 sticky top-6">
            {!selected ? (
              <div className="text-center py-12 text-gray-400 flex flex-col items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p>Select a customer to view full details</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slateText">{selected.dba}</h3>
                    <p className="text-sm text-gray-500">{selected.merchantId}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                    selected.status === 'Active' ? 'bg-green-100 text-success' : 'bg-red-100 text-danger'
                  }`}>
                    {selected.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase block">Customer ID</label>
                    <span className="text-slateText">{selected.customerId || 'N/A'}</span>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase block">Sales Code</label>
                    <span className="text-slateText">{selected.salesCode || 'N/A'}</span>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase block">Partner Type</label>
                    <span className="text-slateText">{selected.partnerType || 'N/A'}</span>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase block">Pricing Type</label>
                    <span className="text-slateText">{selected.pricingType || 'N/A'}</span>
                  </div>
                  <div className="col-span-2 border-t pt-4">
                    <label className="text-[10px] text-gray-400 font-bold uppercase block">Legal Business Name</label>
                    <span className="text-slateText">{selected.legalName || 'N/A'}</span>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase block">Registration Date</label>
                    <span className="text-slateText">{selected.registrationDate ? new Date(selected.registrationDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase block">Back End Platform</label>
                    <span className="text-slateText">{selected.backEndPlatform || 'N/A'}</span>
                  </div>
                  <div className="col-span-2 border-t pt-4">
                    <label className="text-[10px] text-gray-400 font-bold uppercase block">MCC Description</label>
                    <span className="text-slateText">{selected.mccDescription || 'N/A'}</span>
                  </div>
                  <div className="col-span-2 border-t pt-4 grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase block">PCI Compliance</label>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selected.pciCompliance === 'Compliant' ? 'bg-green-100 text-success' : 'bg-red-100 text-danger'}`}>
                        {selected.pciCompliance || 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase block">MTD Volume</label>
                      <span className="text-slateText font-bold text-primary">{selected.mtdVolume || 'N/A'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase block">PCI Program</label>
                    <span className="text-slateText">{selected.pciProgram || 'N/A'}</span>
                  </div>
                </div>

                {selected.notes && (
                  <div className="pt-4 border-t">
                    <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Internal Notes</label>
                    <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      {selected.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
