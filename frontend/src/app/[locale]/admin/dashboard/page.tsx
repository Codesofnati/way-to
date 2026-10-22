'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [passError, setPassError] = useState('');
  const [loading, setLoading] = useState(true);

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  useEffect(() => {
    // Block users and super_admins from accessing the regular admin dashboard
    if (!user.id || user.role !== 'admin') {
      router.push(`/${locale}/auth`);
      return;
    }
    fetchStats();
  }, [router, locale, user.id, user.role]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/profile/${user.id}`);
      const result = await res.json();
      if (result.success) setData(result);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    if (passwords.new !== passwords.confirm) return setPassError('Passwords do not match.');
    if (passwords.new.length < 4) return setPassError('Password too short.');

    try {
      const res = await fetch(`${apiUrl}/api/super-admin/profile/${user.id}/password`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.new }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      alert('Password changed successfully!');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err: any) { setPassError(err.message); }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
  if (!data) return <div className="p-8 text-center text-red-600">Failed to load data.</div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Welcome, {data.profile.name}</h1>
        <p className="text-gray-500 font-medium">Here is your personal performance overview.</p>
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xs text-gray-500 uppercase font-bold tracking-wider">Daily Approvals</h3>
          <p className="text-3xl font-black text-gray-900 mt-2">{data.performance.daily}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xs text-gray-500 uppercase font-bold tracking-wider">Weekly</h3>
          <p className="text-3xl font-black text-gray-900 mt-2">{data.performance.weekly}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xs text-gray-500 uppercase font-bold tracking-wider">Monthly</h3>
          <p className="text-3xl font-black text-gray-900 mt-2">{data.performance.monthly}</p>
        </div>
        <div className="bg-[#B519FF] text-white p-6 rounded-3xl shadow-lg">
          <h3 className="text-xs text-white/80 uppercase font-bold tracking-wider">My Volume</h3>
          <p className="text-3xl font-black mt-2">{data.performance.totalVolume} <span className="text-sm">ETB</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Profile Info */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Details</h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Full Name</p>
              <p className="font-medium text-lg">{data.profile.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Phone Number</p>
              <p className="font-medium text-lg">{data.profile.phone}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Total Tickets Closed</p>
              <p className="font-medium text-lg">{data.performance.totalApproved}</p>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Change Password</h2>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {passError && <div className="p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl">{passError}</div>}
            <input type="password" placeholder="Current Password" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]" required />
            <input type="password" placeholder="New Password" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]" required />
            <input type="password" placeholder="Confirm New Password" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]" required />
            <button type="submit" className="w-full bg-black text-white p-4 rounded-2xl font-bold hover:bg-gray-800 transition">Update Password</button>
          </form>
        </div>
      </div>
    </div>
  );
}