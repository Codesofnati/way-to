'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  useEffect(() => {
    if (!user.id || user.role !== 'admin') return router.push(`/${locale}/auth`);
    fetchData();
  }, [router, locale, user.id, startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = `${apiUrl}/api/admin/profile/${user.id}`;
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

  if (loading && !data) return (
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

  const { today, weekly, monthly, custom } = data.stats;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 relative overflow-hidden">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-[-10%] w-[500px] h-[500px] bg-[#B519FF]/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-3 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active Session
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-2">
            Welcome, {data.profile.name}
          </h1>
          <p className="text-gray-400 font-medium">Track the volume of tickets you have personally processed.</p>
        </div>

        {/* Date Picker */}
        <div className="bg-[#131825] p-2 rounded-2xl border border-gray-800 flex flex-col sm:flex-row items-center gap-2 shadow-lg">
          <div className="relative w-full sm:w-auto">
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="w-full bg-[#0B0F19] px-4 py-2.5 rounded-xl text-sm font-medium text-white outline-none border border-gray-700 focus:border-[#B519FF] color-scheme-dark" 
            />
            {!startDate && (
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                Start Date
              </span>
            )}
          </div>
          <span className="text-gray-600 text-sm font-bold hidden sm:block">to</span>
          <div className="relative w-full sm:w-auto">
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              className="w-full bg-[#0B0F19] px-4 py-2.5 rounded-xl text-sm font-medium text-white outline-none border border-gray-700 focus:border-[#B519FF] color-scheme-dark" 
            />
            {!endDate && (
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                End Date
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        
        {/* Deposits Card */}
        <div className="bg-[#131825] p-6 rounded-3xl border border-emerald-500/30 relative overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.05)] group hover:border-emerald-500/60 transition-colors">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all"></div>
          
          <h3 className="text-[10px] text-emerald-400 bg-emerald-500/10 w-fit px-3 py-1.5 rounded-lg uppercase font-bold tracking-widest mb-5 border border-emerald-500/20 relative z-10 flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
            Deposits I Approved
          </h3>
          
          <div className="space-y-4 text-sm relative z-10">
            <div className="flex justify-between items-center bg-[#0B0F19] p-3 rounded-xl border border-gray-800">
              <span className="text-gray-400 font-medium">Today</span>
              <div className="text-right">
                <p className="font-bold text-white">ETB {today.deposits.amount}</p>
                <p className="text-[10px] text-emerald-500/70">{today.deposits.count} tickets</p>
              </div>
            </div>
            <div className="flex justify-between items-center bg-[#0B0F19] p-3 rounded-xl border border-gray-800">
              <span className="text-gray-400 font-medium">Weekly</span>
              <div className="text-right">
                <p className="font-bold text-white">ETB {weekly.deposits.amount}</p>
                <p className="text-[10px] text-emerald-500/70">{weekly.deposits.count} tickets</p>
              </div>
            </div>
            <div className="flex justify-between items-center bg-[#0B0F19] p-3 rounded-xl border border-gray-800">
              <span className="text-gray-400 font-medium">Monthly</span>
              <div className="text-right">
                <p className="font-bold text-white">ETB {monthly.deposits.amount}</p>
                <p className="text-[10px] text-emerald-500/70">{monthly.deposits.count} tickets</p>
              </div>
            </div>
            {(startDate && endDate) && (
              <div className="flex justify-between items-center bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30 mt-2">
                <span className="text-emerald-400 font-bold text-xs uppercase">Custom Range</span>
                <div className="text-right">
                  <p className="font-black text-emerald-400">ETB {custom.deposits.amount}</p>
                  <p className="text-[10px] text-emerald-500/80">{custom.deposits.count} tickets</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Withdrawals Card */}
        <div className="bg-[#131825] p-6 rounded-3xl border border-red-500/30 relative overflow-hidden shadow-[0_0_30px_rgba(239,68,68,0.05)] group hover:border-red-500/60 transition-colors">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-500/10 rounded-full blur-3xl group-hover:bg-red-500/20 transition-all"></div>
          
          <h3 className="text-[10px] text-red-400 bg-red-500/10 w-fit px-3 py-1.5 rounded-lg uppercase font-bold tracking-widest mb-5 border border-red-500/20 relative z-10 flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            Withdrawals I Approved
          </h3>
          
          <div className="space-y-4 text-sm relative z-10">
            <div className="flex justify-between items-center bg-[#0B0F19] p-3 rounded-xl border border-gray-800">
              <span className="text-gray-400 font-medium">Today</span>
              <div className="text-right">
                <p className="font-bold text-white">ETB {today.withdrawals.amount}</p>
                <p className="text-[10px] text-red-500/70">{today.withdrawals.count} tickets</p>
              </div>
            </div>
            <div className="flex justify-between items-center bg-[#0B0F19] p-3 rounded-xl border border-gray-800">
              <span className="text-gray-400 font-medium">Weekly</span>
              <div className="text-right">
                <p className="font-bold text-white">ETB {weekly.withdrawals.amount}</p>
                <p className="text-[10px] text-red-500/70">{weekly.withdrawals.count} tickets</p>
              </div>
            </div>
            <div className="flex justify-between items-center bg-[#0B0F19] p-3 rounded-xl border border-gray-800">
              <span className="text-gray-400 font-medium">Monthly</span>
              <div className="text-right">
                <p className="font-bold text-white">ETB {monthly.withdrawals.amount}</p>
                <p className="text-[10px] text-red-500/70">{monthly.withdrawals.count} tickets</p>
              </div>
            </div>
            {(startDate && endDate) && (
              <div className="flex justify-between items-center bg-red-500/10 p-3 rounded-xl border border-red-500/30 mt-2">
                <span className="text-red-400 font-bold text-xs uppercase">Custom Range</span>
                <div className="text-right">
                  <p className="font-black text-red-400">ETB {custom.withdrawals.amount}</p>
                  <p className="text-[10px] text-red-500/80">{custom.withdrawals.count} tickets</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Net Volume Card (Glassmorphism) */}
        <div className="bg-gradient-to-br from-[#0B0F19] to-[#131825] p-6 rounded-3xl border border-[#B519FF]/40 relative overflow-hidden shadow-[0_0_30px_rgba(181,25,255,0.15)] group hover:border-[#B519FF]/60 transition-colors">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-[#B519FF]/20 rounded-full blur-3xl group-hover:bg-[#B519FF]/30 transition-all"></div>
          
          <h3 className="text-[10px] text-[#B519FF] bg-[#B519FF]/10 w-fit px-3 py-1.5 rounded-lg uppercase font-bold tracking-widest mb-5 border border-[#B519FF]/20 relative z-10 flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            My Net Volume
          </h3>
          
          <div className="space-y-4 text-sm relative z-10">
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
              <span className="text-gray-400 font-medium">Today</span>
              <span className="font-black text-white text-base">ETB {today.net}</span>
            </div>
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
              <span className="text-gray-400 font-medium">Weekly</span>
              <span className="font-black text-white text-base">ETB {weekly.net}</span>
            </div>
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
              <span className="text-gray-400 font-medium">Monthly</span>
              <span className="font-black text-white text-base">ETB {monthly.net}</span>
            </div>
            {(startDate && endDate) && (
              <div className="flex justify-between items-center bg-[#B519FF]/10 p-3 rounded-xl border border-[#B519FF]/30 mt-2">
                <span className="text-[#B519FF] font-bold text-xs uppercase">Custom Range</span>
                <span className="font-black text-[#B519FF] text-lg">ETB {custom.net}</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}