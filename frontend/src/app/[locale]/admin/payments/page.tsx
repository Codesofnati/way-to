'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPayments({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open'); // ✅ Tab state
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  const adminUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  useEffect(() => {
    if (!adminUser.id) {
      router.push(`/${locale}/auth`);
      return;
    }
    fetchPayments();
  }, [router, locale, adminUser.id]);

  const fetchPayments = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/payments`);
      const data = await res.json();
      if (data.success) setPayments(data.payments);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: string) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  // ✅ Filter by Tab AND Search
  const filteredAndSortedPayments = payments
    .filter(p => {
      const isClosed = p.status === 'approved';
      // Hide if it doesn't match the active tab
      if (activeTab === 'open' && isClosed) return false;
      if (activeTab === 'closed' && !isClosed) return false;

      // Search filter
      const searchLower = searchQuery.toLowerCase();
      return (
        p.id.toLowerCase().includes(searchLower) ||
        p.ftNumber.toLowerCase().includes(searchLower) ||
        p.userId?.phone?.toLowerCase().includes(searchLower) ||
        p.payment_method.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === 'phone') { aVal = a.userId?.phone || ''; bVal = b.userId?.phone || ''; }
      if (sortConfig.key === 'amount') { aVal = parseFloat(aVal); bVal = parseFloat(bVal); }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const handleApprove = async (paymentId: string) => {
    if (!confirm("Are you sure this payment is correct? This will add to the user's wallet.")) return;

    const res = await fetch(`${apiUrl}/api/admin/payments/${paymentId}/approve`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId: adminUser.id })
    });
    const data = await res.json();
    
    if (data.success) {
      alert('Payment approved! Wallet updated.');
      setSelectedPayment(null);
      fetchPayments(); // Refresh the list
    } else {
      alert(data.error);
    }
  };

  const handleUpdateName = async (userId: string, currentName: string) => {
    const newName = prompt("Enter new name for this user:", currentName);
    if (!newName || newName === currentName) return;
    await fetch(`${apiUrl}/api/admin/users/${userId}/name`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName })
    });
    alert('User name updated!');
    fetchPayments();
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading payments...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Payment Approvals</h1>
          <p className="text-gray-500 font-medium">Review and close pending payment tickets.</p>
        </div>
        
        {/* ✅ TABS */}
        <div className="bg-white p-1 rounded-2xl shadow-sm border border-gray-100 flex gap-1">
          <button 
            onClick={() => setActiveTab('open')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition ${activeTab === 'open' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Open Approvals
          </button>
          <button 
            onClick={() => setActiveTab('closed')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition ${activeTab === 'closed' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Closed Approvals
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <input 
          type="text" 
          placeholder="Search by ID, Phone, FT Number, or Method..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]"
        />
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
              <tr>
                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('id')}>Ticket ID ↕</th>
                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('phone')}>Phone ↕</th>
                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('amount')}>Amount ↕</th>
                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('payment_method')}>Method ↕</th>
                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('ftNumber')}>FT Number ↕</th>
                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('createdAt')}>Date ↕</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAndSortedPayments.map((p: any) => {
                const isClosed = p.status === 'approved';
                return (
                  <tr 
                    key={p.id} 
                    onClick={() => setSelectedPayment(p)}
                    className="cursor-pointer transition-colors hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 font-mono text-xs">{p.id.split('-')[0]}...</td>
                    <td className="px-6 py-4 font-medium">{p.userId?.phone || 'N/A'}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">ETB {p.amount}</td>
                    <td className="px-6 py-4">{p.payment_method}</td>
                    <td className="px-6 py-4 font-mono">{p.ftNumber}</td>
                    <td className="px-6 py-4">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      {isClosed ? (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">Closed</span>
                      ) : (
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">Open</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredAndSortedPayments.length === 0 && (
            <div className="p-8 text-center text-gray-500">No {activeTab} payments found.</div>
          )}
        </div>
      </div>

      {/* DETAIL & APPROVAL MODAL */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Ticket Details</h2>
              <button onClick={() => setSelectedPayment(null)} className="text-gray-400 hover:text-gray-900 font-bold text-xl">&times;</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Amount</p>
                  <p className="text-lg font-black text-[#B519FF]">ETB {selectedPayment.amount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Method</p>
                  <p className="text-lg font-bold text-gray-900">{selectedPayment.payment_method}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">FT Number</p>
                  <p className="font-mono text-sm text-gray-800">{selectedPayment.ftNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Date</p>
                  <p className="text-sm text-gray-800">{new Date(selectedPayment.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-500 font-bold uppercase mb-2">User Information</p>
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border">
                  <div>
                    <p className="font-bold text-gray-900">{selectedPayment.userId?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{selectedPayment.userId?.phone}</p>
                  </div>
                  <button onClick={() => handleUpdateName(selectedPayment.userId?.id, selectedPayment.userId?.name)} className="text-xs font-bold text-[#B519FF] hover:underline">Edit Name</button>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <a href={selectedPayment.screenshotUrl} target="_blank" rel="noreferrer" className="block w-full text-center bg-gray-100 text-gray-800 py-3 rounded-xl font-bold hover:bg-gray-200 transition">
                  View Screenshot Proof ↗
                </a>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100">
              {selectedPayment.status === 'approved' ? (
                <div className="text-center bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <p className="text-sm font-bold text-emerald-600 mb-1">✅ Ticket Closed</p>
                  <p className="text-xs text-gray-500">This payment has been approved and added to the user's wallet.</p>
                </div>
              ) : (
                <button onClick={() => handleApprove(selectedPayment.id)} className="w-full bg-black text-white p-4 rounded-xl font-bold hover:bg-gray-800 transition flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  Approve & Close Ticket
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}