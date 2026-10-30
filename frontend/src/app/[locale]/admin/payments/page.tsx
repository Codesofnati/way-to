'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPayments({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [payments, setPayments] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [userRole, setUserRole] = useState('admin');
  const [adminName, setAdminName] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open');
  const [filterMode, setFilterMode] = useState<'all' | 'assigned'>('all');
  const [selectedAdminFilter, setSelectedAdminFilter] = useState('all'); 
  
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [sortConfig, setSortConfig] = useState({ key: 'updatedAt', direction: 'desc' });
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ Admin Performance Dashboard State
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const adminUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const isSuperAdmin = userRole === 'super_admin';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  // Initial Data Fetch
  useEffect(() => {
    if (!adminUser.id) {
      router.push(`/${locale}/auth`);
      return;
    }
    fetchPayments();
    
    if (adminUser.role === 'super_admin') {
      fetch(`${apiUrl}/api/super-admin/analytics`)
        .then(res => res.json())
        .then(data => { if (data.success) setAdmins(data.admins); });
    }
  }, [router, locale, adminUser.id]);

  // ✅ Fetch Performance Data (When Dates Change or Tab changes)
  useEffect(() => {
    if (!isSuperAdmin || activeTab !== 'closed') return;
    
    let url = `${apiUrl}/api/super-admin/admin-performance`;
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;

    fetch(url)
      .then(res => res.json())
      .then(data => { if (data.success) setPerformanceData(data.performance); });
  }, [apiUrl, isSuperAdmin, startDate, endDate, activeTab]);

  const fetchPayments = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/api/admin/payments?adminId=${adminUser.id}`);
      const data = await res.json();
      if (data.success) {
        setPayments(data.payments);
        setUserRole(data.userRole);
        setAdminName(data.adminName);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSort = (key: string) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  // Filter Logic
  const filteredAndSortedPayments = payments
    .filter(p => {
      const isClosed = p.status !== 'pending';
      
      // 1. Tab Filter
      if (activeTab === 'open' && isClosed) return false;
      if (activeTab === 'closed' && !isClosed) return false;

      // 2. Admin Rule: Closed tickets must only be the ones they approved
      if (!isSuperAdmin && activeTab === 'closed') {
        const approvedBy = JSON.parse(p.approvedBy_admins || '[]');
        if (!approvedBy.includes(adminUser.id)) return false; 
      }

      // 3. Filter Mode (All vs Assigned) - only for OPEN tickets
      if (filterMode === 'assigned' && activeTab === 'open') {
        const isMyName = p.assignedTo === adminName;
        const isUnassigned = !p.assignedTo;
        if (!isMyName && !isUnassigned) return false;
      }

      // 4. Super Admin Admin Filter
      if (isSuperAdmin && activeTab === 'closed' && selectedAdminFilter !== 'all') {
        const approvedBy = JSON.parse(p.approvedBy_admins || '[]');
        if (!approvedBy.includes(selectedAdminFilter)) return false;
      }

      // 5. Search Filter
      const searchLower = searchQuery.toLowerCase();
      return (
        p.id.toLowerCase().includes(searchLower) ||
        p.ftNumber.toLowerCase().includes(searchLower) ||
        p.userId?.phone?.toLowerCase().includes(searchLower) ||
        p.payment_method.toLowerCase().includes(searchLower) ||
        (p.assignedTo && p.assignedTo.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === 'createdAt' || sortConfig.key === 'updatedAt') {
        aVal = new Date(aVal || a.createdAt).getTime();
        bVal = new Date(bVal || b.createdAt).getTime();
      } else if (sortConfig.key === 'phone') { 
        aVal = a.userId?.phone || ''; 
        bVal = b.userId?.phone || ''; 
      } else if (sortConfig.key === 'amount') { 
        aVal = parseFloat(aVal); 
        bVal = parseFloat(bVal); 
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPayments = filteredAndSortedPayments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAndSortedPayments.length / itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [activeTab, searchQuery, filterMode, selectedAdminFilter]);

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
      fetchPayments(true);
    } else {
      alert(data.error);
    }
  };

  const handleReject = async (paymentId: string) => {
    if (!rejectReason.trim()) return alert('Please enter a reason for rejection.');
    
    try {
      const res = await fetch(`${apiUrl}/api/admin/payments/${paymentId}/reject`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason, adminId: adminUser.id })
      });
      const data = await res.json();
      
      if (data.success) {
        alert('Payment rejected.');
        setSelectedPayment(null);
        setShowRejectInput(false);
        setRejectReason('');
        fetchPayments(true);
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading && payments.length === 0) return <div className="p-8 text-center text-gray-500">Loading payments...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Payment Approvals</h1>
          <p className="text-gray-500 font-medium">Review and close pending payment tickets.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => fetchPayments(true)} 
            disabled={refreshing}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 transition disabled:opacity-70"
          >
            <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          {/* Filter Mode Toggle */}
          <div className="bg-white p-1 rounded-2xl shadow-sm border border-gray-100 flex gap-1">
            <button 
              onClick={() => setFilterMode('all')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition ${filterMode === 'all' ? 'bg-[#B519FF] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              All Tickets
            </button>
            <button 
              onClick={() => setFilterMode('assigned')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition ${filterMode === 'assigned' ? 'bg-[#B519FF] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Assigned to Me
            </button>
          </div>

          {/* Open / Closed Tabs */}
          <div className="bg-white p-1 rounded-2xl shadow-sm border border-gray-100 flex gap-1">
            <button 
              onClick={() => setActiveTab('open')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition ${activeTab === 'open' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Open
            </button>
            <button 
              onClick={() => setActiveTab('closed')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition ${activeTab === 'closed' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Closed
            </button>
          </div>
        </div>
      </div>

      {/* ✅ SUPER ADMIN PERFORMANCE DASHBOARD */}
      {isSuperAdmin && activeTab === 'closed' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Admin Performance (Closed Tickets)</h2>
              <p className="text-sm text-gray-500">See how many tickets each admin has processed.</p>
            </div>
            
            {/* Date Picker */}
            <div className="bg-gray-50 p-2 rounded-2xl border border-gray-200 flex items-center gap-2">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white px-3 py-2 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#B519FF]" />
              <span className="text-gray-400 text-sm font-bold">to</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-white px-3 py-2 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#B519FF]" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {performanceData.map(admin => (
              <div key={admin.adminId} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="font-bold text-gray-900 mb-3">{admin.adminName}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Daily</p>
                    <p className="font-bold text-[#B519FF]">{admin.daily} Tickets</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Weekly</p>
                    <p className="font-bold text-[#B519FF]">{admin.weekly} Tickets</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Monthly</p>
                    <p className="font-bold text-[#B519FF]">{admin.monthly} Tickets</p>
                  </div>
                  {(startDate && endDate) && (
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Custom</p>
                      <p className="font-bold text-[#B519FF]">{admin.custom} Tickets</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isSuperAdmin && activeTab === 'closed' && (
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center gap-4">
          <p className="text-sm font-bold text-blue-800">Filter by Admin:</p>
          <select 
            value={selectedAdminFilter}
            onChange={(e) => setSelectedAdminFilter(e.target.value)}
            className="p-2 bg-white border border-blue-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">All Admins</option>
            {admins.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <input 
          type="text" 
          placeholder="Search by ID, Phone, FT Number, Method, or Assigned Name..." 
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
                <th className="px-6 py-4">Assigned To</th>
                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('payment_method')}>Method ↕</th>
                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('ftNumber')}>FT Number ↕</th>
                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort(activeTab === 'closed' ? 'updatedAt' : 'createdAt')}>
                  {activeTab === 'closed' ? 'Closed Date ↕' : 'Opened Date ↕'}
                </th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentPayments.map((p: any) => {
                const isClosed = p.status !== 'pending';
                const isMyName = p.assignedTo === adminName; 
                
                return (
                  <tr 
                    key={p.id} 
                    onClick={() => { setSelectedPayment(p); setShowRejectInput(false); setRejectReason(''); }}
                    className={`cursor-pointer transition-colors hover:bg-gray-50 ${isMyName && !isClosed ? 'bg-orange-50/30' : ''}`}
                  >
                    <td className="px-6 py-4 font-mono text-xs">{p.id.split('-')[0]}...</td>
                    <td className="px-6 py-4 font-medium">{p.userId?.phone || 'N/A'}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">ETB {p.amount}</td>
                    <td className="px-6 py-4">
                      {isMyName ? (
                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-md text-xs font-bold">Assigned to Me ({p.assignedTo})</span>
                      ) : p.assignedTo ? (
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs font-bold">{p.assignedTo}</span>
                      ) : (
                        <span className="text-gray-400 text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{p.payment_method}</td>
                    <td className="px-6 py-4 font-mono max-w-[150px] break-all">{p.ftNumber}</td>
                    <td className="px-6 py-4">
                      {activeTab === 'closed' && p.updatedAt 
                        ? new Date(p.updatedAt).toLocaleString() 
                        : new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {p.status === 'approved' ? (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">Approved</span>
                      ) : p.status === 'rejected' ? (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Rejected</span>
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

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 p-6 border-t border-gray-100">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-bold disabled:opacity-50">Prev</button>
            <span className="text-sm font-bold text-gray-500">Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-bold disabled:opacity-50">Next</button>
          </div>
        )}
      </div>

      {/* DETAIL & APPROVAL MODAL */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-xl font-bold text-gray-900">Ticket Details</h2>
              <button onClick={() => setSelectedPayment(null)} className="text-gray-400 hover:text-gray-900 font-bold text-xl">&times;</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Ticket ID</p>
                <p className="font-mono text-sm text-gray-800 break-all">{selectedPayment.id}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Amount</p>
                  <p className="text-lg font-black text-[#B519FF]">ETB {selectedPayment.amount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Method</p>
                  <p className="text-lg font-bold text-gray-900">{selectedPayment.payment_method}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 font-bold uppercase">FT Number</p>
                  <p className="font-mono text-sm text-gray-800 break-all">{selectedPayment.ftNumber}</p>
                </div>

                {selectedPayment.assignedTo && (
                  <div className="col-span-2 bg-orange-50 p-3 rounded-xl border border-orange-100">
                    <p className="text-xs text-orange-600 font-bold uppercase">Assigned To Account</p>
                    <p className="text-sm font-bold text-orange-900">{selectedPayment.assignedTo}</p>
                  </div>
                )}

                <div className="col-span-2 bg-gray-50 p-3 rounded-xl border">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs text-gray-500 font-bold uppercase">Opened At</p>
                    <p className="text-sm text-gray-800 font-medium">{new Date(selectedPayment.createdAt).toLocaleString()}</p>
                  </div>
                  {selectedPayment.status !== 'pending' && selectedPayment.updatedAt && (
                    <div className="flex justify-between items-center border-t border-gray-200 pt-1 mt-1">
                      <p className="text-xs text-gray-500 font-bold uppercase">Closed At</p>
                      <p className="text-sm text-gray-800 font-medium">{new Date(selectedPayment.updatedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-500 font-bold uppercase mb-2">User Information</p>
                <div className="bg-gray-50 p-3 rounded-xl border">
                  <p className="font-bold text-gray-900">{selectedPayment.userId?.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">{selectedPayment.userId?.phone}</p>
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
                  <p className="text-sm font-bold text-emerald-600 mb-1">✅ Ticket Approved</p>
                  <p className="text-xs text-gray-500">This payment was approved and added to the user's wallet.</p>
                </div>
              ) : selectedPayment.status === 'rejected' ? (
                <div className="text-center bg-red-50 p-4 rounded-xl border border-red-100">
                  <p className="text-sm font-bold text-red-600 mb-1">❌ Ticket Rejected</p>
                  <p className="text-xs text-gray-500">This payment was rejected.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {!showRejectInput ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(selectedPayment.id)} className="flex-1 bg-emerald-600 text-white p-4 rounded-xl font-bold hover:bg-emerald-700 transition">
                        Approve & Close
                      </button>
                      <button onClick={() => setShowRejectInput(true)} className="flex-1 bg-red-50 text-red-600 p-4 rounded-xl font-bold hover:bg-red-100 transition">
                        Reject Ticket
                      </button>
                    </div>
                  ) : (
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                      <p className="text-sm font-bold text-red-700 mb-2">Reason for Rejection</p>
                      <textarea 
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Tell the user why this payment is rejected..."
                        className="w-full p-3 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 h-24 resize-none"
                        required
                      />
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => handleReject(selectedPayment.id)} className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700">Confirm Reject</button>
                        <button onClick={() => setShowRejectInput(false)} className="flex-1 bg-white border border-gray-200 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-50">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}