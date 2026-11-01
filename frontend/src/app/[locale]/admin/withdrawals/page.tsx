'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminWithdrawals({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  
  // Modal State
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
  }, [router, locale, user.id, user.role]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/admin/withdrawals`);
      const data = await res.json();
      if (data.success) setRequests(data.requests);
    } catch (err) {
      console.error("Failed to fetch", err);
    } finally { 
      setLoading(false); 
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm(`Are you sure you want to APPROVE this request? The user will be paid.`)) return;
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
    if (!rejectReason.trim()) return alert('Please enter a reason for rejection.');
    
    try {
      const res = await fetch(`${apiUrl}/api/admin/withdrawals/${id}/status`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'rejected', 
          adminId: user.id, 
          rejectionReason: rejectReason
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setSelectedRequest(null);
      setRejectingId(null);
      setRejectReason('');
      fetchRequests();
    } catch (err: any) { alert(err.message); }
  };

  const filteredRequests = requests.filter(r => r.status === activeTab);

  const getBankInfo = (req: any) => {
    try {
      if (req.bankDetailsSnapshot) return JSON.parse(req.bankDetailsSnapshot);
    } catch (e) {}
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
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">Withdrawal Requests</h1>
          <p className="text-gray-400 font-medium">Review and process user withdrawals.</p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
          <button onClick={fetchRequests} className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-[#131825] text-gray-300 border border-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            Refresh
          </button>
          
          <div className="bg-[#131825] p-1 rounded-xl border border-gray-800 flex gap-1 flex-1 xl:flex-none">
            {['pending', 'approved', 'rejected'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 xl:flex-none px-4 py-2 rounded-lg text-xs font-bold capitalize transition ${activeTab === tab ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#131825] rounded-3xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-gray-300 min-w-[800px]">
            <thead className="bg-[#0B0F19] text-[10px] uppercase font-bold text-gray-500">
              <tr>
                <th className="px-6 py-4 rounded-l-xl">User</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Bank</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 rounded-r-xl">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {filteredRequests.map((req: any) => (
                <tr 
                  key={req.id} 
                  onClick={() => { setSelectedRequest(req); setRejectingId(null); setRejectReason(''); }}
                  className="cursor-pointer hover:bg-white/5 transition-colors"
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
                      req.status === 'pending' 
                        ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' 
                        : req.status === 'approved' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400">
                    {req.status === 'pending' 
                      ? new Date(req.createdAt).toLocaleString() 
                      : new Date(req.updatedAt || req.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
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
              
              {/* Amounts */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0B0F19] p-4 rounded-xl border border-gray-800">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Amount Requested</p>
                  <p className="text-xl font-black text-white">ETB {selectedRequest.amountRequested}</p>
                </div>
                <div className="bg-[#0B0F19] p-4 rounded-xl border border-gray-800">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">To Receive (Net)</p>
                  <p className="text-xl font-black text-emerald-400">ETB {selectedRequest.amountToReceive}</p>
                </div>
              </div>

              {/* User Info */}
              <div className="bg-[#0B0F19] p-4 rounded-xl border border-gray-800">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">User Information</p>
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

              {/* Bank Info */}
              <div className="bg-[#0B0F19] p-4 rounded-xl border border-gray-800">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Bank Transfer Details</p>
                <p className="text-sm font-bold text-white">{getBankInfo(selectedRequest).bankName}</p>
                <p className="text-sm text-gray-400">{getBankInfo(selectedRequest).accountHolder}</p>
                <p className="text-sm font-mono font-bold text-[#B519FF] mt-1">{getBankInfo(selectedRequest).accountNumber}</p>
              </div>

              {/* Timeline */}
              <div className="bg-[#0B0F19] p-4 rounded-xl border border-gray-800 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Opened At</p>
                  <p className="text-xs text-gray-300 font-medium">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                </div>
                {selectedRequest.status !== 'pending' && selectedRequest.updatedAt && (
                  <div className="flex justify-between items-center border-t border-gray-800 pt-2">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Closed At</p>
                    <p className="text-xs text-gray-300 font-medium">{new Date(selectedRequest.updatedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* Rejection Reason */}
              {selectedRequest.status === 'rejected' && selectedRequest.rejectionReason && (
                <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-300">{selectedRequest.rejectionReason}</p>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="p-6 bg-[#0B0F19] border-t border-gray-800">
              {selectedRequest.status === 'approved' ? (
                <div className="text-center bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                  <p className="text-sm font-bold text-emerald-400 mb-1">✅ Approved & Paid</p>
                  <p className="text-xs text-gray-500">Successfully processed.</p>
                </div>
              ) : selectedRequest.status === 'rejected' ? (
                <div className="text-center bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                  <p className="text-sm font-bold text-red-400 mb-1">❌ Rejected & Refunded</p>
                  <p className="text-xs text-gray-500">Funds returned to user's wallet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rejectingId === selectedRequest.id ? (
                    <div className="bg-[#131825] p-4 rounded-xl border border-red-500/30">
                      <p className="text-sm font-bold text-red-400 mb-2">Reason for Rejection</p>
                      <div className="relative mb-3">
                        <textarea 
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-red-500 h-20 resize-none"
                          required
                        />
                        {!rejectReason && <span className="absolute left-3 top-3 text-sm text-gray-500 pointer-events-none">Explain why this is rejected...</span>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleRejectSubmit(selectedRequest.id)} className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-bold hover:bg-red-700 transition">Confirm Reject</button>
                        <button onClick={() => setRejectingId(null)} className="flex-1 bg-gray-800 text-gray-300 py-2.5 rounded-lg font-bold hover:bg-gray-700 transition">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button onClick={() => handleApprove(selectedRequest.id)} className="flex-1 bg-emerald-500 text-white p-4 rounded-xl font-bold hover:bg-emerald-600 transition shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        Approve & Pay
                      </button>
                      <button onClick={() => setRejectingId(selectedRequest.id)} className="flex-1 bg-red-500/10 text-red-400 border border-red-500/20 p-4 rounded-xl font-bold hover:bg-red-500/20 transition">
                        Reject
                      </button>
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