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

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-400">
      <div className="w-10 h-10 border-4 border-[#B519FF] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-bold tracking-widest uppercase text-xs">Loading Analytics...</p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* Header */}
      <div>
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B519FF]/10 text-[#B519FF] text-[10px] font-bold uppercase tracking-widest mb-4 border border-[#B519FF]/20">
          <span className="w-1.5 h-1.5 rounded-full bg-[#B519FF] animate-pulse"></span> Global Analytics
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2">
          Referral <span className="text-[#B519FF] italic font-serif">Network.</span>
        </h1>
        <p className="text-gray-400 font-medium mt-2">Track your best inviters and identify inactive users.</p>
      </div>

      {/* Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Best Inviter Card */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-[#131825] to-[#131825] p-6 md:p-8 rounded-3xl border border-emerald-500/20 relative overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.05)] group hover:border-emerald-500/40 transition-colors">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition-all"></div>
          
          <h3 className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest mb-4 flex items-center gap-2 relative z-10">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L5 10.274zm10 0l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L15 10.274z" clipRule="evenodd"></path></svg>
            Top Inviter
          </h3>
          
          {bestInviter ? (
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-300 font-black text-xl shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    {bestInviter.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white">{bestInviter.name || 'No Name'}</p>
                    <p className="text-sm font-medium text-emerald-400/80">{bestInviter.phone}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-400">{bestInviter.invitedCount}</span>
                  <span className="text-xs font-bold text-emerald-500/70 uppercase tracking-widest">Invites</span>
                </div>
              </div>
            </div>
          ) : <p className="text-sm text-gray-500">No data.</p>}
        </div>

        {/* Laziest User Card */}
        <div className="bg-gradient-to-br from-red-500/10 via-[#131825] to-[#131825] p-6 md:p-8 rounded-3xl border border-red-500/20 relative overflow-hidden shadow-[0_0_30px_rgba(239,68,68,0.05)] group hover:border-red-500/40 transition-colors">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-red-500/20 rounded-full blur-3xl group-hover:bg-red-500/30 transition-all"></div>
          
          <h3 className="text-[10px] text-red-400 uppercase font-bold tracking-widest mb-4 flex items-center gap-2 relative z-10">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
            Lowest Inviter
          </h3>
          
          {laziestUser ? (
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-14 h-14 rounded-full bg-red-500/20 border-2 border-red-500/30 flex items-center justify-center text-red-300 font-black text-xl shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                    {laziestUser.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white">{laziestUser.name || 'No Name'}</p>
                    <p className="text-sm font-medium text-red-400/80">{laziestUser.phone}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <div className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl flex items-baseline gap-2">
                  <span className="text-2xl font-black text-red-400">{laziestUser.invitedCount}</span>
                  <span className="text-xs font-bold text-red-500/70 uppercase tracking-widest">Invites</span>
                </div>
              </div>
            </div>
          ) : <p className="text-sm text-gray-500">No data.</p>}
        </div>
      </div>

      {/* Search & Table */}
      <div className="bg-[#131825] p-6 md:p-8 rounded-3xl border border-gray-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-xl font-bold text-white">All Inviters</h2>
          
          {/* Custom Search Input */}
          <div className="relative w-full md:w-80 group">
            <input 
              type="number" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 pl-10 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-white focus:border-[#B519FF] focus:ring-1 focus:ring-[#B519FF] outline-none transition-all"
            />
            {!searchQuery && (
              <span className="absolute left-10 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none group-focus-within:text-gray-400 transition-colors">
                Filter by Invite Count...
              </span>
            )}
            <svg className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-[#B519FF] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:text-white transition"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar pb-2">
          <table className="w-full text-left text-sm text-gray-300 min-w-[800px]">
            <thead className="bg-[#0B0F19] text-[10px] uppercase font-bold text-gray-500">
              <tr>
                <th className="px-4 py-4 rounded-l-xl">Rank</th>
                <th className="px-4 py-4">User</th>
                <th className="px-4 py-4">Job Level</th>
                <th className="px-4 py-4">Joined Date</th>
                <th className="px-4 py-4 text-center rounded-r-xl">Invites</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {currentReferrals.map((ref: any, index: number) => (
                <tr key={ref.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-4 py-4">
                    <span className={`font-black ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-orange-400' : 'text-gray-600'}`}>
                      #{indexOfFirstItem + index + 1}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-white text-xs font-bold border border-gray-700 group-hover:border-[#B519FF]/50 transition-colors">
                        {ref.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-bold text-white group-hover:text-[#B519FF] transition-colors">{ref.name || 'No Name'}</p>
                        <p className="text-xs text-gray-500">{ref.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${ref.jobLevel === 'No Job' ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-[#B519FF]/10 text-[#B519FF] border-[#B519FF]/20'}`}>
                      {ref.jobLevel}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs text-gray-500">
                    {new Date(ref.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="inline-block px-3 py-1 bg-[#B519FF]/10 text-[#B519FF] font-black rounded-lg border border-[#B519FF]/20 group-hover:bg-[#B519FF] group-hover:text-white transition-colors">
                      {ref.invitedCount}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredReferrals.length === 0 && (
            <div className="p-12 text-center text-gray-500 bg-[#0B0F19] rounded-2xl border border-gray-800 border-dashed mt-4">
              No users found with exactly {searchQuery} invites.
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6 pt-6 border-t border-gray-800">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className="px-5 py-2.5 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm font-bold text-white disabled:opacity-30 hover:bg-gray-800 transition-all">Prev</button>
            <span className="text-sm font-bold text-gray-400 bg-[#0B0F19] px-4 py-2.5 rounded-xl border border-gray-800">Page {currentPage} <span className="text-gray-600">/</span> {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} className="px-5 py-2.5 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm font-bold text-white disabled:opacity-30 hover:bg-gray-800 transition-all">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}