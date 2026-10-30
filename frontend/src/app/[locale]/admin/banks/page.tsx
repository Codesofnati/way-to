'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminBanks({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [banks, setBanks] = useState<any[]>([]);
  const [newBankName, setNewBankName] = useState('');
  const [loading, setLoading] = useState(true);

  // ✅ Edit State
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

  // ✅ Handle Edit Submit
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

  // ✅ Handle Delete
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/banks/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      fetchBanks();
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading banks...</div>;

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Bank Management</h1>
        <p className="text-gray-500 font-medium">Manage the banks available for user withdrawals.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Add New Bank</h2>
        <form onSubmit={handleAdd} className="flex gap-4">
          <input 
            type="text" 
            placeholder="Bank Name (e.g. CBE, Awash, Telebirr)" 
            value={newBankName}
            onChange={(e) => setNewBankName(e.target.value)}
            className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]"
            required
          />
          <button type="submit" className="bg-black text-white px-8 py-4 rounded-2xl font-bold hover:bg-gray-800 transition">Add Bank</button>
        </form>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Available Banks</h2>
        <div className="space-y-3">
          {banks.length === 0 && <p className="text-sm text-gray-500">No banks added yet.</p>}
          
          {banks.map((bank: any) => (
            <div key={bank.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              
              {/* ✅ Edit Mode */}
              {editingBankId === bank.id ? (
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={editBankName} 
                    onChange={(e) => setEditBankName(e.target.value)}
                    className="flex-1 p-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]"
                    autoFocus
                  />
                  <button onClick={() => handleEditSubmit(bank.id)} className="bg-[#B519FF] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-purple-600">Save</button>
                  <button onClick={() => setEditingBankId(null)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-300">Cancel</button>
                </div>
              ) : (
                
                /* ✅ Normal View */
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <p className="font-bold text-gray-900">{bank.name}</p>
                    <p className="text-xs text-gray-500">{bank.isActive ? '✅ Active (Visible to users)' : '❌ Inactive (Hidden)'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setEditingBankId(bank.id); setEditBankName(bank.name); }}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(bank.id, bank.name)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 transition"
                    >
                      Delete
                    </button>
                    <button 
                      onClick={() => handleToggle(bank.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition ${bank.isActive ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
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