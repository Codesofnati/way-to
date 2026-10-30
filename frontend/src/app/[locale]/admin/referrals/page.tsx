'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function SuperAdminReferrals({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'super_admin') {
      router.push(`/${locale}/auth`);
      return;
    }

    fetch(`${apiUrl}/api/super-admin/referrals`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setReferrals(data.referrals);
      })
      .finally(() => setLoading(false));
  }, [router, locale, apiUrl]);

  // Analytics Logic
  const sortedReferrals = [...referrals].sort((a, b) => b.invitedCount - a.invitedCount);
  
  const bestInviter = sortedReferrals.length > 0 ? sortedReferrals[0] : null;
  const laziestUser = sortedReferrals.length > 0 ? sortedReferrals[sortedReferrals.length - 1] : null;

  // Search Filter
  const filteredReferrals = sortedReferrals.filter((ref: any) => {
    const query = searchQuery.trim();
    if (!query) return true;
    return ref.invitedCount.toString() === query;
  });

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentReferrals = filteredReferrals.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredReferrals.length / itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading analytics...</div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      
      {/* Header */}
      <div>
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B519FF]/10 text-[#B519FF] text-xs font-bold uppercase tracking-wider mb-4 border border-[#B519FF]/20">
          <span className="w-2 h-2 rounded-full bg-[#B519FF]"></span> Global Analytics
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-2">
          Referral <span className="text-[#B519FF] italic font-serif">Network.</span>
        </h1>
        <p className="text-gray-500 font-medium mt-2">Track your best inviters and identify inactive users.</p>
      </div>

      {/* Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-50 p-6 rounded-3xl shadow-sm border border-emerald-100">
          <h3 className="text-xs text-emerald-600 uppercase font-bold tracking-wider mb-2">🏆 Best Inviter</h3>
          {bestInviter ? (
            <>
              <p className="text-2xl font-black text-emerald-900">{bestInviter.name || 'No Name'}</p>
              <p className="text-sm font-medium text-emerald-700">{bestInviter.phone}</p>
              <p className="text-lg font-black text-emerald-600 mt-2">{bestInviter.invitedCount} Invites</p>
            </>
          ) : <p className="text-sm text-gray-500">No data.</p>}
        </div>

        <div className="bg-red-50 p-6 rounded-3xl shadow-sm border border-red-100">
          <h3 className="text-xs text-red-600 uppercase font-bold tracking-wider mb-2">💤 Laziest User</h3>
          {laziestUser ? (
            <>
              <p className="text-2xl font-black text-red-900">{laziestUser.name || 'No Name'}</p>
              <p className="text-sm font-medium text-red-700">{laziestUser.phone}</p>
              <p className="text-lg font-black text-red-600 mt-2">{laziestUser.invitedCount} Invites</p>
            </>
          ) : <p className="text-sm text-gray-500">No data.</p>}
        </div>
      </div>

      {/* Search & Table */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-900">All Inviters</h2>
          <div className="relative w-full md:w-80">
            <input 
              type="number" 
              placeholder="Search by Invite Count (e.g. 0 or 2)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">User Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Job Level</th>
                <th className="px-4 py-3">Joined Date</th>
                <th className="px-4 py-3 text-center">Invite Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentReferrals.map((ref: any, index: number) => (
                <tr key={ref.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-bold text-gray-400">#{indexOfFirstItem + index + 1}</td>
                  <td className="px-4 py-3 font-bold text-gray-900">{ref.name || 'No Name'}</td>
                  <td className="px-4 py-3 font-medium">{ref.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${ref.jobLevel === 'No Job' ? 'bg-gray-100 text-gray-500' : 'bg-purple-50 text-[#B519FF]'}`}>
                      {ref.jobLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(ref.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-3 py-1 bg-purple-50 text-[#B519FF] font-black rounded-lg">
                      {ref.invitedCount}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredReferrals.length === 0 && (
            <div className="p-8 text-center text-gray-500">No users found with exactly {searchQuery} invites.</div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6 pt-6 border-t border-gray-100">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-bold disabled:opacity-50">Prev</button>
            <span className="text-sm font-bold text-gray-500">Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-bold disabled:opacity-50">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}