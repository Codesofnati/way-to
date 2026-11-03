'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminWithdrawals({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // ✅ Added refreshing state
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  useEffect(() => {
    if (!user.id || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return router.push(`/${locale}/auth`);
    }
    fetchRequests();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchRequests(true), 30000);
    return () => clearInterval(interval);
  }, [router, locale, user.id, user.role]);

  // ✅ Updated to handle visual refreshing state
  const fetchRequests = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/withdrawals`);
      const data = await res.json();
      if (data.success) setRequests(data.requests);
    } catch (err) {
      console.error("Failed to fetch", err);
    } finally { 
      setLoading(false); 
      setRefreshing(false);
    }
  };

  const handleRowClick = async (req: any) => {
    if (req.status !== 'pending') {
      setSelectedRequest(req); setRejectingId(null); setRejectReason('');
      return;
    }

    const isLocked = req.lockedBy && req.lockedBy !== user.id;
    const isLockValid = req.lockedAt && (new Date().getTime() - new Date(req.lockedAt).getTime() < 1 * 60 * 1000);

    if (isLocked && isLockValid) {
      return alert(`Currently being reviewed by ${req.lockedByName || 'another admin'}`);
    }

    try {
      const res = await fetch(`${apiUrl}/api/admin/withdrawals/${req.id}/lock`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: user.id })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      setSelectedRequest(req); setRejectingId(null); setRejectReason('');
      fetchRequests(); 
    } catch (err: any) {
      alert(err.message); 
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm(`Are you sure you want to APPROVE this request?`)) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/withdrawals/${id}/status`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved', adminId: user.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setSelectedRequest(null);
      fetchRequests();
    } catch (err: any) { alert(err.message); }
  };

  const handleRejectSubmit = async (id: string) => {
    if (!rejectReason.trim()) return alert('Please enter a reason.');
    try {
      const res = await fetch(`${apiUrl}/api/admin/withdrawals/${id}/status`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', adminId: user.id, rejectionReason: rejectReason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setSelectedRequest(null); setRejectingId(null); setRejectReason('');
      fetchRequests();
    } catch (err: any) { alert(err.message); }
  };

  const filteredRequests = requests.filter((req) => {
    if (activeTab === 'pending') return req.status === 'pending';
    return req.status === activeTab && req.approvedBy === user.id;
  });

  const getBankInfo = (req: any) => {
    try { if (req.bankDetailsSnapshot) return JSON.parse(req.bankDetailsSnapshot); } catch (e) {}
    return { bankName: 'Unknown Bank', accountHolder: 'Unknown', accountNumber: 'Unknown' };
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-400">
      <div className="w-10 h-10 border-4 border-[#B519FF] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-bold tracking-widest uppercase text-xs">Loading Requests...</p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
            {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">Withdrawals</h1>
          <p className="text-gray-400 font-medium">Review and process user withdrawals.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          
          {/* ✅ Beautiful & Compact Refresh Button */}
          <button 
            onClick={() => fetchRequests(true)} 
            disabled={refreshing}
            className="flex items-center justify-center gap-2 bg-[#131825] text-gray-300 border border-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 hover:border-gray-600 transition disabled:opacity-70 w-auto shrink-0"
          >
            <svg className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#B519FF]' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            {refreshing ? 'Syncing...' : 'Refresh'}
          </button>
          
          {/* Tabs */}
          <div className="bg-[#131825] p-1 rounded-xl border border-gray-800 flex gap-1 flex-1 xl:flex-none">
            {['pending', 'approved', 'rejected'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 xl:flex-none px-4 py-2 rounded-lg text-xs font-bold capitalize transition ${activeTab === tab ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table with subtle loading overlay */}
      <div className={`bg-[#131825] rounded-3xl border border-gray-800 overflow-hidden transition-opacity duration-300 ${refreshing ? 'opacity-50' : 'opacity-100'}`}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-gray-300 min-w-[900px]">
            <thead className="bg-[#0B0F19] text-[10px] uppercase font-bold text-gray-500">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Bank</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Handled By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {filteredRequests.map((req: any) => {
                const isLockValid = req.lockedAt && (new Date().getTime() - new Date(req.lockedAt).getTime() < 1 * 60 * 1000);
                const isLockedByOther = req.lockedBy && req.lockedBy !== user.id && req.status === 'pending' && isLockValid;
                
                return (
                  <tr 
                    key={req.id} 
                    onClick={() => handleRowClick(req)}
                    className={`transition-colors ${
                      isLockedByOther ? 'opacity-50 cursor-not-allowed bg-red-500/5' : 'cursor-pointer hover:bg-white/5'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-white">{req.userName}</p>
                      <p className="text-xs text-gray-400">{req.userPhone}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-400">ETB {req.amountRequested}</td>
                    <td className="px-6 py-4">
                      <span className="bg-gray-800 text-gray-300 px-2.5 py-1 rounded-md text-[10px] font-bold border border-gray-700">
                        {getBankInfo(req).bankName}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest border ${
                        req.status === 'pending' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {req.status === 'pending' ? new Date(req.createdAt).toLocaleString() : new Date(req.updatedAt || req.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold">
                      {isLockedByOther ? (
                        <span className="text-red-400 flex items-center gap-1">
                          🔒 {req.lockedByName || 'Admin'}
                        </span>
                      ) : req.status === 'pending' ? (
                        <span className="text-gray-500">Unassigned</span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-1">
                          ✅ Processed
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredRequests.length === 0 && (
            <div className="p-12 text-center text-gray-500 bg-[#0B0F19] border-t border-gray-800">
              No {activeTab} requests found.
            </div>
          )}
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#131825] rounded-3xl border border-gray-700 shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#0B0F19]">
              <h2 className="text-xl font-bold text-white">Withdrawal Details</h2>
              <button onClick={() => setSelectedRequest(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:text-white transition text-xl font-bold">&times;</button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0B0F19] p-4 rounded-xl border border-gray-800">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Amount Requested</p>
                  <p className="text-xl font-black text-white">ETB {selectedRequest.amountRequested}</p>
                </div>
                <div className="bg-[#0B0F19] p-4 rounded-xl border border-gray-800">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">To Receive</p>
                  <p className="text-xl font-black text-emerald-400">ETB {selectedRequest.amountToReceive}</p>
                </div>
              </div>

              <div className="bg-[#0B0F19] p-4 rounded-xl border border-gray-800">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">User</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold border border-gray-700">
                    {selectedRequest.userName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-white">{selectedRequest.userName}</p>
                    <p className="text-xs text-gray-400">{selectedRequest.userPhone}</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#0B0F19] p-4 rounded-xl border border-gray-800">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Bank Details</p>
                <p className="text-sm font-bold text-white">{getBankInfo(selectedRequest).bankName}</p>
                <p className="text-sm text-gray-400">{getBankInfo(selectedRequest).accountHolder}</p>
                <p className="text-sm font-mono font-bold text-[#B519FF] mt-1">{getBankInfo(selectedRequest).accountNumber}</p>
              </div>

              {selectedRequest.status === 'rejected' && selectedRequest.rejectionReason && (
                <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-300">{selectedRequest.rejectionReason}</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-[#0B0F19] border-t border-gray-800">
              {selectedRequest.status === 'approved' ? (
                <div className="text-center bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                  <p className="text-sm font-bold text-emerald-400 mb-1">✅ Approved & Paid</p>
                </div>
              ) : selectedRequest.status === 'rejected' ? (
                <div className="text-center bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                  <p className="text-sm font-bold text-red-400 mb-1">❌ Rejected & Refunded</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rejectingId === selectedRequest.id ? (
                    <div className="bg-[#131825] p-4 rounded-xl border border-red-500/30">
                      <p className="text-sm font-bold text-red-400 mb-2">Reason for Rejection</p>
                      <textarea 
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-red-500 h-20 resize-none"
                        required
                      />
                      {!rejectReason && <span className="absolute text-xs text-gray-500 mt-[-70px] ml-3 pointer-events-none">Explain why...</span>}
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => handleRejectSubmit(selectedRequest.id)} className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-bold">Confirm</button>
                        <button onClick={() => setRejectingId(null)} className="flex-1 bg-gray-800 text-gray-300 py-2.5 rounded-lg font-bold">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button onClick={() => handleApprove(selectedRequest.id)} className="flex-1 bg-emerald-500 text-white p-4 rounded-xl font-bold hover:bg-emerald-600 transition">Approve</button>
                      <button onClick={() => setRejectingId(selectedRequest.id)} className="flex-1 bg-red-500/10 text-red-400 border border-red-500/20 p-4 rounded-xl font-bold hover:bg-red-500/20 transition">Reject</button>
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