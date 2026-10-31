'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function FundAnalytics({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  useEffect(() => {
    if (user.role !== 'super_admin') return router.push(`/${locale}/auth`);
    
    fetch(`${apiUrl}/api/super-admin/fund-analytics`)
      .then(res => res.json())
      .then(result => {
        if (result.success) setData(result.analytics);
      })
      .finally(() => setLoading(false));
  }, [router, locale, apiUrl, user.role]);

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-400">
      <div className="w-10 h-10 border-4 border-[#B519FF] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-bold tracking-widest uppercase text-xs">Loading Analytics...</p>
    </div>
  );

  if (!data) return (
    <div className="p-8 text-center text-red-400 font-bold bg-red-500/10 border border-red-500/20 rounded-2xl max-w-xl mx-auto mt-10">
      Failed to load data. Please check the backend.
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">Fund Analytics</h1>
        <p className="text-gray-400 font-medium">Track how users are investing in your fund plans.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        
        {/* Total Invested */}
        <div className="bg-gradient-to-br from-[#0B0F19] to-[#131825] p-6 rounded-3xl border border-[#B519FF]/30 relative overflow-hidden shadow-[0_0_20px_rgba(181,25,255,0.05)]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#B519FF]/10 rounded-full blur-3xl"></div>
          <h3 className="text-[10px] text-[#B519FF] bg-[#B519FF]/10 w-fit px-3 py-1 rounded-full uppercase font-bold tracking-widest mb-4 border border-[#B519FF]/20 relative z-10">Total Invested</h3>
          <p className="text-4xl font-black text-white relative z-10">ETB {data.totalInvested}</p>
        </div>
        
        {/* Real Users */}
        <div className="bg-[#131825] p-6 rounded-3xl border border-gray-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
          <h3 className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-4">Total Real Users Joined</h3>
          <p className="text-4xl font-black text-emerald-400">{data.totalUsersJoined}</p>
        </div>

        {/* Active Funds */}
        <div className="bg-[#131825] p-6 rounded-3xl border border-gray-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
          <h3 className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-4">Total Active Funds</h3>
          <p className="text-4xl font-black text-white">{data.fundStats.length}</p>
        </div>
      </div>

      {/* Detailed Breakdown Table */}
      <div className="bg-[#131825] rounded-3xl border border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          <h2 className="text-xl font-bold text-white">Fund Breakdown</h2>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar pb-2">
          <table className="w-full text-left text-sm text-gray-300 min-w-[800px]">
            <thead className="bg-[#0B0F19] text-[10px] uppercase font-bold text-gray-500">
              <tr>
                <th className="px-6 py-4">Fund Name</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Total Users (Real / Fake)</th>
                <th className="px-6 py-4">Total Invested</th>
                <th className="px-6 py-4">Start Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {data.fundStats.map((fund: any) => (
                <tr key={fund.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-white text-base">{fund.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{fund.durationDays} Days • {fund.interestRate}% / day</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest border ${
                      fund.status === 'Open' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                    }`}>
                      {fund.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-white text-lg">{fund.realJoinedUsers} <span className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">Real</span></p>
                    <p className="text-xs text-gray-500 mt-1">+ {fund.fakeJoinedUsers} Fake (UI: {fund.totalJoinedUI} / {fund.maxParticipants})</p>
                  </td>
                  <td className="px-6 py-4 font-black text-emerald-400 text-base">
                    ETB {fund.totalMoneyInFund}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400">
                    {new Date(fund.startDate).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.fundStats.length === 0 && (
            <div className="p-12 text-center text-gray-500 bg-[#0B0F19] border-t border-gray-800">
              No funds created yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}