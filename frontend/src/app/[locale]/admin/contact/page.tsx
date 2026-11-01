'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminContact({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Platform State
  const [newPlatform, setNewPlatform] = useState({ name: '', baseUrl: '', logoUrl: '' });

  // Method State
  const [newMethod, setNewMethod] = useState({ name: '', username: '', platformId: '' });

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  useEffect(() => {
    if (user.role !== 'super_admin') return router.push(`/${locale}/auth`);
    fetchData();
  }, [router, locale]);

  const fetchData = async () => {
    try {
      const [platRes, methRes] = await Promise.all([
        fetch(`${apiUrl}/api/super-admin/platforms`).then(res => res.json()),
        fetch(`${apiUrl}/api/super-admin/contact-methods`).then(res => res.json())
      ]);
      if (platRes.success) setPlatforms(platRes.platforms);
      if (methRes.success) setMethods(methRes.methods);
    } finally { setLoading(false); }
  };

  const handleCreatePlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/platforms`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlatform)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewPlatform({ name: '', baseUrl: '', logoUrl: '' });
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  const handleDeletePlatform = async (id: string) => {
    if (!confirm('Delete this platform?')) return;
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/platforms/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  const handleCreateMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/contact-methods`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMethod)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewMethod({ name: '', username: '', platformId: '' });
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  const handleDeleteMethod = async (id: string) => {
    if (!confirm('Delete this contact method?')) return;
    await fetch(`${apiUrl}/api/super-admin/contact-methods/${id}`, { method: 'DELETE' });
    fetchData();
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-400">
      <div className="w-10 h-10 border-4 border-[#B519FF] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-bold tracking-widest uppercase text-xs">Loading Settings...</p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">Contact Settings</h1>
        <p className="text-gray-400 font-medium">Manage platforms (Telegram, Facebook) and support accounts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* SECTION 1: Manage Platforms */}
        <div className="space-y-6">
          
          {/* Create Platform Form */}
          <div className="bg-[#131825] p-6 md:p-8 rounded-3xl border border-gray-800 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#B519FF]/5 rounded-full blur-3xl"></div>
            
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
              <svg className="w-5 h-5 text-[#B519FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Add New Platform
            </h2>
            
            <form onSubmit={handleCreatePlatform} className="space-y-4 relative z-10">
              
              <div className="relative">
                <input type="text" value={newPlatform.name} onChange={e => setNewPlatform({...newPlatform, name: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-[#B519FF]" required />
                {!newPlatform.name && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">Platform Name (e.g. Telegram)</span>}
              </div>

              <div className="relative">
                <input type="url" value={newPlatform.baseUrl} onChange={e => setNewPlatform({...newPlatform, baseUrl: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-[#B519FF]" required />
                {!newPlatform.baseUrl && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">Base URL (e.g. https://t.me/)</span>}
              </div>

              <div className="relative">
                <input type="url" value={newPlatform.logoUrl} onChange={e => setNewPlatform({...newPlatform, logoUrl: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-[#B519FF]" required />
                {!newPlatform.logoUrl && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">Logo URL (e.g. https://.../logo.png)</span>}
              </div>

              <button type="submit" className="w-full bg-[#B519FF] text-white p-3 rounded-xl font-bold hover:bg-purple-600 transition shadow-[0_0_15px_rgba(181,25,255,0.3)] text-sm mt-2">Add Platform</button>
            </form>
          </div>

          {/* List Platforms */}
          <div className="bg-[#131825] p-6 md:p-8 rounded-3xl border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-4">Available Platforms</h2>
            <div className="space-y-3">
              {platforms.length === 0 && <p className="text-sm text-gray-500 italic">No platforms added yet.</p>}
              {platforms.map((p: any) => (
                <div key={p.id} className="flex justify-between items-center p-4 bg-[#0B0F19] rounded-xl border border-gray-800 hover:border-gray-600 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-700">
                      <img src={p.logoUrl} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">{p.name}</p>
                      <p className="text-[10px] text-gray-500 truncate max-w-[150px]">{p.baseUrl}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDeletePlatform(p.id)} className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-500/20 transition">Delete</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 2: Manage Contact Methods */}
        <div className="space-y-6">
          
          {/* Create Method Form */}
          <div className="bg-[#131825] p-6 md:p-8 rounded-3xl border border-gray-800 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#B519FF]/5 rounded-full blur-3xl"></div>
            
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
              <svg className="w-5 h-5 text-[#B519FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
              Add Support Account
            </h2>
            
            <form onSubmit={handleCreateMethod} className="space-y-4 relative z-10">
              
              <div className="relative">
                <input type="text" value={newMethod.name} onChange={e => setNewMethod({...newMethod, name: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-[#B519FF]" required />
                {!newMethod.name && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">Display Name (e.g. Abebe Support)</span>}
              </div>

              <div className="relative">
                <input type="text" value={newMethod.username} onChange={e => setNewMethod({...newMethod, username: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-[#B519FF]" required />
                {!newMethod.username && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">Username (e.g. @abebe_support)</span>}
              </div>

              <div className="relative">
                <select 
                  value={newMethod.platformId} 
                  onChange={e => setNewMethod({...newMethod, platformId: e.target.value})} 
                  className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-[#B519FF] appearance-none" 
                  required
                >
                  <option value="" disabled hidden>Select a Platform...</option>
                  {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {!newMethod.platformId && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">Select a Platform...</span>
                )}
                <svg className="w-5 h-5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>

              <button type="submit" className="w-full bg-[#B519FF] text-white p-3 rounded-xl font-bold hover:bg-purple-600 transition shadow-[0_0_15px_rgba(181,25,255,0.3)] text-sm mt-2">Add Contact Account</button>
            </form>
          </div>

          {/* List Methods */}
          <div className="bg-[#131825] p-6 md:p-8 rounded-3xl border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-4">Active Accounts</h2>
            <div className="space-y-3">
              {methods.length === 0 && <p className="text-sm text-gray-500 italic">No support accounts added yet.</p>}
              {methods.map((m: any) => (
                <div key={m.id} className="flex justify-between items-center p-4 bg-[#0B0F19] rounded-xl border border-gray-800 hover:border-gray-600 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-700">
                      <img src={m.logoUrl} alt={m.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">{m.name}</p>
                      <p className="text-[10px] text-gray-500">{m.platformName} • {m.username}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteMethod(m.id)} className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-500/20 transition">Delete</button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}