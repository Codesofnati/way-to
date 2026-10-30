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

  if (loading) return <div className="p-8 text-center text-gray-500">Loading analytics...</div>;
  if (!data) return <div className="p-8 text-center text-red-600">Failed to load data.</div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Fund Analytics</h1>
        <p className="text-gray-500 font-medium">Track how users are investing in your fund plans.</p>
      </div>

      {/* ✅ Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black text-white p-6 rounded-3xl shadow-lg">
          <h3 className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">Total Fund Investments</h3>
          <p className="text-4xl font-black">ETB {data.totalInvested}</p>
        </div>
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Total Real Users Joined</h3>
          <p className="text-4xl font-black text-[#B519FF]">{data.totalUsersJoined}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Total Active Funds</h3>
          <p className="text-4xl font-black text-gray-900">{data.fundStats.length}</p>
        </div>
      </div>

      {/* ✅ Detailed Breakdown Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Fund Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
              <tr>
                <th className="px-6 py-4">Fund Name</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Total Users (Real / Fake)</th>
                <th className="px-6 py-4">Total Money Invested</th>
                <th className="px-6 py-4">Start Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.fundStats.map((fund: any) => (
                <tr key={fund.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{fund.name}</p>
                    <p className="text-xs text-gray-500">{fund.durationDays} Days • {fund.interestRate}% / day</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase ${fund.status === 'Open' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                      {fund.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{fund.realJoinedUsers} <span className="text-xs text-gray-400 font-normal">Real Users</span></p>
                    <p className="text-xs text-gray-500">+ {fund.fakeJoinedUsers} Fake (UI shows {fund.totalJoinedUI} / {fund.maxParticipants})</p>
                  </td>
                  <td className="px-6 py-4 font-black text-emerald-600">
                    ETB {fund.totalMoneyInFund}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    {new Date(fund.startDate).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.fundStats.length === 0 && <div className="p-8 text-center text-gray-500">No funds created yet.</div>}
        </div>
      </div>
    </div>
  );
}