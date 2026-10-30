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

  if (loading && !data) return <div className="p-8 text-center text-gray-500">Loading analytics...</div>;
  if (!data) return <div className="p-8 text-center text-red-600">Failed to load data.</div>;

  const { today, weekly, monthly, custom } = data.stats;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
            Welcome, {data.profile.name}
          </h1>
          <p className="text-gray-500 font-medium">Track the volume of tickets you have personally processed.</p>
        </div>

        {/* Date Picker */}
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-2">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-gray-50 px-3 py-2 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#B519FF]" />
          <span className="text-gray-400 text-sm font-bold">to</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-gray-50 px-3 py-2 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#B519FF]" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Deposits Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xs text-emerald-600 bg-emerald-50 w-fit px-3 py-1 rounded-full uppercase font-bold tracking-wider mb-4">Deposits I Approved</h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Today</span>
              <div className="text-right">
                <p className="font-bold text-gray-900">ETB {today.deposits.amount}</p>
                <p className="text-xs text-gray-400">{today.deposits.count} tickets</p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Weekly</span>
              <div className="text-right">
                <p className="font-bold text-gray-900">ETB {weekly.deposits.amount}</p>
                <p className="text-xs text-gray-400">{weekly.deposits.count} tickets</p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Monthly</span>
              <div className="text-right">
                <p className="font-bold text-gray-900">ETB {monthly.deposits.amount}</p>
                <p className="text-xs text-gray-400">{monthly.deposits.count} tickets</p>
              </div>
            </div>
            {(startDate && endDate) && (
              <div className="flex justify-between items-center border-t pt-3 mt-2">
                <span className="text-[#B519FF] font-bold">Custom</span>
                <div className="text-right">
                  <p className="font-black text-[#B519FF]">ETB {custom.deposits.amount}</p>
                  <p className="text-xs text-[#B519FF] opacity-80">{custom.deposits.count} tickets</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Withdrawals Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xs text-red-600 bg-red-50 w-fit px-3 py-1 rounded-full uppercase font-bold tracking-wider mb-4">Withdrawals I Approved</h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Today</span>
              <div className="text-right">
                <p className="font-bold text-gray-900">ETB {today.withdrawals.amount}</p>
                <p className="text-xs text-gray-400">{today.withdrawals.count} tickets</p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Weekly</span>
              <div className="text-right">
                <p className="font-bold text-gray-900">ETB {weekly.withdrawals.amount}</p>
                <p className="text-xs text-gray-400">{weekly.withdrawals.count} tickets</p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Monthly</span>
              <div className="text-right">
                <p className="font-bold text-gray-900">ETB {monthly.withdrawals.amount}</p>
                <p className="text-xs text-gray-400">{monthly.withdrawals.count} tickets</p>
              </div>
            </div>
            {(startDate && endDate) && (
              <div className="flex justify-between items-center border-t pt-3 mt-2">
                <span className="text-[#B519FF] font-bold">Custom</span>
                <div className="text-right">
                  <p className="font-black text-[#B519FF]">ETB {custom.withdrawals.amount}</p>
                  <p className="text-xs text-[#B519FF] opacity-80">{custom.withdrawals.count} tickets</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Net Volume Card */}
        <div className="bg-black text-white p-6 rounded-3xl shadow-lg">
          <h3 className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-4">My Net Volume (Dep - Wth)</h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Today</span>
              <span className="font-bold text-lg">ETB {today.net}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Weekly</span>
              <span className="font-bold text-lg">ETB {weekly.net}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Monthly</span>
              <span className="font-bold text-lg">ETB {monthly.net}</span>
            </div>
            {(startDate && endDate) && (
              <div className="flex justify-between items-center border-t border-gray-700 pt-3 mt-2">
                <span className="text-[#B519FF] font-bold">Custom</span>
                <span className="font-black text-[#B519FF] text-lg">ETB {custom.net}</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}