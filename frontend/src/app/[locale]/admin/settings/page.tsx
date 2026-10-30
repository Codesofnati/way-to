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

  if (loading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Payment Settings</h1>
        <p className="text-gray-500 font-medium">Manage methods and pool accounts.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">1. Create Payment Method</h2>
        <form onSubmit={handleAddMethod} className="flex gap-4">
          <input 
            type="text" 
            placeholder="e.g. Telebirr, CBE Bank" 
            value={newMethodName}
            onChange={(e) => setNewMethodName(e.target.value)}
            className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]"
            required
          />
          <button type="submit" className="bg-black text-white px-8 py-4 rounded-2xl font-bold hover:bg-gray-800 transition">Create</button>
        </form>
      </div>

      <div className="space-y-6">
        {methods.map((method: any) => (
          <div key={method.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            
            {/* Method Header */}
            <div className="p-6 bg-gray-50 border-b border-gray-100">
              {editingMethodId === method.id ? (
                <div className="flex gap-2 w-full">
                  <input 
                    type="text" 
                    value={editMethodName} 
                    onChange={(e) => setEditMethodName(e.target.value)}
                    className="flex-1 p-3 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]"
                    autoFocus
                  />
                  <button onClick={() => handleEditMethodSubmit(method.id)} className="bg-[#B519FF] text-white px-6 py-3 rounded-xl text-sm font-bold">Save</button>
                  <button onClick={() => setEditingMethodId(null)} className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl text-sm font-bold">Cancel</button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{method.name}</h3>
                    <p className="text-xs text-gray-500">{method.isActive ? '✅ Active' : '❌ Inactive'} • {method.accounts.length} Accounts</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setAddingAccountTo(addingAccountTo === method.id ? null : method.id)} className="bg-[#B519FF] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-purple-600 transition">
                      + Add Account
                    </button>
                    <button onClick={() => { setEditingMethodId(method.id); setEditMethodName(method.name); }} className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-200 transition">
                      Edit
                    </button>
                    <button onClick={() => handleDeleteMethod(method.id, method.name)} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition">
                      Delete
                    </button>
                    <button onClick={() => handleToggleMethod(method.id)} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${method.isActive ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {method.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Add Account Form */}
            {addingAccountTo === method.id && (
              <div className="p-6 bg-purple-50 border-b border-purple-100">
                <form onSubmit={(e) => handleAddAccount(e, method.id)} className="flex flex-col md:flex-row gap-4">
                  <input type="text" placeholder="Account Name" value={newAccount.accountName} onChange={e => setNewAccount({...newAccount, accountName: e.target.value})} className="flex-1 p-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]" required />
                  <input type="text" placeholder="Account Number" value={newAccount.accountNumber} onChange={e => setNewAccount({...newAccount, accountNumber: e.target.value})} className="flex-1 p-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]" required />
                  <button type="submit" className="bg-[#B519FF] text-white px-6 py-3 rounded-xl font-bold text-sm">Save</button>
                </form>
              </div>
            )}

            {/* Accounts List */}
            <div className="p-6 space-y-3">
              {method.accounts.length === 0 && <p className="text-sm text-gray-500">No accounts added yet.</p>}
              
              {method.accounts.map((acc: any) => (
                <div key={acc.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  
                  {/* Edit Account Mode */}
                  {editingAccountId === acc.id ? (
                    <form onSubmit={(e) => handleEditAccountSubmit(e, acc.id)} className="flex flex-col md:flex-row gap-3">
                      <input type="text" value={editAccountData.accountName} onChange={e => setEditAccountData({...editAccountData, accountName: e.target.value})} className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-sm" required />
                      <input type="text" value={editAccountData.accountNumber} onChange={e => setEditAccountData({...editAccountData, accountNumber: e.target.value})} className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-sm" required />
                      <div className="flex gap-2">
                        <button type="submit" className="bg-[#B519FF] text-white px-4 py-2 rounded-lg text-xs font-bold">Save</button>
                        <button type="button" onClick={() => setEditingAccountId(null)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-xs font-bold">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    /* Normal View */
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <p className="font-bold text-gray-900">{acc.accountName}</p>
                        <p className="font-mono text-sm text-gray-600">{acc.accountNumber}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setEditingAccountId(acc.id);
                            setEditAccountData({ accountName: acc.accountName, accountNumber: acc.accountNumber });
                          }} 
                          className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-100 transition"
                        >
                          Edit
                        </button>
                        <button onClick={() => handleDeleteAccount(acc.id)} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-100 transition">Delete</button>
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