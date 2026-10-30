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

  if (!data && loading) return <div className="p-8 text-center text-gray-500 font-medium">Loading analytics...</div>;
  if (!data) return <div className="p-8 text-center text-red-600 font-bold">Failed to load data. Please check the backend.</div>;

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      
      {/* Header & Date Picker */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Super Admin Overview
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
            Less searching.<br />
            More <span className="text-[#B519FF] italic font-serif">managing.</span>
          </h1>
        </div>

        {/* Date Picker UI */}
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-gray-50 px-3 py-2 rounded-xl text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-[#B519FF]" />
            <span className="text-gray-400 text-sm font-bold">to</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-gray-50 px-3 py-2 rounded-xl text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-[#B519FF]" />
          </div>
        </div>
      </div>

      {/* Custom Date Filtered Cards (Show only if date is picked) */}
      {(startDate || endDate) && data?.analytics?.dateFiltered && (
        <div className="bg-[#B519FF]/10 p-6 rounded-3xl border border-[#B519FF]/20 mb-8">
          <h2 className="text-sm font-bold text-[#B519FF] uppercase mb-4">Results for Selected Dates</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div><p className="text-xs text-gray-500 font-bold uppercase">New Users</p><p className="text-xl font-black">{data.analytics.dateFiltered.users}</p></div>
            <div><p className="text-xs text-gray-500 font-bold uppercase">Deposits</p><p className="text-xl font-black text-emerald-600">{data.analytics.dateFiltered.deposits} ETB</p></div>
            <div><p className="text-xs text-gray-500 font-bold uppercase">Withdrawals</p><p className="text-xl font-black text-red-600">{data.analytics.dateFiltered.withdrawals} ETB</p></div>
            <div><p className="text-xs text-gray-500 font-bold uppercase">Net Profit</p><p className="text-xl font-black text-gray-900">{data.analytics.dateFiltered.net} ETB</p></div>
          </div>
        </div>
      )}

      {/* User Growth & Source */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 md:col-span-2">
          <h3 className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-4">User Growth</h3>
          <div className="flex items-end justify-between">
            <p className="text-4xl font-black text-gray-900">{data.analytics.users.total} <span className="text-sm font-medium text-gray-400">Total</span></p>
            <div className="text-right text-xs space-y-1">
              <p className="text-gray-500">Today: <span className="text-emerald-500 font-bold">+{data.analytics.users.daily}</span></p>
              <p className="text-gray-500">Weekly: <span className="text-emerald-500 font-bold">+{data.analytics.users.weekly}</span></p>
              <p className="text-gray-500">Monthly: <span className="text-emerald-500 font-bold">+{data.analytics.users.monthly}</span></p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Join Method</h3>
          <div className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Invited by Link</span>
              <span className="font-bold text-[#B519FF]">{data.analytics.users.invited}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Joined via Web</span>
              <span className="font-bold text-gray-900">{data.analytics.users.web}</span>
            </div>
          </div>
        </div>

        {/* Top Admin Performance */}
        <div className="bg-black text-white p-6 rounded-3xl shadow-lg">
          <h3 className="text-xs text-gray-400 uppercase font-bold tracking-wider">Top Admin</h3>
          <div className="mt-4 space-y-3">
            {data.analytics.adminPerformance
              .sort((a: any, b: any) => b.approvals - a.approvals)
              .slice(0, 2)
              .map((adm: any, i: number) => (
              <div key={adm.id} className="flex justify-between items-center text-sm border-b border-gray-800 pb-2 last:border-0">
                <span className="font-medium"><span className="text-[#B519FF] mr-1">#{i + 1}</span>{adm.name}</span>
                <span className="text-gray-400 text-xs">{adm.approvals} apprv.</span>
              </div>
            ))}
            {data.analytics.adminPerformance.length === 0 && <p className="text-xs text-gray-500">No data yet.</p>}
          </div>
        </div>
      </div>

      {/* System Financial Analysis */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">System Financials</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Deposits */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-xs text-emerald-600 bg-emerald-50 w-fit px-3 py-1 rounded-full uppercase font-bold tracking-wider mb-4">Total Deposits</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Today</span><span className="font-bold text-gray-900">ETB {data.analytics.financials.deposits.daily}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Weekly</span><span className="font-bold text-gray-900">ETB {data.analytics.financials.deposits.weekly}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Monthly</span><span className="font-bold text-gray-900">ETB {data.analytics.financials.deposits.monthly}</span></div>
            </div>
          </div>

          {/* Withdrawals */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-xs text-red-600 bg-red-50 w-fit px-3 py-1 rounded-full uppercase font-bold tracking-wider mb-4">Total Withdrawals</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Today</span><span className="font-bold text-gray-900">ETB {data.analytics.financials.withdrawals.daily}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Weekly</span><span className="font-bold text-gray-900">ETB {data.analytics.financials.withdrawals.weekly}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Monthly</span><span className="font-bold text-gray-900">ETB {data.analytics.financials.withdrawals.monthly}</span></div>
            </div>
          </div>

          {/* Net Volume */}
          <div className="bg-black text-white p-6 rounded-3xl shadow-lg">
            <h3 className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-4">Net Balance</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Today</span><span className="font-bold">ETB {data.analytics.financials.net.daily}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Weekly</span><span className="font-bold">ETB {data.analytics.financials.net.weekly}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Monthly</span><span className="font-bold">ETB {data.analytics.financials.net.monthly}</span></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}