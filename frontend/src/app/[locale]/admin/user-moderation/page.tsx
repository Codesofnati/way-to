'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function UserModeration({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  useEffect(() => {
    if (user.role !== 'super_admin') {
      router.push(`/${locale}/auth`);
      return;
    }
    fetchData();
  }, [router, locale]);

  const fetchData = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/analytics`);
      const result = await res.json();
      if (result.success) {
        const enrichedUsers = await Promise.all(result.users.map(async (u: any) => {
          try {
            const jobRes = await fetch(`${apiUrl}/api/user/${u.id}/my-jobs`);
            const jobData = await jobRes.json();
            const jobName = jobData.success && jobData.myJobs.length > 0 ? jobData.myJobs[0].jobName : 'No Job';
            return { ...u, jobLevel: jobName };
          } catch {
            return { ...u, jobLevel: 'Unknown' };
          }
        }));

        setUsers(enrichedUsers);
        setReports(result.analytics.reports || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLock = async (id: string) => {
    await fetch(`${apiUrl}/api/super-admin/admins/${id}/toggle-lock`, { method: 'POST' });
    fetchData(); 
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await fetch(`${apiUrl}/api/super-admin/users/${userId}`, { method: 'DELETE' });
    fetchData();
  };

  // Analytics Calculations
  const totalUsers = users.length;
  const richestUser = users.length > 0 ? [...users].sort((a, b) => parseFloat(b.walletBalance) - parseFloat(a.walletBalance))[0] : null;
  const bestInviter = users.length > 0 ? [...users].sort((a, b) => (b.invitedCount || 0) - (a.invitedCount || 0))[0] : null;

  // Search Filter
  const filteredUsers = users.filter((u: any) => {
    const query = searchQuery.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(query)) ||
      (u.phone && u.phone.includes(query)) ||
      (u.id && u.id.toLowerCase().includes(query))
    );
  });

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-400">
      <div className="w-10 h-10 border-4 border-[#B519FF] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-bold tracking-widest uppercase text-xs">Loading Users...</p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">User Moderation</h1>
        <p className="text-gray-400 font-medium">Manage users, review reports, and view platform analytics.</p>
      </div>

      {/* ✅ Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-[#131825] p-6 rounded-3xl border border-gray-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#B519FF]/10 rounded-full blur-2xl"></div>
          <h3 className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-2">Total Users</h3>
          <p className="text-4xl font-black text-white">{totalUsers}</p>
        </div>

        <div className="bg-[#131825] p-6 rounded-3xl border border-gray-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
          <h3 className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-2">Richest User</h3>
          {richestUser ? (
            <>
              <p className="text-lg font-bold text-emerald-400 truncate">{richestUser.name || richestUser.phone}</p>
              <p className="text-sm font-black text-white mt-1">ETB {richestUser.walletBalance}</p>
            </>
          ) : <p className="text-sm text-gray-500 mt-2">No users yet.</p>}
        </div>

        <div className="bg-[#131825] p-6 rounded-3xl border border-gray-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#B519FF]/10 rounded-full blur-2xl"></div>
          <h3 className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-2">Top Inviter</h3>
          {bestInviter ? (
            <>
              <p className="text-lg font-bold text-[#B519FF] truncate">{bestInviter.name || bestInviter.phone}</p>
              <p className="text-sm font-black text-white mt-1">{bestInviter.invitedCount || 0} Invites</p>
            </>
          ) : <p className="text-sm text-gray-500 mt-2">No inviters yet.</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* User Table */}
        <div className="bg-[#131825] p-6 rounded-3xl border border-gray-800 xl:col-span-2">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-xl font-bold text-white">All Users</h2>
            
            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full p-3 pl-10 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-[#B519FF] transition-colors"
              />
              {!searchQuery && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                  Search ID, Phone, Name...
                </span>
              )}
              <svg className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar pb-2">
            <table className="w-full text-left text-sm text-gray-300 min-w-[800px]">
              <thead className="bg-[#0B0F19] text-[10px] uppercase font-bold text-gray-500 rounded-xl">
                <tr>
                  <th className="px-4 py-4 rounded-l-xl">User ID</th>
                  <th className="px-4 py-4">Phone</th>
                  <th className="px-4 py-4">Name</th>
                  <th className="px-4 py-4">Balance</th>
                  <th className="px-4 py-4">Job Level</th>
                  <th className="px-4 py-4">Joined</th>
                  <th className="px-4 py-4 text-right rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {currentUsers.map((u: any) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-4 py-4 font-mono text-xs text-gray-500">{u.id.split('-')[0]}...</td>
                    <td className="px-4 py-4 font-medium text-white">{u.phone}</td>
                    <td className="px-4 py-4">{u.name || 'No Name'}</td>
                    <td className="px-4 py-4 font-bold text-emerald-400">ETB {u.walletBalance}</td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 bg-[#B519FF]/10 text-[#B519FF] border border-[#B519FF]/20 rounded-md text-[10px] font-bold">
                        {u.jobLevel}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-4 text-right space-x-2">
                      <button onClick={() => handleToggleLock(u.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${u.isLocked ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'}`}>
                        {u.isLocked ? 'Unlock' : 'Lock'}
                      </button>
                      <button onClick={() => handleDeleteUser(u.id, u.name)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && <p className="text-center p-8 text-gray-500">No users found matching your search.</p>}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button disabled={currentPage === 1} onClick={() => paginate(currentPage - 1)} className="px-4 py-2 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm font-bold text-white disabled:opacity-50 hover:bg-gray-800 transition">Prev</button>
              <span className="text-sm font-bold text-gray-500">Page {currentPage} of {totalPages}</span>
              <button disabled={currentPage === totalPages} onClick={() => paginate(currentPage + 1)} className="px-4 py-2 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm font-bold text-white disabled:opacity-50 hover:bg-gray-800 transition">Next</button>
            </div>
          )}
        </div>

        {/* Reports from Admins */}
        <div className="bg-[#131825] p-6 rounded-3xl border border-gray-800 xl:col-span-1">
          <h2 className="text-xl font-bold text-red-400 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            Admin Reports
          </h2>
          <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
            {reports.length === 0 && (
              <div className="text-center py-10 bg-[#0B0F19] rounded-2xl border border-gray-800 border-dashed">
                <p className="text-sm text-gray-500">No pending reports.</p>
              </div>
            )}
            
            {reports.map((report: any) => (
              <div key={report.id} className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl space-y-4">
                
                {/* Target User Details */}
                <div className="bg-[#0B0F19] p-4 rounded-xl border border-gray-800">
                  <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-2">Reported User</p>
                  <p className="font-bold text-white">{report.targetName || 'Unknown Name'}</p>
                  <p className="text-xs text-gray-400">{report.targetPhone || 'No Phone'}</p>
                  <p className="text-sm font-black text-emerald-400 mt-2">ETB {report.targetBalance || '0.00'}</p>
                </div>

                {/* Reason */}
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Reason</p>
                  <p className="text-sm text-gray-300">{report.reason}</p>
                </div>

                {/* Actions */}
                <div className="pt-2">
                  <button 
                    onClick={() => handleDeleteUser(report.targetUserId, report.targetName || 'reported user')} 
                    className="w-full bg-red-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-red-600 transition shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                  >
                    Delete Reported User
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}