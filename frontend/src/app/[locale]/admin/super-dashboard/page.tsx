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
    <div className="space-y-8 pb-12">
      
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
          {(startDate || endDate) && data?.analytics?.dateFiltered && (
            <div className="flex gap-4 border-t sm:border-t-0 sm:border-l border-gray-200 pt-3 sm:pt-0 sm:pl-4">
              <div className="text-center sm:text-left">
                <p className="text-[10px] text-gray-500 font-bold uppercase">Users</p>
                <p className="text-sm font-black text-[#B519FF]">+{data.analytics.dateFiltered.users}</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[10px] text-gray-500 font-bold uppercase">Volume</p>
                <p className="text-sm font-black text-[#B519FF]">{data.analytics.dateFiltered.volume} ETB</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Users</h3>
          <p className="text-4xl font-black mt-2 text-gray-900">{data.analytics.users.total}</p>
          <div className="text-xs text-gray-500 mt-4 space-y-1 font-medium">
            <p>Daily: <span className="text-emerald-500">+{data.analytics.users.daily}</span></p>
            <p>Weekly: <span className="text-emerald-500">+{data.analytics.users.weekly}</span></p>
            <p>Monthly: <span className="text-emerald-500">+{data.analytics.users.monthly}</span></p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Volume</h3>
          <p className="text-4xl font-black mt-2 text-[#B519FF]">{data.analytics.birr.daily} <span className="text-lg text-gray-400">ETB</span></p>
          <div className="text-xs text-gray-500 mt-4 space-y-1 font-medium">
            <p>Weekly: <span className="text-gray-900">ETB {data.analytics.birr.weekly}</span></p>
            <p>Monthly: <span className="text-gray-900">ETB {data.analytics.birr.monthly}</span></p>
          </div>
        </div>

        {/* Top Admin Performance */}
        <div className="bg-black text-white p-6 rounded-3xl shadow-lg">
          <h3 className="text-xs text-gray-400 uppercase font-bold tracking-wider">Top Admin Performance</h3>
          <div className="mt-4 space-y-3">
            {data.analytics.adminPerformance
              .sort((a: any, b: any) => b.approvals - a.approvals)
              .slice(0, 3)
              .map((adm: any, i: number) => (
              <div key={adm.id} className="flex justify-between items-center text-sm border-b border-gray-800 pb-2 last:border-0">
                <span className="font-medium"><span className="text-[#B519FF] mr-2">#{i + 1}</span>{adm.name}</span>
                <span className="text-gray-400 text-xs">{adm.approvals} approvals</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}