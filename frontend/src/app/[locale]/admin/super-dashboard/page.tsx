'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function SuperAdminAnalytics({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Date Filter State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  useEffect(() => {
    if (user.role !== 'super_admin') {
      router.push(`/${locale}/auth`);
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = `${apiUrl}/api/super-admin/analytics`;
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const result = await res.json();
      if (result.success) setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!data && loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-400">
      <div className="w-10 h-10 border-4 border-[#B519FF] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-bold tracking-widest uppercase text-xs">Loading Analytics...</p>
    </div>
  );
  
  if (!data) return (
    <div className="p-8 text-center text-red-400 font-bold bg-red-500/10 border border-red-500/20 rounded-2xl">
      Failed to load data. Please check the backend.
    </div>
  );

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      
      {/* Header & Date Picker */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B519FF]/10 text-[#B519FF] text-[10px] font-bold uppercase tracking-widest mb-3 border border-[#B519FF]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B519FF] animate-pulse"></span> Live Overview
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
            Less searching.<br />
            More <span className="text-[#B519FF] italic font-serif">managing.</span>
          </h1>
        </div>

        {/* Date Picker UI - Fixed Placeholders */}
        <div className="bg-[#131825] p-2 md:p-3 rounded-2xl border border-gray-800 flex flex-col sm:flex-row items-center gap-3 md:gap-4 w-full xl:w-auto">
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
            
            {/* Start Date Input */}
            <div className="relative w-full sm:w-auto">
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="w-full sm:w-[150px] bg-[#0B0F19] px-4 py-2.5 rounded-xl text-sm font-medium text-white outline-none border border-gray-700 focus:border-[#B519FF] transition-colors" 
              />
              {!startDate && (
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  Start Date
                </span>
              )}
            </div>
            
            <span className="text-gray-600 text-sm font-bold hidden sm:block">to</span>
            
            {/* End Date Input */}
            <div className="relative w-full sm:w-auto">
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="w-full sm:w-[150px] bg-[#0B0F19] px-4 py-2.5 rounded-xl text-sm font-medium text-white outline-none border border-gray-700 focus:border-[#B519FF] transition-colors" 
              />
              {!endDate && (
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  End Date
                </span>
              )}
            </div>

            {(startDate || endDate) && (
              <button 
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="w-full sm:w-auto text-xs font-bold text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-4 py-2.5 rounded-xl transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Custom Date Filtered Cards */}
      {(startDate || endDate) && data?.analytics?.dateFiltered && (
        <div className="bg-gradient-to-r from-[#B519FF]/20 to-purple-900/20 p-6 rounded-3xl border border-[#B519FF]/30 shadow-[0_0_30px_rgba(181,25,255,0.1)]">
          <h2 className="text-xs font-bold text-[#B519FF] uppercase tracking-widest mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
            Results for Selected Dates
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-[#0B0F19]/50 p-4 rounded-2xl border border-white/5"><p className="text-[10px] text-gray-400 font-bold uppercase mb-1">New Users</p><p className="text-xl md:text-2xl font-black text-white">{data.analytics.dateFiltered.users}</p></div>
            <div className="bg-[#0B0F19]/50 p-4 rounded-2xl border border-white/5"><p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Deposits</p><p className="text-xl md:text-2xl font-black text-emerald-400">{data.analytics.dateFiltered.deposits} ETB</p></div>
            <div className="bg-[#0B0F19]/50 p-4 rounded-2xl border border-white/5"><p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Withdrawals</p><p className="text-xl md:text-2xl font-black text-red-400">{data.analytics.dateFiltered.withdrawals} ETB</p></div>
            <div className="bg-[#0B0F19]/50 p-4 rounded-2xl border border-white/5"><p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Net Profit</p><p className="text-xl md:text-2xl font-black text-white">{data.analytics.dateFiltered.net} ETB</p></div>
          </div>
        </div>
      )}

      {/* User Growth & Source */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#131825] p-6 rounded-3xl border border-gray-800 md:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#B519FF]/5 rounded-full blur-2xl"></div>
          <h3 className="text-[11px] text-gray-400 uppercase font-bold tracking-widest mb-4">User Growth</h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 relative z-10">
            <div>
              <p className="text-5xl font-black text-white">{data.analytics.users.total}</p>
              <p className="text-xs text-gray-500 font-bold mt-1">Total Registered</p>
            </div>
            <div className="text-right flex sm:flex-col gap-4 sm:gap-1 text-xs bg-[#0B0F19] p-3 rounded-xl border border-gray-800">
              <p className="text-gray-400">Today: <span className="text-emerald-400 font-bold">+{data.analytics.users.daily}</span></p>
              <p className="text-gray-400">Weekly: <span className="text-emerald-400 font-bold">+{data.analytics.users.weekly}</span></p>
              <p className="text-gray-400">Monthly: <span className="text-emerald-400 font-bold">+{data.analytics.users.monthly}</span></p>
            </div>
          </div>
        </div>
        
        <div className="bg-[#131825] p-6 rounded-3xl border border-gray-800">
          <h3 className="text-[11px] text-gray-400 uppercase font-bold tracking-widest mb-4">Join Method</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-[#0B0F19] p-3 rounded-xl border border-gray-800">
              <span className="text-xs font-medium text-gray-400">Invited</span>
              <span className="font-bold text-[#B519FF]">{data.analytics.users.invited}</span>
            </div>
            <div className="flex justify-between items-center bg-[#0B0F19] p-3 rounded-xl border border-gray-800">
              <span className="text-xs font-medium text-gray-400">Web</span>
              <span className="font-bold text-white">{data.analytics.users.web}</span>
            </div>
          </div>
        </div>

        {/* Top Admin Performance */}
        <div className="bg-gradient-to-br from-[#B519FF] to-purple-800 p-6 rounded-3xl shadow-lg border border-purple-500/30">
          <h3 className="text-[11px] text-purple-200 uppercase font-bold tracking-widest">Top Admins</h3>
          <div className="mt-4 space-y-3">
            {data.analytics.adminPerformance
              .sort((a: any, b: any) => b.depositsCount - a.depositsCount)
              .slice(0, 3)
              .map((adm: any, i: number) => (
              <div key={adm.id} className="flex justify-between items-center text-sm border-b border-white/10 pb-2 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-white/50 text-xs font-bold">#{i + 1}</span>
                  <span className="font-bold text-white truncate max-w-[100px]">{adm.name}</span>
                </div>
                <span className="text-purple-200 text-xs bg-black/20 px-2 py-1 rounded-md">{adm.depositsCount} apprv.</span>
              </div>
            ))}
            {data.analytics.adminPerformance.length === 0 && <p className="text-xs text-purple-200">No data yet.</p>}
          </div>
        </div>
      </div>

      {/* System Financial Analysis */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 mt-8 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#B519FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          System Financials
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Deposits */}
          <div className="bg-[#131825] p-6 rounded-3xl border border-gray-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
            <h3 className="text-[10px] text-emerald-400 bg-emerald-500/10 w-fit px-3 py-1 rounded-full uppercase font-bold tracking-widest mb-5 border border-emerald-500/20">Total Deposits</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center border-b border-gray-800 pb-2"><span className="text-gray-400 font-medium">Today</span><span className="font-bold text-white">ETB {data.analytics.financials.deposits.daily}</span></div>
              <div className="flex justify-between items-center border-b border-gray-800 pb-2"><span className="text-gray-400 font-medium">Weekly</span><span className="font-bold text-white">ETB {data.analytics.financials.deposits.weekly}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-400 font-medium">Monthly</span><span className="font-bold text-white">ETB {data.analytics.financials.deposits.monthly}</span></div>
            </div>
          </div>

          {/* Withdrawals */}
          <div className="bg-[#131825] p-6 rounded-3xl border border-gray-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl"></div>
            <h3 className="text-[10px] text-red-400 bg-red-500/10 w-fit px-3 py-1 rounded-full uppercase font-bold tracking-widest mb-5 border border-red-500/20">Total Withdrawals</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center border-b border-gray-800 pb-2"><span className="text-gray-400 font-medium">Today</span><span className="font-bold text-white">ETB {data.analytics.financials.withdrawals.daily}</span></div>
              <div className="flex justify-between items-center border-b border-gray-800 pb-2"><span className="text-gray-400 font-medium">Weekly</span><span className="font-bold text-white">ETB {data.analytics.financials.withdrawals.weekly}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-400 font-medium">Monthly</span><span className="font-bold text-white">ETB {data.analytics.financials.withdrawals.monthly}</span></div>
            </div>
          </div>

          {/* Net Volume */}
          <div className="bg-gradient-to-br from-[#0B0F19] to-[#131825] p-6 rounded-3xl border border-[#B519FF]/30 relative overflow-hidden shadow-[0_0_20px_rgba(181,25,255,0.05)]">
             <div className="absolute top-0 right-0 w-32 h-32 bg-[#B519FF]/10 rounded-full blur-3xl"></div>
            <h3 className="text-[10px] text-[#B519FF] bg-[#B519FF]/10 w-fit px-3 py-1 rounded-full uppercase font-bold tracking-widest mb-5 border border-[#B519FF]/20">Net Balance</h3>
            <div className="space-y-4 text-sm relative z-10">
              <div className="flex justify-between items-center border-b border-gray-800 pb-2"><span className="text-gray-400 font-medium">Today</span><span className="font-black text-[#B519FF]">ETB {data.analytics.financials.net.daily}</span></div>
              <div className="flex justify-between items-center border-b border-gray-800 pb-2"><span className="text-gray-400 font-medium">Weekly</span><span className="font-black text-[#B519FF]">ETB {data.analytics.financials.net.weekly}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-400 font-medium">Monthly</span><span className="font-black text-[#B519FF]">ETB {data.analytics.financials.net.monthly}</span></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}