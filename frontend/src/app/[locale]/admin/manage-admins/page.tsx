'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function ManageAdmins({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [admins, setAdmins] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any[]>([]);
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
      if (result.success) {
        setAdmins(result.admins);
        setPerformance(result.analytics.adminPerformance || []);
      }
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

  const handleDeleteAdmin = async (adminId: string, name: string) => {
    if (!confirm(`Are you absolutely sure you want to DELETE admin "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/admins/${adminId}`, { method: 'DELETE' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      fetchAdmins();
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-400">
      <div className="w-10 h-10 border-4 border-[#B519FF] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-bold tracking-widest uppercase text-xs">Loading Admins...</p>
    </div>
  );

  // ✅ Find the Best Admin (Highest Net Volume)
  const bestAdmin = performance.length > 0 
    ? [...performance].sort((a, b) => b.netVolume - a.netVolume)[0] 
    : null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">Manage Admins</h1>
        <p className="text-gray-400 font-medium">Create, manage, and track admin performance.</p>
      </div>

      {/* ✅ Best Admin Banner */}
      {bestAdmin && (
        <div className="bg-gradient-to-r from-[#B519FF] to-purple-900 p-1 rounded-3xl relative overflow-hidden shadow-[0_0_30px_rgba(181,25,255,0.15)]">
          <div className="bg-[#0B0F19] p-6 rounded-[1.4rem] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-tr from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L5 10.274zm10 0l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L15 10.274z" clipRule="evenodd"></path></svg>
              </div>
              <div>
                <p className="text-[10px] text-yellow-400 uppercase font-bold tracking-widest mb-1">Top Performing Admin</p>
                <h2 className="text-2xl font-black text-white">{bestAdmin.name}</h2>
              </div>
            </div>
            <div className="text-left sm:text-right bg-white/5 py-3 px-6 rounded-2xl border border-white/10">
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Net Volume Processed</p>
              <p className="text-3xl font-black text-emerald-400">ETB {bestAdmin.netVolume.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ✅ Create Form (Glassmorphism Dark) */}
        <div className="bg-[#131825] p-6 md:p-8 rounded-3xl border border-gray-800 lg:col-span-1 h-fit relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#B519FF]/10 rounded-full blur-3xl"></div>
          
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
            <svg className="w-5 h-5 text-[#B519FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
            Generate Admin
          </h2>
          
          <form onSubmit={handleCreateAdmin} className="space-y-4 relative z-10">
            
            {/* Name Input */}
            <div className="relative">
              <input 
                type="text" 
                value={newAdmin.name} 
                onChange={e => setNewAdmin({...newAdmin, name: e.target.value})} 
                className="w-full p-4 bg-[#0B0F19] border border-gray-700 rounded-2xl text-sm text-white outline-none focus:border-[#B519FF] transition-colors pl-12" 
                required 
              />
              {!newAdmin.name && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">Full Name</span>}
              <svg className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            </div>

            {/* Phone Input */}
            <div className="relative">
              <input 
                type="tel" 
                value={newAdmin.phone} 
                onChange={e => setNewAdmin({...newAdmin, phone: e.target.value})} 
                className="w-full p-4 bg-[#0B0F19] border border-gray-700 rounded-2xl text-sm text-white outline-none focus:border-[#B519FF] transition-colors pl-12" 
                required 
              />
              {!newAdmin.phone && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">Phone Number</span>}
              <svg className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
            </div>

            {/* Password Input */}
            <div className="relative">
              <input 
                type="password" 
                value={newAdmin.password} 
                onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} 
                className="w-full p-4 bg-[#0B0F19] border border-gray-700 rounded-2xl text-sm text-white outline-none focus:border-[#B519FF] transition-colors pl-12" 
                required 
              />
              {!newAdmin.password && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">Password</span>}
              <svg className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>

            <button type="submit" className="w-full bg-[#B519FF] text-white p-4 rounded-2xl font-bold hover:bg-purple-600 transition shadow-[0_0_15px_rgba(181,25,255,0.3)]">
              Create Admin
            </button>
          </form>
        </div>

        {/* ✅ Admins List with Performance (Dark Cards) */}
        <div className="bg-[#131825] p-6 md:p-8 rounded-3xl border border-gray-800 lg:col-span-2">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            Active Admins & Performance
          </h2>
          
          <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
            {admins.map((adm: any) => {
              const stats = performance.find(p => p.id === adm.id) || { depositsCount: 0, depositsVolume: 0, withdrawalsCount: 0, withdrawalsVolume: 0, netVolume: 0 };
              
              return (
                <div key={adm.id} className="p-5 bg-[#0B0F19] rounded-2xl border border-gray-800 hover:border-[#B519FF]/30 transition-colors space-y-4">
                  
                  {/* Admin Info & Actions */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold border border-gray-700">
                        {adm.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-lg text-white">{adm.name}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          {adm.phone} • 
                          {adm.isLocked ? (
                            <span className="text-orange-400 flex items-center gap-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path></svg> Locked</span>
                          ) : (
                            <span className="text-emerald-400 flex items-center gap-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg> Active</span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => handleToggleLock(adm.id)} className={`px-3 py-2 rounded-xl text-xs font-bold transition ${adm.isLocked ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20'}`}>
                        {adm.isLocked ? 'Unlock' : 'Lock'}
                      </button>
                      <button onClick={() => handleResetPassword(adm.id)} className="px-3 py-2 rounded-xl text-xs font-bold bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 transition">Reset PW</button>
                      <button onClick={() => handleDeleteAdmin(adm.id, adm.name)} className="px-3 py-2 rounded-xl text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition">Delete</button>
                    </div>
                  </div>

                  {/* ✅ Admin Performance Grid */}
                  <div className="grid grid-cols-3 gap-3 border-t border-gray-800 pt-4">
                    <div className="bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/10">
                      <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Deposits</p>
                      <p className="font-bold text-emerald-400 text-sm md:text-base">ETB {stats.depositsVolume.toFixed(2)}</p>
                      <p className="text-[10px] text-gray-500 mt-1">{stats.depositsCount} tickets</p>
                    </div>
                    <div className="bg-red-500/5 rounded-xl p-3 border border-red-500/10">
                      <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">Withdrawals</p>
                      <p className="font-bold text-red-400 text-sm md:text-base">ETB {stats.withdrawalsVolume.toFixed(2)}</p>
                      <p className="text-[10px] text-gray-500 mt-1">{stats.withdrawalsCount} tickets</p>
                    </div>
                    <div className="bg-[#B519FF]/5 rounded-xl p-3 border border-[#B519FF]/10">
                      <p className="text-[10px] font-bold text-[#B519FF] uppercase tracking-widest mb-1">Net Volume</p>
                      <p className={`font-black text-sm md:text-base ${stats.netVolume >= 0 ? 'text-white' : 'text-red-400'}`}>ETB {stats.netVolume.toFixed(2)}</p>
                      <p className="text-[10px] text-gray-500 mt-1">Dep - Wth</p>
                    </div>
                  </div>

                </div>
              );
            })}
            
            {admins.length === 0 && (
              <div className="text-center py-12 bg-[#0B0F19] rounded-2xl border border-gray-800 border-dashed">
                <p className="text-gray-500 text-sm">No admins found. Create one using the form.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}