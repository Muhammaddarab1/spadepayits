import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axiosInstance.js';
import BackButton from '../components/BackButton.jsx';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignmentData, setAssignmentData] = useState({ inventoryId: '', assignmentType: 'Rental' });
  const [replacingId, setReplacingId] = useState(null);

  const loadCustomer = async () => {
    try {
      const res = await axios.get(`/api/customers/${id}`);
      setCustomer(res.data);
    } catch (e) {
      setError('Failed to load customer details');
    }
  };

  const loadInventory = async () => {
    try {
      const res = await axios.get('/api/inventory');
      setInventory(res.data.filter(item => item.availableQuantity > 0));
    } catch (e) {
      console.error('Failed to load inventory');
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadCustomer(), loadInventory()]);
      setLoading(false);
    };
    init();
  }, [id]);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignmentData.inventoryId) return;
    setAssigning(true);
    try {
      await axios.post(`/api/customers/${id}/devices/assign`, assignmentData);
      setAssignmentData({ inventoryId: '', assignmentType: 'Rental' });
      await Promise.all([loadCustomer(), loadInventory()]);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to assign device');
    } finally {
      setAssigning(false);
    }
  };

  const handleReturn = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to return this device?')) return;
    try {
      await axios.post(`/api/customers/${id}/devices/return`, { assignmentId });
      await Promise.all([loadCustomer(), loadInventory()]);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to return device');
    }
  };

  const handleReplace = async (e) => {
    e.preventDefault();
    if (!assignmentData.inventoryId) return;
    setAssigning(true);
    try {
      await axios.post(`/api/customers/${id}/devices/replace`, {
        oldAssignmentId: replacingId,
        newInventoryId: assignmentData.inventoryId,
        assignmentType: assignmentData.assignmentType
      });
      setAssignmentData({ inventoryId: '', assignmentType: 'Rental' });
      setReplacingId(null);
      await Promise.all([loadCustomer(), loadInventory()]);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to replace device');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Loading customer details...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!customer) return <div className="p-8 text-center text-gray-500">Customer not found</div>;

  const sections = [
    {
      title: 'Basic Information',
      fields: [
        { label: 'Account Status', value: customer.status },
        { label: 'Customer ID', value: customer.customerId },
        { label: 'Legal Business Name', value: customer.legalName },
        { label: 'DBA Name', value: customer.dba },
        { label: 'MID', value: customer.merchantId },
        { label: 'Sales Code', value: customer.salesCode },
        { label: 'Partner Type', value: customer.partnerType },
        { label: 'Created Date', value: customer.createdDate ? new Date(customer.createdDate).toLocaleDateString() : 'N/A' },
      ]
    },
    {
      title: 'Account Details',
      fields: [
        { label: 'Back End Platform', value: customer.backEndPlatform },
        { label: 'MCC Description', value: customer.mccDescription },
        { label: 'MCC', value: customer.mcc },
        { label: 'Transaction Method', value: customer.transactionMethod },
        { label: 'Account Id', value: customer.accountId },
        { label: 'Date Boarded', value: customer.dateBoarded ? new Date(customer.dateBoarded).toLocaleDateString() : 'N/A' },
        { label: 'Account Type', value: customer.accountType },
      ]
    },
    {
      title: 'Contact Information',
      fields: [
        { label: 'Contact Name', value: customer.contactName },
        { label: 'Owner Name', value: customer.ownerName },
        { label: 'Phone', value: customer.phone },
        { label: 'Email', value: customer.email },
      ]
    },
    {
      title: 'Address Information',
      fields: [
        { label: 'Business Address', value: customer.businessAddress },
        { label: 'Business City', value: customer.businessCity },
        { label: 'Business State', value: customer.businessState },
        { label: 'Business Zip', value: customer.businessZip },
        { label: 'Mailing Address', value: customer.mailingAddress },
      ]
    },
    {
      title: 'Partner & Status',
      fields: [
        { label: 'Partner Name', value: customer.partnerName },
        { label: 'Status Reason', value: customer.statusReason },
        { label: 'Diligence Decline Status', value: customer.diligenceDeclineStatus },
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h2 className="text-2xl font-bold text-slateText">{customer.dba}</h2>
            <p className="text-sm text-gray-500">MID: {customer.merchantId}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/tickets/new', {
            state: {
              mid: customer.merchantId,
              dba: customer.dba,
              contactPerson: customer.contactName || customer.ownerName || '',
              contactNumber: customer.phone || '',
              notes: `Customer Details:\nLegal Name: ${customer.legalName}\nEmail: ${customer.email}\nAddress: ${customer.businessAddress}, ${customer.businessCity}, ${customer.businessState} ${customer.businessZip}`
            }
          })}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          Create Ticket
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((s, idx) => (
          <div key={idx} className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-bold text-slateText mb-4 border-b pb-2">{s.title}</h3>
            <div className="grid grid-cols-1 gap-4">
              {s.fields.map((f, fIdx) => (
                <div key={fIdx} className="flex justify-between border-b border-gray-50 pb-1 last:border-0">
                  <span className="text-gray-500 text-sm">{f.label}:</span>
                  <span className="text-slateText font-medium text-sm">{f.value || 'N/A'}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Device Assignment Section */}
        <div className="bg-white p-6 rounded-lg border shadow-sm md:col-span-2">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="text-lg font-bold text-slateText">Assigned Devices / Equipment</h3>
            {!replacingId && (
              <form onSubmit={handleAssign} className="flex gap-2 items-end">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Select Device</label>
                  <select 
                    className="text-sm border rounded p-1"
                    value={assignmentData.inventoryId}
                    onChange={(e) => setAssignmentData({ ...assignmentData, inventoryId: e.target.value })}
                  >
                    <option value="">-- Choose Device --</option>
                    {inventory.map(item => (
                      <option key={item._id} value={item._id}>{item.deviceName} ({item.availableQuantity} available)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Type</label>
                  <select 
                    className="text-sm border rounded p-1"
                    value={assignmentData.assignmentType}
                    onChange={(e) => setAssignmentData({ ...assignmentData, assignmentType: e.target.value })}
                  >
                    <option value="Rental">Rental</option>
                    <option value="Purchased">Purchased</option>
                  </select>
                </div>
                <button 
                  type="submit" 
                  disabled={assigning || !assignmentData.inventoryId}
                  className="bg-primary text-white text-sm px-3 py-1 rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  {assigning ? 'Assigning...' : 'Assign'}
                </button>
              </form>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customer.assignedDevices?.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-4 text-center text-sm text-gray-500">No devices assigned yet.</td>
                  </tr>
                ) : (
                  customer.assignedDevices.map((d) => (
                    <tr key={d._id} className={d.status === 'Replaced' ? 'bg-gray-50 text-gray-400' : ''}>
                      <td className="px-4 py-2 text-sm font-medium">{d.deviceName}</td>
                      <td className="px-4 py-2 text-sm">{d.assignmentType}</td>
                      <td className="px-4 py-2 text-sm">{new Date(d.assignmentDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          d.status === 'Active' ? 'bg-green-100 text-green-700' : 
                          d.status === 'Replaced' ? 'bg-gray-200 text-gray-600' : 
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right space-x-2">
                        {d.status === 'Active' && (
                          <>
                            <button 
                              onClick={() => setReplacingId(d._id)}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Replace
                            </button>
                            <button 
                              onClick={() => handleReturn(d._id)}
                              className="text-xs text-red-600 hover:underline"
                            >
                              Return
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Replacement Modal/Overlay */}
      {replacingId && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h4 className="text-lg font-bold mb-4">Replace Device</h4>
            <p className="text-sm text-gray-600 mb-4">
              Replacing: <strong>{customer.assignedDevices.find(d => d._id === replacingId)?.deviceName}</strong>
            </p>
            <form onSubmit={handleReplace} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Select New Device</label>
                <select 
                  className="mt-1 block w-full border rounded p-2"
                  value={assignmentData.inventoryId}
                  onChange={(e) => setAssignmentData({ ...assignmentData, inventoryId: e.target.value })}
                  required
                >
                  <option value="">-- Choose New Device --</option>
                  {inventory.map(item => (
                    <option key={item._id} value={item._id}>{item.deviceName} ({item.availableQuantity} available)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">New Assignment Type</label>
                <select 
                  className="mt-1 block w-full border rounded p-2"
                  value={assignmentData.assignmentType}
                  onChange={(e) => setAssignmentData({ ...assignmentData, assignmentType: e.target.value })}
                >
                  <option value="Rental">Rental</option>
                  <option value="Purchased">Purchased</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => { setReplacingId(null); setAssignmentData({ inventoryId: '', assignmentType: 'Rental' }); }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={assigning || !assignmentData.inventoryId}
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  {assigning ? 'Replacing...' : 'Confirm Replacement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
