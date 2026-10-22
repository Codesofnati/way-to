'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function UserModeration({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
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
        setUsers(result.users);
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

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">User Moderation</h1>
        <p className="text-gray-500 font-medium">Manage users and review reports from admins.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* User List */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-900 mb-6">All Users</h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {users.map((u: any) => (
              <div key={u.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-gray-50 rounded-2xl gap-3 border border-gray-100">
                <div>
                  <p className="font-bold text-gray-900">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.phone} • {u.isLocked ? '🔒 Locked' : '✅ Active'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleToggleLock(u.id)} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${u.isLocked ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                    {u.isLocked ? 'Unlock' : 'Lock'}
                  </button>
                  <button onClick={() => handleDeleteUser(u.id, u.name)} className="px-4 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reports from Admins */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 lg:col-span-1">
          <h2 className="text-xl font-bold text-red-600 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            Admin Reports
          </h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {reports.length === 0 && <p className="text-sm text-gray-500">No pending reports.</p>}
            {reports.map((report: any) => (
              <div key={report.id} className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                <p className="text-sm font-bold text-gray-900 mb-1">Target ID: {report.targetUserId}</p>
                <p className="text-xs text-gray-600 mb-3">Reason: {report.reason}</p>
                <button onClick={() => handleDeleteUser(report.targetUserId, 'reported user')} className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-700 transition">Delete User</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}