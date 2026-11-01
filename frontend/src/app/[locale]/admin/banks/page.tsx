'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminBanks({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [banks, setBanks] = useState<any[]>([]);
  const [newBankName, setNewBankName] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit State
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [editBankName, setEditBankName] = useState('');

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  useEffect(() => {
    if (user.role !== 'super_admin') return router.push(`/${locale}/auth`);
    fetchBanks();
  }, [router, locale]);

  const fetchBanks = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/banks`);
      const data = await res.json();
      if (data.success) setBanks(data.banks);
    } finally { setLoading(false); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/banks`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBankName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewBankName('');
      fetchBanks();
    } catch (err: any) { alert(err.message); }
  };

  const handleToggle = async (id: string) => {
    await fetch(`${apiUrl}/api/super-admin/banks/${id}/toggle`, { method: 'PUT' });
    fetchBanks();
  };

  const handleEditSubmit = async (id: string) => {
    if (!editBankName.trim()) return;
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/banks/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editBankName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setEditingBankId(null);
      setEditBankName('');
      fetchBanks();
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/banks/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      fetchBanks();
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-400">
      <div className="w-10 h-10 border-4 border-[#B519FF] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-bold tracking-widest uppercase text-xs">Loading Banks...</p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">Bank Management</h1>
        <p className="text-gray-400 font-medium">Manage the banks available for user withdrawals.</p>
      </div>

      {/* Add New Bank Form */}
      <div className="bg-[#131825] p-6 md:p-8 rounded-3xl border border-gray-800 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#B519FF]/5 rounded-full blur-3xl"></div>
        
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
          <svg className="w-5 h-5 text-[#B519FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Add New Bank
        </h2>
        
        <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 relative z-10">
          <div className="relative flex-1">
            <input 
              type="text" 
              value={newBankName}
              onChange={(e) => setNewBankName(e.target.value)}
              className="w-full p-4 bg-[#0B0F19] border border-gray-700 rounded-2xl text-sm text-white outline-none focus:border-[#B519FF]"
              required
            />
            {!newBankName && (
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                Bank Name (e.g. CBE, Awash, Telebirr)
              </span>
            )}
          </div>
          <button type="submit" className="bg-[#B519FF] text-white px-8 py-4 rounded-2xl font-bold hover:bg-purple-600 transition shadow-[0_0_15px_rgba(181,25,255,0.3)] whitespace-nowrap">
            Add Bank
          </button>
        </form>
      </div>

      {/* Bank List */}
      <div className="bg-[#131825] p-6 md:p-8 rounded-3xl border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
          Available Banks
        </h2>
        
        <div className="space-y-3">
          {banks.length === 0 && (
            <div className="text-center py-8 bg-[#0B0F19] rounded-xl border border-gray-800 border-dashed">
              <p className="text-gray-500 text-sm">No banks added yet.</p>
            </div>
          )}
          
          {banks.map((bank: any) => (
            <div key={bank.id} className="p-4 bg-[#0B0F19] rounded-2xl border border-gray-800 hover:border-gray-600 transition">
              
              {editingBankId === bank.id ? (
                <div className="flex flex-col sm:flex-row gap-2">
                  <input 
                    type="text" 
                    value={editBankName} 
                    onChange={(e) => setEditBankName(e.target.value)}
                    className="flex-1 p-2 bg-[#131825] border border-gray-600 rounded-lg text-sm text-white outline-none focus:border-[#B519FF]"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleEditSubmit(bank.id)} className="flex-1 sm:flex-none bg-[#B519FF] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-purple-600 transition">Save</button>
                    <button onClick={() => setEditingBankId(null)} className="flex-1 sm:flex-none bg-gray-800 text-gray-300 px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-700 transition">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 border border-gray-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                    </div>
                    <div>
                      <p className="font-bold text-white text-base">{bank.name}</p>
                      <p className={`text-xs font-bold mt-0.5 ${bank.isActive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {bank.isActive ? '✅ Active (Visible to users)' : '❌ Inactive (Hidden)'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => { setEditingBankId(bank.id); setEditBankName(bank.name); }}
                      className="flex-1 sm:flex-none bg-blue-500/10 text-blue-400 border border-blue-500/20 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-500/20 transition"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(bank.id, bank.name)}
                      className="flex-1 sm:flex-none bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-500/20 transition"
                    >
                      Delete
                    </button>
                    <button 
                      onClick={() => handleToggle(bank.id)}
                      className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition border ${
                        bank.isActive 
                          ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                      }`}
                    >
                      {bank.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}