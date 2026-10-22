'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function ManageAdmins({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  const [admins, setAdmins] = useState<any[]>([]);
  const [newAdmin, setNewAdmin] = useState({ name: '', phone: '', password: '' });
  const [loading, setLoading] = useState(true);
  
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  useEffect(() => {
    if (user.role !== 'super_admin') {
      router.push(`/${locale}/auth`);
      return;
    }
    fetchAdmins();
  }, [router, locale]);

  const fetchAdmins = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/analytics`);
      const result = await res.json();
      if (result.success) setAdmins(result.admins);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/create-admin`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdmin),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      
      alert('Admin created successfully!');
      setNewAdmin({ name: '', phone: '', password: '' });
      fetchAdmins(); 
    } catch (err: any) { alert(err.message); }
  };

  const handleToggleLock = async (id: string) => {
    await fetch(`${apiUrl}/api/super-admin/admins/${id}/toggle-lock`, { method: 'POST' });
    fetchAdmins(); 
  };

  const handleResetPassword = async (adminId: string) => {
    const newPassword = prompt('Enter new password (min 4 chars):');
    if (!newPassword || newPassword.length < 4) return;
    
    await fetch(`${apiUrl}/api/super-admin/admins/${adminId}/reset-password`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword }),
    });
    alert('Password reset successfully.');
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Manage Admins</h1>
        <p className="text-gray-500 font-medium">Create new admins and manage existing accounts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Form */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 lg:col-span-1 h-fit">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Generate New Admin</h2>
          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <input type="text" placeholder="Name" value={newAdmin.name} onChange={e => setNewAdmin({...newAdmin, name: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]" required />
            <input type="tel" placeholder="Phone" value={newAdmin.phone} onChange={e => setNewAdmin({...newAdmin, phone: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]" required />
            <input type="password" placeholder="Password" value={newAdmin.password} onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]" required />
            <button type="submit" className="w-full bg-black text-white p-4 rounded-2xl font-bold hover:bg-gray-800 transition">Create Admin</button>
          </form>
        </div>

        {/* Admins List */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Active Admins</h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {admins.map((adm: any) => (
              <div key={adm.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-gray-50 rounded-2xl gap-3 border border-gray-100">
                <div>
                  <p className="font-bold text-gray-900">{adm.name}</p>
                  <p className="text-xs text-gray-500">{adm.phone} • {adm.isLocked ? '🔒 Locked' : '✅ Active'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleToggleLock(adm.id)} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${adm.isLocked ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                    {adm.isLocked ? 'Unlock' : 'Lock'}
                  </button>
                  <button onClick={() => handleResetPassword(adm.id)} className="px-4 py-2 rounded-xl text-xs font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-100">Reset PW</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}