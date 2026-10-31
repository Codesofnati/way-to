'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentSettings({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [methods, setMethods] = useState<any[]>([]);
  const [newMethodName, setNewMethodName] = useState('');
  const [loading, setLoading] = useState(true);

  // Add Account State
  const [addingAccountTo, setAddingAccountTo] = useState<string | null>(null);
  const [newAccount, setNewAccount] = useState({ accountName: '', accountNumber: '' });

  // Edit Method State
  const [editingMethodId, setEditingMethodId] = useState<string | null>(null);
  const [editMethodName, setEditMethodName] = useState('');

  // Edit Account State
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editAccountData, setEditAccountData] = useState({ accountName: '', accountNumber: '' });

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  useEffect(() => {
    if (user.role !== 'super_admin') return router.push(`/${locale}/auth`);
    fetchMethods();
  }, [router, locale]);

  const fetchMethods = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/payment-methods`);
      const data = await res.json();
      if (data.success) setMethods(data.methods);
    } finally { setLoading(false); }
  };

  // --- METHOD ACTIONS ---
  const handleAddMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/payment-methods`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newMethodName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewMethodName('');
      fetchMethods();
    } catch (err: any) { alert(err.message); }
  };

  const handleEditMethodSubmit = async (id: string) => {
    if (!editMethodName.trim()) return;
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/payment-methods/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editMethodName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEditingMethodId(null);
      fetchMethods();
    } catch (err: any) { alert(err.message); }
  };

  const handleDeleteMethod = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" and all its accounts? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/payment-methods/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchMethods();
    } catch (err: any) { alert(err.message); }
  };

  const handleToggleMethod = async (id: string) => {
    await fetch(`${apiUrl}/api/super-admin/payment-methods/${id}/toggle`, { method: 'PUT' });
    fetchMethods();
  };

  // --- ACCOUNT ACTIONS ---
  const handleAddAccount = async (e: React.FormEvent, methodId: string) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/payment-methods/${methodId}/accounts`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccount)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewAccount({ accountName: '', accountNumber: '' });
      setAddingAccountTo(null);
      fetchMethods();
    } catch (err: any) { alert(err.message); }
  };

  const handleEditAccountSubmit = async (e: React.FormEvent, accountId: string) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/payment-accounts/${accountId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editAccountData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEditingAccountId(null);
      fetchMethods();
    } catch (err: any) { alert(err.message); }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Delete this account?')) return;
    await fetch(`${apiUrl}/api/super-admin/payment-accounts/${accountId}`, { method: 'DELETE' });
    fetchMethods();
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-400">
      <div className="w-10 h-10 border-4 border-[#B519FF] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-bold tracking-widest uppercase text-xs">Loading Settings...</p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">Payment Settings</h1>
        <p className="text-gray-400 font-medium">Manage payment methods and pool accounts.</p>
      </div>

      {/* Create Method Form */}
      <div className="bg-[#131825] p-6 md:p-8 rounded-3xl border border-gray-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#B519FF]/5 rounded-full blur-2xl"></div>
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
          <svg className="w-5 h-5 text-[#B519FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Create Payment Method
        </h2>
        <form onSubmit={handleAddMethod} className="flex flex-col md:flex-row gap-4 relative z-10">
          <div className="relative flex-1">
            <input 
              type="text" 
              value={newMethodName}
              onChange={(e) => setNewMethodName(e.target.value)}
              className="w-full p-4 bg-[#0B0F19] border border-gray-700 rounded-2xl text-sm text-white focus:border-[#B519FF] outline-none transition-colors"
              required
            />
            {!newMethodName && (
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                e.g. Telebirr, CBE Bank
              </span>
            )}
          </div>
          <button type="submit" className="bg-[#B519FF] text-white px-8 py-4 rounded-2xl font-bold hover:bg-purple-600 transition shadow-[0_0_15px_rgba(181,25,255,0.3)]">
            Create Method
          </button>
        </form>
      </div>

      {/* Methods List */}
      <div className="space-y-6">
        {methods.map((method: any) => (
          <div key={method.id} className="bg-[#131825] rounded-3xl border border-gray-800 overflow-hidden">
            
            {/* Method Header */}
            <div className="p-6 bg-[#0B0F19] border-b border-gray-800">
              {editingMethodId === method.id ? (
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <input 
                    type="text" 
                    value={editMethodName} 
                    onChange={(e) => setEditMethodName(e.target.value)}
                    className="flex-1 p-3 bg-[#131825] border border-gray-600 rounded-xl text-sm text-white outline-none focus:border-[#B519FF]"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleEditMethodSubmit(method.id)} className="flex-1 sm:flex-none bg-[#B519FF] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-purple-600 transition">Save</button>
                    <button onClick={() => setEditingMethodId(null)} className="flex-1 sm:flex-none bg-gray-800 text-gray-300 px-6 py-3 rounded-xl text-sm font-bold hover:bg-gray-700 transition">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                      {method.name}
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${method.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {method.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">{method.accounts.length} Linked Accounts</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setAddingAccountTo(addingAccountTo === method.id ? null : method.id)} className="bg-[#B519FF] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-purple-600 transition shadow-[0_0_10px_rgba(181,25,255,0.2)]">
                      + Add Account
                    </button>
                    <button onClick={() => { setEditingMethodId(method.id); setEditMethodName(method.name); }} className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-500/20 transition">
                      Edit
                    </button>
                    <button onClick={() => handleToggleMethod(method.id)} className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${method.isActive ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'}`}>
                      {method.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button onClick={() => handleDeleteMethod(method.id, method.name)} className="bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-500/20 transition">
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Add Account Form */}
            {addingAccountTo === method.id && (
              <div className="p-6 bg-[#B519FF]/5 border-b border-[#B519FF]/10">
                <form onSubmit={(e) => handleAddAccount(e, method.id)} className="flex flex-col md:flex-row gap-4">
                  
                  {/* Account Name Input */}
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      value={newAccount.accountName} 
                      onChange={e => setNewAccount({...newAccount, accountName: e.target.value})} 
                      className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-[#B519FF]" 
                      required 
                    />
                    {!newAccount.accountName && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">Account Name</span>}
                  </div>

                  {/* Account Number Input */}
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      value={newAccount.accountNumber} 
                      onChange={e => setNewAccount({...newAccount, accountNumber: e.target.value})} 
                      className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-[#B519FF]" 
                      required 
                    />
                    {!newAccount.accountNumber && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">Account Number</span>}
                  </div>

                  <button type="submit" className="bg-[#B519FF] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-purple-600 transition">Save Account</button>
                </form>
              </div>
            )}

            {/* Accounts List */}
            <div className="p-6 space-y-3">
              {method.accounts.length === 0 && <p className="text-sm text-gray-500 italic text-center py-4">No accounts added to this method yet.</p>}
              
              {method.accounts.map((acc: any) => (
                <div key={acc.id} className="p-4 bg-[#0B0F19] rounded-2xl border border-gray-800 hover:border-gray-600 transition-colors">
                  
                  {/* Edit Account Mode */}
                  {editingAccountId === acc.id ? (
                    <form onSubmit={(e) => handleEditAccountSubmit(e, acc.id)} className="flex flex-col md:flex-row gap-3">
                      <input type="text" value={editAccountData.accountName} onChange={e => setEditAccountData({...editAccountData, accountName: e.target.value})} className="flex-1 p-2 bg-[#131825] border border-gray-600 rounded-lg text-sm text-white outline-none focus:border-[#B519FF]" required />
                      <input type="text" value={editAccountData.accountNumber} onChange={e => setEditAccountData({...editAccountData, accountNumber: e.target.value})} className="flex-1 p-2 bg-[#131825] border border-gray-600 rounded-lg text-sm text-white outline-none focus:border-[#B519FF]" required />
                      <div className="flex gap-2">
                        <button type="submit" className="flex-1 bg-[#B519FF] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-purple-600 transition">Save</button>
                        <button type="button" onClick={() => setEditingAccountId(null)} className="flex-1 bg-gray-800 text-gray-300 px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-700 transition">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    /* Normal View */
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 border border-gray-700">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                        </div>
                        <div>
                          <p className="font-bold text-white">{acc.accountName}</p>
                          <p className="font-mono text-xs text-gray-400 mt-0.5">{acc.accountNumber}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setEditingAccountId(acc.id);
                            setEditAccountData({ accountName: acc.accountName, accountNumber: acc.accountNumber });
                          }} 
                          className="flex-1 sm:flex-none bg-blue-500/10 text-blue-400 border border-blue-500/20 px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-500/20 transition"
                        >
                          Edit
                        </button>
                        <button onClick={() => handleDeleteAccount(acc.id)} className="flex-1 sm:flex-none bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-500/20 transition">
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}