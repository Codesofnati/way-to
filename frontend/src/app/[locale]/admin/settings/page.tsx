'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentSettings({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [methods, setMethods] = useState<any[]>([]);
  const [newMethod, setNewMethod] = useState({ name: '', accountName: '', accountNumber: '' });
  
  // ✅ NEW: State for editing
  const [editingMethod, setEditingMethod] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  useEffect(() => {
    if (user.role !== 'super_admin') {
      router.push(`/${locale}/auth`);
      return;
    }
    fetchMethods();
  }, [router, locale]);

  const fetchMethods = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/payment-methods`);
      const data = await res.json();
      if (data.success) setMethods(data.methods);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/payment-methods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMethod)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setNewMethod({ name: '', accountName: '', accountNumber: '' });
      fetchMethods();
    } catch (err: any) { alert(err.message); }
  };

  // ✅ NEW: Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/payment-methods/${editingMethod.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingMethod)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert('Method updated successfully!');
      setEditingMethod(null); // Close edit mode
      fetchMethods();
    } catch (err: any) { alert(err.message); }
  };

  const handleToggle = async (id: string) => {
    await fetch(`${apiUrl}/api/super-admin/payment-methods/${id}/toggle`, { method: 'PUT' });
    fetchMethods();
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Payment Settings</h1>
        <p className="text-gray-500 font-medium">Manage banks, account numbers, and wallet addresses.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Add New Method</h2>
        <form onSubmit={handleAdd} className="space-y-4">
          <input 
            type="text" 
            placeholder="Method Name (e.g. CBE Bank)" 
            value={newMethod.name}
            onChange={(e) => setNewMethod({...newMethod, name: e.target.value})}
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]"
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="text" 
              placeholder="Account Name" 
              value={newMethod.accountName}
              onChange={(e) => setNewMethod({...newMethod, accountName: e.target.value})}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]"
              required
            />
            <input 
              type="text" 
              placeholder="Account Number" 
              value={newMethod.accountNumber}
              onChange={(e) => setNewMethod({...newMethod, accountNumber: e.target.value})}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]"
              required
            />
          </div>
          <button type="submit" className="w-full bg-black text-white px-8 py-4 rounded-2xl font-bold hover:bg-gray-800 transition">
            Add Payment Method
          </button>
        </form>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Current Methods</h2>
        <div className="space-y-3">
          {methods.length === 0 && <p className="text-sm text-gray-500">No methods added yet.</p>}
          
          {methods.map((method: any) => (
            <div key={method.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              
              {/* ✅ If this method is being edited, show the edit form */}
              {editingMethod?.id === method.id ? (
                <form onSubmit={handleEditSubmit} className="space-y-3">
                  <input 
                    type="text" 
                    value={editingMethod.name}
                    onChange={(e) => setEditingMethod({...editingMethod, name: e.target.value})}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]"
                    required
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input 
                      type="text" 
                      value={editingMethod.accountName}
                      onChange={(e) => setEditingMethod({...editingMethod, accountName: e.target.value})}
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]"
                      required
                    />
                    <input 
                      type="text" 
                      value={editingMethod.accountNumber}
                      onChange={(e) => setEditingMethod({...editingMethod, accountNumber: e.target.value})}
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="bg-[#B519FF] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-purple-600 transition">Save</button>
                    <button type="button" onClick={() => setEditingMethod(null)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-300 transition">Cancel</button>
                  </div>
                </form>
              ) : (
                
                /* ✅ Normal View */
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <p className="font-bold text-gray-900">{method.name}</p>
                    <p className="text-sm text-gray-600">Name: {method.accountName}</p>
                    <p className="text-sm font-mono text-gray-600">Acc: {method.accountNumber}</p>
                    <p className="text-xs text-gray-500 mt-1">{method.isActive ? '✅ Active' : '❌ Inactive'}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setEditingMethod(method)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleToggle(method.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition ${method.isActive ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
                    >
                      {method.isActive ? 'Disable' : 'Enable'}
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