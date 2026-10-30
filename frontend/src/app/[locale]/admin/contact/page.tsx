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

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Contact Settings</h1>
        <p className="text-gray-500 font-medium">Manage platforms (Telegram, Facebook) and support accounts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* SECTION 1: Manage Platforms */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">1. Add New Platform</h2>
            <form onSubmit={handleCreatePlatform} className="space-y-3">
              <input type="text" placeholder="Platform Name (e.g. Telegram)" value={newPlatform.name} onChange={e => setNewPlatform({...newPlatform, name: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl text-sm" required />
              <input type="url" placeholder="Base URL (e.g. https://t.me/)" value={newPlatform.baseUrl} onChange={e => setNewPlatform({...newPlatform, baseUrl: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl text-sm" required />
              <input type="url" placeholder="Logo URL (e.g. https://.../logo.png)" value={newPlatform.logoUrl} onChange={e => setNewPlatform({...newPlatform, logoUrl: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl text-sm" required />
              <button type="submit" className="w-full bg-black text-white p-3 rounded-xl font-bold hover:bg-gray-800 transition text-sm">Add Platform</button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Available Platforms</h2>
            <div className="space-y-2">
              {platforms.map((p: any) => (
                <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <img src={p.logoUrl} alt={p.name} className="w-8 h-8 rounded-full object-cover bg-white" />
                    <div>
                      <p className="font-bold text-sm text-gray-900">{p.name}</p>
                      <p className="text-[10px] text-gray-500">{p.baseUrl}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDeletePlatform(p.id)} className="text-red-500 text-xs font-bold hover:underline">Delete</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 2: Manage Contact Methods */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">2. Add Support Account</h2>
            <form onSubmit={handleCreateMethod} className="space-y-3">
              <input type="text" placeholder="Display Name (e.g. Abebe Support)" value={newMethod.name} onChange={e => setNewMethod({...newMethod, name: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl text-sm" required />
              <input type="text" placeholder="Username (e.g. @abebe_support)" value={newMethod.username} onChange={e => setNewMethod({...newMethod, username: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl text-sm" required />
              <select 
                value={newMethod.platformId} 
                onChange={e => setNewMethod({...newMethod, platformId: e.target.value})} 
                className="w-full p-3 bg-gray-50 border rounded-xl text-sm" 
                required
              >
                <option value="">Select a Platform...</option>
                {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button type="submit" className="w-full bg-[#B519FF] text-white p-3 rounded-xl font-bold hover:bg-purple-600 transition text-sm">Add Contact Account</button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Active Accounts</h2>
            <div className="space-y-2">
              {methods.map((m: any) => (
                <div key={m.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <img src={m.logoUrl} alt={m.name} className="w-8 h-8 rounded-full object-cover bg-white" />
                    <div>
                      <p className="font-bold text-sm text-gray-900">{m.name}</p>
                      <p className="text-[10px] text-gray-500">{m.platformName} • {m.username}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteMethod(m.id)} className="text-red-500 text-xs font-bold hover:underline">Delete</button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}