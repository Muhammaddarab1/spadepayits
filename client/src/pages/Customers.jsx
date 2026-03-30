import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axiosInstance.js';
import { useAuth } from '../context/AuthContext.jsx';
import * as XLSX from 'xlsx';

export default function Customers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
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
      const dataArr = new Uint8Array(evt.target.result);
      const wb = XLSX.read(dataArr, { type: 'array' });
      
      // Try to find the first sheet with data
      let ws = null;
      for (const sheetName of wb.SheetNames) {
        const sheet = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (rows.length > 0) {
          ws = sheet;
          break;
        }
      }

      if (!ws) {
        setError('The Excel file appears to be empty.');
        return;
      }

      const data = XLSX.utils.sheet_to_json(ws);
      if (data.length === 0) {
        setError('No data rows found in the Excel file.');
        return;
      }

      // Map Excel column names to our schema based on required headers
      const mappedData = data.map(row => {
        // Create a normalized version of the row for easier matching
        const normalizedRow = {};
        Object.keys(row).forEach(key => {
          normalizedRow[key.toString().trim()] = row[key];
        });

        const getVal = (exactKey) => {
          // Try exact match first on normalized key
          if (normalizedRow[exactKey] !== undefined) return normalizedRow[exactKey];
          
          // Try case-insensitive match on normalized keys
          const foundKey = Object.keys(normalizedRow).find(
            k => k.toLowerCase() === exactKey.toLowerCase()
          );
          return foundKey ? normalizedRow[foundKey] : '';
        };

        return {
          status: String(getVal('Account Status') || 'Active'),
          customerId: String(getVal('Customer ID') || ''),
          legalName: String(getVal('Legal Business Name') || ''),
          dba: String(getVal('DBA Name') || ''),
          merchantId: String(getVal('MID') || getVal('Merchant ID') || getVal('Reporting MID') || getVal('MerchantId') || ''),
          salesCode: String(getVal('Sales Code') || ''),
          partnerType: String(getVal('Partner Type') || ''),
          createdDate: getVal('Created Date') ? new Date(getVal('Created Date')) : null,
          backEndPlatform: String(getVal('Back End Platform') || ''),
          mccDescription: String(getVal('MCC Description') || ''),
          mcc: String(getVal('MCC') || ''),
          transactionMethod: String(getVal('Transaction Method') || ''),
          accountId: String(getVal('Account Id') || getVal('Account ID') || getVal('Account ID') || ''),
          contactName: String(getVal('Contact Name') || ''),
          phone: String(getVal('Phone') || ''),
          email: String(getVal('Email') || ''),
          businessAddress: String(getVal('Business Address') || ''),
          businessCity: String(getVal('Business City') || ''),
          businessState: String(getVal('Business State') || ''),
          businessZip: String(getVal('Business Zip') || getVal('Zip') || ''),
          mailingAddress: String(getVal('Mailing Address') || ''),
          ownerName: String(getVal('Owner Name') || ''),
          accountType: String(getVal('Account Type') || ''),
          dateBoarded: getVal('Date Boarded') ? new Date(getVal('Date Boarded')) : null,
          partnerName: String(getVal('Partner Name') || ''),
          statusReason: String(getVal('Status Reason') || ''),
          diligenceDeclineStatus: String(getVal('Diligence Decline Status') || ''),
        };
      }).filter(c => c.merchantId); // Only require merchantId (MID) as it's the unique identifier

      setImportData(mappedData);
      setShowImport(true);
    };
    reader.readAsArrayBuffer(file);
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
                    <th className="px-3 py-2 text-left">DBA Name</th>
                    <th className="px-3 py-2 text-left">Account Status</th>
                    <th className="px-3 py-2 text-left">Legal Business Name</th>
                    <th className="px-3 py-2 text-left">Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {importData.map((c, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-mono">{c.merchantId}</td>
                      <td className="px-3 py-2">{c.dba}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {c.status}
                        </span>
                      </td>
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

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider border-b">
            <tr>
              <th className="px-4 py-3 text-left">Account Status</th>
              <th className="px-4 py-3 text-left">Legal Business Name</th>
              <th className="px-4 py-3 text-left">DBA Name</th>
              <th className="px-4 py-3 text-left">MID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.map((customer) => (
              <tr 
                key={customer._id} 
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/customers/${customer._id}`)}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                    customer.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {customer.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-slateText">{customer.legalName}</td>
                <td className="px-4 py-3 text-gray-600">{customer.dba}</td>
                <td className="px-4 py-3 text-gray-500 font-mono">{customer.merchantId}</td>
              </tr>
            ))}
            {customers.length === 0 && !loading && (
              <tr>
                <td colSpan="4" className="px-4 py-8 text-center text-gray-400">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
