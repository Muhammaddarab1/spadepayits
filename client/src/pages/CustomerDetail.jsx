import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axiosInstance.js';
import BackButton from '../components/BackButton.jsx';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCustomer = async () => {
      try {
        const res = await axios.get(`/api/customers/${id}`);
        setCustomer(res.data);
      } catch (e) {
        setError('Failed to load customer details');
      } finally {
        setLoading(false);
      }
    };
    loadCustomer();
  }, [id]);

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

      <div className="grid gap-6">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{section.title}</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {section.fields.map((field, fIdx) => (
                <div key={fIdx}>
                  <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">{field.label}</label>
                  <span className="text-sm text-slateText font-medium">{field.value || 'N/A'}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
