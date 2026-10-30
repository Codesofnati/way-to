'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminWithdrawals({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  
  // ✅ Modal State
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
      
      setSelectedRequest(null); // Close modal
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

  // Helper to safely parse bank info
  const getBankInfo = (req: any) => {
    try {
      if (req.bankDetailsSnapshot) return JSON.parse(req.bankDetailsSnapshot);
    } catch (e) {}
    return { bankName: 'Unknown Bank', accountHolder: 'Unknown', accountNumber: 'Unknown' };
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading requests...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Withdrawal Requests</h1>
          <p className="text-gray-500 font-medium">Review and process user withdrawals.</p>
        </div>
        
        <div className="flex gap-2">
          <button onClick={fetchRequests} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 transition">
            ↻ Refresh
          </button>
          
          <div className="bg-white p-1 rounded-2xl shadow-sm border border-gray-100 flex gap-1">
            {['pending', 'approved', 'rejected'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-2 rounded-xl text-sm font-bold capitalize transition ${activeTab === tab ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ✅ COMPACT LIST VIEW */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Bank</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRequests.map((req: any) => (
                <tr 
                  key={req.id} 
                  onClick={() => { setSelectedRequest(req); setRejectingId(null); setRejectReason(''); }}
                  className="cursor-pointer hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{req.userName}</p>
                    <p className="text-xs text-gray-500">{req.userPhone}</p>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">ETB {req.amountRequested}</td>
                  <td className="px-6 py-4">{getBankInfo(req).bankName}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase ${req.status === 'pending' ? 'bg-orange-100 text-orange-700' : req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs">
                    {req.status === 'pending' 
                      ? new Date(req.createdAt).toLocaleString() 
                      : new Date(req.updatedAt || req.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRequests.length === 0 && (
            <div className="p-8 text-center text-gray-500">No {activeTab} requests found.</div>
          )}
        </div>
      </div>

      {/* ✅ DETAIL MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
            
            <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-xl font-bold text-gray-900">Withdrawal Details</h2>
              <button onClick={() => setSelectedRequest(null)} className="text-gray-400 hover:text-gray-900 font-bold text-xl">&times;</button>
            </div>

            <div className="p-6 space-y-4">
              
              {/* User & Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Amount Requested</p>
                  <p className="text-lg font-black text-[#B519FF]">ETB {selectedRequest.amountRequested}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">To Receive (After Tax)</p>
                  <p className="text-lg font-black text-emerald-600">ETB {selectedRequest.amountToReceive}</p>
                </div>
                <div className="col-span-2 bg-gray-50 p-3 rounded-xl border">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">User Information</p>
                  <p className="font-bold text-gray-900">{selectedRequest.userName}</p>
                  <p className="text-sm text-gray-600">{selectedRequest.userPhone}</p>
                </div>
              </div>

              {/* Bank Info */}
              <div className="bg-gray-50 p-3 rounded-xl border">
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Bank Transfer Details</p>
                <p className="text-sm font-bold text-gray-900">{getBankInfo(selectedRequest).bankName}</p>
                <p className="text-sm text-gray-700">{getBankInfo(selectedRequest).accountHolder}</p>
                <p className="text-sm font-mono font-bold text-[#B519FF]">{getBankInfo(selectedRequest).accountNumber}</p>
              </div>

              {/* ✅ Times */}
              <div className="col-span-2 bg-gray-50 p-3 rounded-xl border">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs text-gray-500 font-bold uppercase">Opened At</p>
                  <p className="text-sm text-gray-800 font-medium">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                </div>
                {selectedRequest.status !== 'pending' && selectedRequest.updatedAt && (
                  <div className="flex justify-between items-center border-t border-gray-200 pt-1 mt-1">
                    <p className="text-xs text-gray-500 font-bold uppercase">Closed At</p>
                    <p className="text-sm text-gray-800 font-medium">{new Date(selectedRequest.updatedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* ✅ Rejection Reason if rejected */}
              {selectedRequest.status === 'rejected' && selectedRequest.rejectionReason && (
                <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                  <p className="text-xs font-bold text-red-600 uppercase mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-800">{selectedRequest.rejectionReason}</p>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-100">
              {selectedRequest.status === 'approved' ? (
                <div className="text-center bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <p className="text-sm font-bold text-emerald-600 mb-1">✅ Approved & Paid</p>
                  <p className="text-xs text-gray-500">This withdrawal was successfully processed.</p>
                </div>
              ) : selectedRequest.status === 'rejected' ? (
                <div className="text-center bg-red-50 p-4 rounded-xl border border-red-100">
                  <p className="text-sm font-bold text-red-600 mb-1">❌ Rejected & Refunded</p>
                  <p className="text-xs text-gray-500">The funds were returned to the user's wallet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rejectingId === selectedRequest.id ? (
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                      <p className="text-sm font-bold text-red-700 mb-2">Reason for Rejection</p>
                      <textarea 
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Explain why this is rejected..."
                        className="w-full p-3 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 h-20 resize-none mb-3"
                        required
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleRejectSubmit(selectedRequest.id)} className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700">Confirm Reject</button>
                        <button onClick={() => setRejectingId(null)} className="flex-1 bg-white border border-gray-200 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-50">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(selectedRequest.id)} className="flex-1 bg-emerald-600 text-white p-4 rounded-xl font-bold hover:bg-emerald-700 transition">
                        Approve & Paid
                      </button>
                      <button onClick={() => setRejectingId(selectedRequest.id)} className="flex-1 bg-red-50 text-red-600 p-4 rounded-xl font-bold hover:bg-red-100 transition">
                        Reject & Refund
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