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
        // We enrich the users with job level data from the backend
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

  // --- 1. Analytics Calculations ---
  const totalUsers = users.length;
  
  const richestUser = users.length > 0 
    ? [...users].sort((a, b) => parseFloat(b.walletBalance) - parseFloat(a.walletBalance))[0] 
    : null;

  const bestInviter = users.length > 0 
    ? [...users].sort((a, b) => (b.invitedCount || 0) - (a.invitedCount || 0))[0] 
    : null;

  // --- 2. Search Filter ---
  const filteredUsers = users.filter((u: any) => {
    const query = searchQuery.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(query)) ||
      (u.phone && u.phone.includes(query)) ||
      (u.id && u.id.toLowerCase().includes(query))
    );
  });

  // --- 3. Pagination ---
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading users...</div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">User Moderation</h1>
        <p className="text-gray-500 font-medium">Manage users, review reports, and view platform analytics.</p>
      </div>

      {/* ✅ Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Users</h3>
          <p className="text-4xl font-black mt-2 text-gray-900">{totalUsers}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xs text-gray-500 uppercase font-bold tracking-wider">Richest User</h3>
          {richestUser ? (
            <>
              <p className="text-lg font-bold mt-2 text-emerald-600 truncate">{richestUser.name || richestUser.phone}</p>
              <p className="text-sm font-black text-gray-900">ETB {richestUser.walletBalance}</p>
            </>
          ) : <p className="text-sm text-gray-400 mt-2">No users yet.</p>}
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xs text-gray-500 uppercase font-bold tracking-wider">Top Inviter</h3>
          {bestInviter ? (
            <>
              <p className="text-lg font-bold mt-2 text-[#B519FF] truncate">{bestInviter.name || bestInviter.phone}</p>
              <p className="text-sm font-black text-gray-900">{bestInviter.invitedCount || 0} Invites</p>
            </>
          ) : <p className="text-sm text-gray-400 mt-2">No inviters yet.</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* User Table */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-xl font-bold text-gray-900">All Users</h2>
            <input 
              type="text" 
              placeholder="Search by ID, Phone, or Name..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full md:w-64 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
                <tr>
                  <th className="px-4 py-3">User ID</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Job Level</th>
                  <th className="px-4 py-3">Joined Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentUsers.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono text-xs">{u.id.split('-')[0]}...</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{u.phone}</td>
                    <td className="px-4 py-3">{u.name || 'No Name'}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600">ETB {u.walletBalance}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-purple-50 text-[#B519FF] rounded-md text-xs font-bold">{u.jobLevel}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => handleToggleLock(u.id)} className={`px-3 py-1 rounded-lg text-xs font-bold ${u.isLocked ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                        {u.isLocked ? 'Unlock' : 'Lock'}
                      </button>
                      <button onClick={() => handleDeleteUser(u.id, u.name)} className="px-3 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && <p className="text-center p-8 text-gray-500">No users found.</p>}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button disabled={currentPage === 1} onClick={() => paginate(currentPage - 1)} className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-bold disabled:opacity-50">Prev</button>
              <span className="text-sm font-bold text-gray-500">Page {currentPage} of {totalPages}</span>
              <button disabled={currentPage === totalPages} onClick={() => paginate(currentPage + 1)} className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-bold disabled:opacity-50">Next</button>
            </div>
          )}
        </div>

                {/* Reports from Admins */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 lg:col-span-1">
          <h2 className="text-xl font-bold text-red-600 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            Admin Reports
          </h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {reports.length === 0 && <p className="text-sm text-gray-500">No pending reports.</p>}
            
            {reports.map((report: any) => (
              <div key={report.id} className="p-4 bg-red-50 border border-red-100 rounded-2xl space-y-3">
                
                {/* ✅ Target User Details */}
                <div className="bg-white p-3 rounded-xl border border-red-100">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Reported User</p>
                  <p className="font-bold text-gray-900">{report.targetName || 'Unknown Name'}</p>
                  <p className="text-sm text-gray-600">{report.targetPhone || 'No Phone'}</p>
                  <p className="text-sm font-black text-emerald-600 mt-1">ETB {report.targetBalance || '0.00'}</p>
                </div>

                {/* Reason */}
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Reason</p>
                  <p className="text-sm text-gray-800">{report.reason}</p>
                </div>

                {/* Actions */}
                <div className="pt-2 flex gap-2">
                  <button 
                    onClick={() => handleDeleteUser(report.targetUserId, report.targetName || 'reported user')} 
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-700 transition"
                  >
                    Delete User
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