import { useEffect, useState } from 'react';
import axios from '../api/axiosInstance.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function InventoryManagement() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    deviceName: '',
    totalQuantity: 0,
    availableQuantity: 0,
    assignedQuantity: 0,
    faultyQuantity: 0,
    underInspectionQuantity: 0
  });

  const loadInventory = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/inventory');
      setInventory(res.data);
    } catch (e) {
      setError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/inventory', formData);
      setShowAddModal(false);
      setFormData({
        deviceName: '',
        totalQuantity: 0,
        availableQuantity: 0,
        assignedQuantity: 0,
        faultyQuantity: 0,
        underInspectionQuantity: 0
      });
      loadInventory();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save device');
    }
  };

  const handleInspect = async (inventoryId, result) => {
    try {
      await axios.post('/api/customers/devices/inspect', { inventoryId, result });
      loadInventory();
    } catch (e) {
      setError('Failed to process inspection');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this device from inventory?')) return;
    try {
      await axios.delete(`/api/inventory/${id}`);
      loadInventory();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to delete device');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Add New Device
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError('')} className="float-right font-bold">&times;</button>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device Name / Model</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faulty</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Under Inspection</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="7" className="px-6 py-4 text-center">Loading...</td></tr>
            ) : inventory.length === 0 ? (
              <tr><td colSpan="7" className="px-6 py-4 text-center">No devices found in inventory.</td></tr>
            ) : (
              inventory.map((item) => (
                <tr key={item._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.deviceName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.totalQuantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">{item.availableQuantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{item.assignedQuantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{item.faultyQuantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                    {item.underInspectionQuantity}
                    {item.underInspectionQuantity > 0 && (
                      <div className="mt-1 space-x-2">
                        <button 
                          onClick={() => handleInspect(item._id, 'OK')}
                          className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded hover:bg-green-200"
                        >
                          Mark OK
                        </button>
                        <button 
                          onClick={() => handleInspect(item._id, 'Faulty')}
                          className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded hover:bg-red-200"
                        >
                          Mark Faulty
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setFormData(item);
                        setShowAddModal(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                {formData._id ? 'Edit Device' : 'Add New Device'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Device Name / Model</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={formData.deviceName}
                    onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Qty</label>
                    <input
                      type="number"
                      required
                      min="0"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                      value={formData.totalQuantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setFormData({ ...formData, totalQuantity: val, availableQuantity: val });
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Available Qty</label>
                    <input
                      type="number"
                      required
                      min="0"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                      value={formData.availableQuantity}
                      onChange={(e) => setFormData({ ...formData, availableQuantity: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assigned Qty</label>
                    <input
                      type="number"
                      required
                      min="0"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                      value={formData.assignedQuantity}
                      onChange={(e) => setFormData({ ...formData, assignedQuantity: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Faulty Qty</label>
                    <input
                      type="number"
                      required
                      min="0"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                      value={formData.faultyQuantity}
                      onChange={(e) => setFormData({ ...formData, faultyQuantity: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
