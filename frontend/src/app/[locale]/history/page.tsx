'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function UserHistory({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'deposits' | 'withdrawals'>('deposits');

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  const isAmharic = locale === 'am';

  useEffect(() => {
    if (!user.id) return router.push(`/${locale}/auth`);

    const fetchHistory = async () => {
      try {
        const [depositRes, withdrawRes] = await Promise.all([
          fetch(`${apiUrl}/api/user/${user.id}/my-payments`).then(res => res.json()),
          fetch(`${apiUrl}/api/user/${user.id}/my-withdrawals`).then(res => res.json())
        ]);
        
        if (depositRes.success) setDeposits(depositRes.payments || []);
        if (withdrawRes.success) setWithdrawals(withdrawRes.requests || []);
      } catch (err) {
        console.error("History fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [router, locale, user.id, apiUrl]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E4E79]"></div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-24 relative overflow-hidden">
      
      {/* ✅ Decorative Background Blur - Updated to Deep Blue */}
      <div className="absolute top-0 right-[-20%] w-64 h-64 bg-[#1E4E79]/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-[-20%] w-64 h-64 bg-[#15608D]/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center justify-center pt-6">
        <div className="relative">
          {/* ✅ Glow updated to deep blue */}
          <div className="absolute inset-0 bg-[#1E4E79] blur-xl opacity-40 rounded-[1.5rem]"></div>
          {/* ✅ Updated gradient */}
          <div className="w-20 h-20 bg-gradient-to-tr from-[#1E4E79] to-[#15608D] rounded-[1.5rem] flex items-center justify-center shadow-lg border-2 border-white relative z-10 mb-3 transform transition hover:scale-105 duration-300">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight text-center">
          {isAmharic ? 'የግብይት ታሪክ' : 'Transaction History'}
        </h1>
        <p className="text-sm font-medium text-gray-500 mt-1 text-center max-w-md mx-auto">
          {isAmharic ? 'የገንዘብ ማስገቢያዎችን እና ማውጣቶችን ሁኔታ ይመልከቱ።' : 'View the status of your deposits and withdrawals.'}
        </p>
      </div>

      {/* ✅ Tabs - Updated active state to Deep Blue */}
      <div className="bg-white/60 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-gray-100 inline-flex w-full max-w-sm mx-auto relative z-10">
        <button 
          onClick={() => setActiveTab('deposits')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'deposits' ? 'bg-[#1E4E79] text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          {isAmharic ? 'ማስገቢያዎች' : 'Deposits'}
        </button>
        <button 
          onClick={() => setActiveTab('withdrawals')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'withdrawals' ? 'bg-[#1E4E79] text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          {isAmharic ? 'ማውጣቶች' : 'Withdrawals'}
        </button>
      </div>

      {/* Deposits List */}
      {activeTab === 'deposits' && (
        <div className="space-y-3 relative z-10 animate-in fade-in duration-300">
          {deposits.length === 0 && (
            <div className="text-center p-12 bg-white/50 rounded-[2rem] border border-dashed border-gray-200">
              <p className="text-gray-500 font-medium">{isAmharic ? 'ምንም የማስገቢያ ታሪክ አልተገኘም።' : 'No deposit history found.'}</p>
            </div>
          )}
          
          {deposits.map((dep: any) => (
            <div key={dep.id} className="bg-white/90 backdrop-blur-md p-5 rounded-[1.5rem] shadow-sm border border-gray-100 space-y-3 hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-black text-xl text-gray-900">ETB {dep.amount}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {isAmharic ? 'በ' : 'Via'} <span className="font-bold text-gray-700">{dep.payment_method}</span> • FT: <span className="font-mono text-xs">{dep.ftNumber}</span>
                  </p>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mt-2">{new Date(dep.createdAt).toLocaleString()}</p>
                </div>
                <span className={`text-[10px] font-bold px-3 py-1.5 rounded-md uppercase tracking-wider ${
                  dep.status === 'pending' ? 'bg-orange-100 text-orange-700' : dep.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  {dep.status === 'pending' ? (isAmharic ? 'በመጠባበቅ ላይ' : 'pending') : dep.status === 'approved' ? (isAmharic ? 'ተፈቅዷል' : 'approved') : (isAmharic ? 'ተቀባይነት አላገኘም' : 'rejected')}
                </span>
              </div>
              
              {/* Rejection Reason */}
              {dep.status === 'rejected' && dep.rejectionReason && (
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-start gap-2">
                  <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  <div>
                    <p className="text-[10px] font-bold text-red-600 uppercase mb-0.5">
                      {isAmharic ? 'የተቀባይነት ያላገኘበት ምክንያት' : 'Rejection Reason'}
                    </p>
                    <p className="text-sm text-red-800">{dep.rejectionReason}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Withdrawals List */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-3 relative z-10 animate-in fade-in duration-300">
          {withdrawals.length === 0 && (
            <div className="text-center p-12 bg-white/50 rounded-[2rem] border border-dashed border-gray-200">
              <p className="text-gray-500 font-medium">{isAmharic ? 'ምንም የማውጣት ታሪክ አልተገኘም።' : 'No withdrawal history found.'}</p>
            </div>
          )}
          
          {withdrawals.map((wd: any) => (
            <div key={wd.id} className="bg-white/90 backdrop-blur-md p-5 rounded-[1.5rem] shadow-sm border border-gray-100 space-y-3 hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-black text-xl text-gray-900">ETB {wd.amountRequested}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {isAmharic ? 'የሚቀበሉት:' : 'You Receive:'} {/* ✅ Updated receive amount to deep blue */}
                    <span className="font-black text-[#1E4E79] ml-1">ETB {wd.amountToReceive}</span>
                  </p>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mt-2">{new Date(wd.createdAt).toLocaleString()}</p>
                </div>
                <span className={`text-[10px] font-bold px-3 py-1.5 rounded-md uppercase tracking-wider ${
                  wd.status === 'pending' ? 'bg-orange-100 text-orange-700' : wd.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  {wd.status === 'pending' ? (isAmharic ? 'በመጠባበቅ ላይ' : 'pending') : wd.status === 'approved' ? (isAmharic ? 'ተፈቅዷል' : 'approved') : (isAmharic ? 'ተቀባይነት አላገኘም' : 'rejected')}
                </span>
              </div>

              {/* Rejection Reason */}
              {wd.status === 'rejected' && wd.rejectionReason && (
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-start gap-2">
                  <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  <div>
                    <p className="text-[10px] font-bold text-red-600 uppercase mb-0.5">
                      {isAmharic ? 'የተቀባይነት ያላገኘበት ምክንያት' : 'Rejection Reason'}
                    </p>
                    <p className="text-sm text-red-800">{wd.rejectionReason}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}