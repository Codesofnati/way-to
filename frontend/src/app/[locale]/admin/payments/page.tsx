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

  // Admin Performance Dashboard State
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const adminUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const isSuperAdmin = userRole === 'super_admin';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

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

  const filteredAndSortedPayments = payments
    .filter(p => {
      const isClosed = p.status !== 'pending';
      
      if (activeTab === 'open' && isClosed) return false;
      if (activeTab === 'closed' && !isClosed) return false;

      if (!isSuperAdmin && activeTab === 'closed') {
        const approvedBy = JSON.parse(p.approvedBy_admins || '[]');
        if (!approvedBy.includes(adminUser.id)) return false; 
      }

      if (filterMode === 'assigned' && activeTab === 'open') {
        const isMyName = p.assignedTo === adminName;
        const isUnassigned = !p.assignedTo;
        if (!isMyName && !isUnassigned) return false;
      }

      if (isSuperAdmin && activeTab === 'closed' && selectedAdminFilter !== 'all') {
        const approvedBy = JSON.parse(p.approvedBy_admins || '[]');
        if (!approvedBy.includes(selectedAdminFilter)) return false;
      }

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

  if (loading && payments.length === 0) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-400">
      <div className="w-10 h-10 border-4 border-[#B519FF] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-bold tracking-widest uppercase text-xs">Loading Payments...</p>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">Payment Approvals</h1>
          <p className="text-gray-400 font-medium">Review and close pending payment tickets.</p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
          <button 
            onClick={() => fetchPayments(true)} 
            disabled={refreshing}
            className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-[#131825] text-gray-300 border border-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 transition disabled:opacity-70"
          >
            <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          <div className="bg-[#131825] p-1 rounded-xl border border-gray-800 flex gap-1 flex-1 xl:flex-none">
            <button 
              onClick={() => setFilterMode('all')}
              className={`flex-1 xl:flex-none px-4 py-2 rounded-lg text-xs font-bold transition ${filterMode === 'all' ? 'bg-[#B519FF] text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
              All Tickets
            </button>
            <button 
              onClick={() => setFilterMode('assigned')}
              className={`flex-1 xl:flex-none px-4 py-2 rounded-lg text-xs font-bold transition ${filterMode === 'assigned' ? 'bg-[#B519FF] text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
              Assigned
            </button>
          </div>

          <div className="bg-[#131825] p-1 rounded-xl border border-gray-800 flex gap-1 flex-1 xl:flex-none">
            <button 
              onClick={() => setActiveTab('open')}
              className={`flex-1 xl:flex-none px-6 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'open' ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
              Open
            </button>
            <button 
              onClick={() => setActiveTab('closed')}
              className={`flex-1 xl:flex-none px-6 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'closed' ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
              Closed
            </button>
          </div>
        </div>
      </div>

      {/* SUPER ADMIN PERFORMANCE DASHBOARD */}
      {isSuperAdmin && activeTab === 'closed' && (
        <div className="bg-[#131825] p-6 rounded-3xl border border-gray-800 space-y-6">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Admin Performance</h2>
              <p className="text-sm text-gray-400">See how many tickets each admin has processed.</p>
            </div>
            
            <div className="bg-[#0B0F19] p-2 rounded-xl border border-gray-700 flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
              <div className="relative w-full sm:w-auto">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-transparent px-3 py-1.5 text-sm font-medium text-white outline-none" />
                {!startDate && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">Start Date</span>}
              </div>
              <span className="text-gray-500 text-xs font-bold hidden sm:block">to</span>
              <div className="relative w-full sm:w-auto">
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-transparent px-3 py-1.5 text-sm font-medium text-white outline-none" />
                {!endDate && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">End Date</span>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {performanceData.map(admin => (
              <div key={admin.adminId} className="bg-[#0B0F19] p-5 rounded-2xl border border-gray-800">
                <div className="font-bold text-white mb-4 flex items-center gap-2">
  <div className="w-6 h-6 rounded-full bg-[#B519FF]/20 text-[#B519FF] flex items-center justify-center text-xs font-black">
    {admin.adminName.charAt(0).toUpperCase()}
  </div>
  {admin.adminName}
</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-[#131825] p-2 rounded-lg border border-gray-800">
                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-1">Daily</p>
                    <p className="font-bold text-[#B519FF]">{admin.daily} Tickets</p>
                  </div>
                  <div className="bg-[#131825] p-2 rounded-lg border border-gray-800">
                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-1">Weekly</p>
                    <p className="font-bold text-[#B519FF]">{admin.weekly} Tickets</p>
                  </div>
                  <div className="bg-[#131825] p-2 rounded-lg border border-gray-800">
                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-1">Monthly</p>
                    <p className="font-bold text-[#B519FF]">{admin.monthly} Tickets</p>
                  </div>
                  {(startDate && endDate) && (
                    <div className="bg-[#131825] p-2 rounded-lg border border-[#B519FF]/30">
                      <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-1">Custom</p>
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
        <div className="bg-[#131825] p-4 rounded-2xl border border-gray-800 flex flex-col sm:flex-row items-center gap-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Filter by Admin:</p>
          <select 
            value={selectedAdminFilter}
            onChange={(e) => setSelectedAdminFilter(e.target.value)}
            className="w-full sm:w-auto p-2 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm font-medium text-white outline-none focus:border-[#B519FF]"
          >
            <option value="all">All Admins</option>
            {admins.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-[#131825] p-2 rounded-2xl border border-gray-800">
        <div className="relative">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 pl-10 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-white focus:border-[#B519FF] outline-none transition-colors"
          />
          {!searchQuery && (
            <span className="absolute left-10 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
              Search by ID, Phone, FT Number, Method, or Assigned Name...
            </span>
          )}
          <svg className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#131825] rounded-3xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-gray-300 min-w-[1000px]">
            <thead className="bg-[#0B0F19] text-[10px] uppercase font-bold text-gray-500">
              <tr>
                <th className="px-6 py-4 cursor-pointer hover:text-white transition" onClick={() => handleSort('id')}>Ticket ID ↕</th>
                <th className="px-6 py-4 cursor-pointer hover:text-white transition" onClick={() => handleSort('phone')}>Phone ↕</th>
                <th className="px-6 py-4 cursor-pointer hover:text-white transition" onClick={() => handleSort('amount')}>Amount ↕</th>
                <th className="px-6 py-4">Assigned To</th>
                <th className="px-6 py-4 cursor-pointer hover:text-white transition" onClick={() => handleSort('payment_method')}>Method ↕</th>
                <th className="px-6 py-4 cursor-pointer hover:text-white transition" onClick={() => handleSort('ftNumber')}>FT Number ↕</th>
                <th className="px-6 py-4 cursor-pointer hover:text-white transition" onClick={() => handleSort(activeTab === 'closed' ? 'updatedAt' : 'createdAt')}>
                  {activeTab === 'closed' ? 'Closed Date ↕' : 'Opened Date ↕'}
                </th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {currentPayments.map((p: any) => {
                const isClosed = p.status !== 'pending';
                const isMyName = p.assignedTo === adminName; 
                
                return (
                  <tr 
                    key={p.id} 
                    onClick={() => { setSelectedPayment(p); setShowRejectInput(false); setRejectReason(''); }}
                    className={`cursor-pointer transition-colors hover:bg-white/5 ${isMyName && !isClosed ? 'bg-orange-500/5' : ''}`}
                  >
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{p.id.split('-')[0]}...</td>
                    <td className="px-6 py-4 font-medium text-white">{p.userId?.phone || 'N/A'}</td>
                    <td className="px-6 py-4 font-bold text-emerald-400">ETB {p.amount}</td>
                    <td className="px-6 py-4">
                      {isMyName ? (
                        <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-1 rounded-md text-[10px] font-bold">Me ({p.assignedTo})</span>
                      ) : p.assignedTo ? (
                        <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded-md text-[10px] font-bold">{p.assignedTo}</span>
                      ) : (
                        <span className="text-gray-600 text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{p.payment_method}</td>
                    <td className="px-6 py-4 font-mono text-xs max-w-[150px] break-all">{p.ftNumber}</td>
                    <td className="px-6 py-4 text-xs">
                      {activeTab === 'closed' && p.updatedAt 
                        ? new Date(p.updatedAt).toLocaleString() 
                        : new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {p.status === 'approved' ? (
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[10px] font-bold">Approved</span>
                      ) : p.status === 'rejected' ? (
                        <span className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md text-[10px] font-bold">Rejected</span>
                      ) : (
                        <span className="px-2.5 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-md text-[10px] font-bold">Open</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredAndSortedPayments.length === 0 && (
            <div className="p-12 text-center text-gray-500">No {activeTab} payments found.</div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 p-6 border-t border-gray-800">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className="px-4 py-2 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm font-bold text-white disabled:opacity-50 hover:bg-gray-800 transition">Prev</button>
            <span className="text-sm font-bold text-gray-500">Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} className="px-4 py-2 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm font-bold text-white disabled:opacity-50 hover:bg-gray-800 transition">Next</button>
          </div>
        )}
      </div>

      {/* DETAIL & APPROVAL MODAL */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#131825] rounded-3xl border border-gray-700 shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#0B0F19]">
              <h2 className="text-xl font-bold text-white">Ticket Details</h2>
              <button onClick={() => setSelectedPayment(null)} className="w-8 h-8 rounded-full bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center transition">&times;</button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Ticket ID</p>
                <p className="font-mono text-xs text-gray-300 break-all bg-[#0B0F19] p-2 rounded-lg border border-gray-800">{selectedPayment.id}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Amount</p>
                  <p className="text-2xl font-black text-[#B519FF]">ETB {selectedPayment.amount}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Method</p>
                  <p className="text-lg font-bold text-white">{selectedPayment.payment_method}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">FT Number</p>
                  <p className="font-mono text-sm text-white bg-[#0B0F19] p-2 rounded-lg border border-gray-800">{selectedPayment.ftNumber}</p>
                </div>

                {selectedPayment.assignedTo && (
                  <div className="col-span-2 bg-orange-500/10 p-3 rounded-xl border border-orange-500/20">
                    <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">Assigned Account</p>
                    <p className="text-sm font-bold text-orange-200">{selectedPayment.assignedTo}</p>
                  </div>
                )}

                <div className="col-span-2 bg-[#0B0F19] p-3 rounded-xl border border-gray-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Opened At</p>
                    <p className="text-xs text-gray-300 font-medium">{new Date(selectedPayment.createdAt).toLocaleString()}</p>
                  </div>
                  {selectedPayment.status !== 'pending' && selectedPayment.updatedAt && (
                    <div className="flex justify-between items-center border-t border-gray-800 pt-2 mt-2">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Closed At</p>
                      <p className="text-xs text-gray-300 font-medium">{new Date(selectedPayment.updatedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-800 pt-5">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">User Information</p>
                <div className="bg-[#0B0F19] p-4 rounded-xl border border-gray-800">
                  <p className="font-bold text-white text-lg">{selectedPayment.userId?.name || 'Unknown'}</p>
                  <p className="text-sm text-gray-400 font-mono mt-1">{selectedPayment.userId?.phone}</p>
                </div>
              </div>

           {selectedPayment.screenshotUrl && (
  <div className="border-t border-gray-800 pt-5">
    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Payment Proof (Screenshot)</p>
    <a href={selectedPayment.screenshotUrl} target="_blank" rel="noreferrer">
      <img 
        src={selectedPayment.screenshotUrl} 
        alt="Screenshot" 
        className="w-full rounded-xl border border-gray-700 object-contain max-h-80 bg-black hover:opacity-80 transition" 
      />
    </a>
  </div>
)}
            </div>

            <div className="p-6 bg-[#0B0F19] border-t border-gray-800">
              {selectedPayment.status === 'approved' ? (
                <div className="text-center bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                  <p className="text-sm font-bold text-emerald-400 mb-1">✅ Ticket Approved</p>
                  <p className="text-xs text-gray-500">Added to user's wallet.</p>
                </div>
              ) : selectedPayment.status === 'rejected' ? (
                <div className="text-center bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                  <p className="text-sm font-bold text-red-400 mb-1">❌ Ticket Rejected</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {!showRejectInput ? (
                    <div className="flex gap-3">
                      <button onClick={() => handleApprove(selectedPayment.id)} className="flex-1 bg-emerald-500 text-white p-4 rounded-xl font-bold hover:bg-emerald-600 transition shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        Approve
                      </button>
                      <button onClick={() => setShowRejectInput(true)} className="flex-1 bg-red-500/10 text-red-400 border border-red-500/20 p-4 rounded-xl font-bold hover:bg-red-500/20 transition">
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="bg-[#131825] p-4 rounded-xl border border-red-500/30">
                      <p className="text-sm font-bold text-red-400 mb-2">Reason for Rejection</p>
                      <textarea 
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-red-500 h-24 resize-none transition-colors"
                        required
                      />
                      {!rejectReason && <span className="text-xs text-gray-500 absolute mt-2 ml-1">Tell the user why this payment is rejected...</span>}
                      <div className="flex gap-2 mt-4">
                        <button onClick={() => handleReject(selectedPayment.id)} className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-bold hover:bg-red-700 transition">Confirm Reject</button>
                        <button onClick={() => setShowRejectInput(false)} className="flex-1 bg-gray-800 text-gray-300 py-2.5 rounded-lg font-bold hover:bg-gray-700 transition">Cancel</button>
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