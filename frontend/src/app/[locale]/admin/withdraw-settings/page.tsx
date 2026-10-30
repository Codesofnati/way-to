'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function WithdrawSettings({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [taxPercent, setTaxPercent] = useState('');
  const [amounts, setAmounts] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ New Amount State
  const [newAmount, setNewAmount] = useState('');

  // ✅ Edit Amount State
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editAmountValue, setEditAmountValue] = useState('');

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  useEffect(() => {
    if (user.role !== 'super_admin') return router.push(`/${locale}/auth`);
    
    fetch(`${apiUrl}/api/withdraw-settings`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) {
          setTaxPercent(data.settings.taxPercent);
          setAmounts(JSON.parse(data.settings.amounts));
        }
      })
      .finally(() => setLoading(false));
  }, [router, locale, apiUrl, user.role]);

  // Save to database
  const saveToDatabase = async (updatedAmounts: number[], updatedTax: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/withdraw-settings`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taxPercent: updatedTax, amounts: updatedAmounts })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return true;
    } catch (err: any) { 
      alert(err.message); 
      return false;
    }
  };

  const handleSaveTax = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await saveToDatabase(amounts, taxPercent)) {
      alert('Tax percentage updated!');
    }
  };

  const handleAddAmount = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newAmount);
    if (isNaN(val) || val <= 0) return alert('Enter a valid amount');
    if (amounts.includes(val)) return alert('Amount already exists');

    const updated = [...amounts, val].sort((a, b) => a - b); // Sort ascending
    if (await saveToDatabase(updated, taxPercent)) {
      setAmounts(updated);
      setNewAmount('');
    }
  };

  const handleEditAmount = async (index: number) => {
    const val = parseFloat(editAmountValue);
    if (isNaN(val) || val <= 0) return alert('Enter a valid amount');
    
    const updated = [...amounts];
    updated[index] = val;
    updated.sort((a, b) => a - b);

    if (await saveToDatabase(updated, taxPercent)) {
      setAmounts(updated);
      setEditingIndex(null);
      setEditAmountValue('');
    }
  };

  const handleDeleteAmount = async (amountToDelete: number) => {
    if (!confirm(`Delete ETB ${amountToDelete} option?`)) return;
    
    const updated = amounts.filter(a => a !== amountToDelete);
    if (await saveToDatabase(updated, taxPercent)) {
      setAmounts(updated);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Withdrawal Settings</h1>
        <p className="text-gray-500 font-medium">Manage tax rates and pre-set withdrawable amounts.</p>
      </div>

      {/* Tax Settings */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">1. Tax Percentage</h2>
        <form onSubmit={handleSaveTax} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Withdrawal Tax (%)</label>
            <input type="number" step="0.1" value={taxPercent} onChange={e => setTaxPercent(e.target.value)} className="w-full p-4 bg-gray-50 border rounded-2xl" required />
            <p className="text-xs text-gray-400 mt-1">Example: 5 for 5%. Deducted from the requested amount.</p>
          </div>
          <button type="submit" className="bg-black text-white px-8 py-4 rounded-2xl font-bold hover:bg-gray-800 transition h-[58px]">Save Tax</button>
        </form>
      </div>

      {/* Amounts Settings */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">2. Allowed Withdraw Amounts</h2>
        
        {/* Add New Amount */}
        <form onSubmit={handleAddAmount} className="flex gap-4 mb-6">
          <input 
            type="number" 
            value={newAmount} 
            onChange={e => setNewAmount(e.target.value)} 
            placeholder="Enter amount (e.g. 500)" 
            className="flex-1 p-4 bg-gray-50 border rounded-2xl" 
            required 
          />
          <button type="submit" className="bg-[#B519FF] text-white px-8 py-4 rounded-2xl font-bold hover:bg-purple-600 transition">Add Amount</button>
        </form>

        {/* List of Amounts */}
        <div className="space-y-3">
          {amounts.length === 0 && <p className="text-sm text-gray-500">No amounts added yet.</p>}
          
          {amounts.map((amount, index) => (
            <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
              
              {/* Edit Mode */}
              {editingIndex === index ? (
                <div className="flex gap-2 w-full">
                  <input 
                    type="number" 
                    value={editAmountValue} 
                    onChange={(e) => setEditAmountValue(e.target.value)}
                    className="flex-1 p-2 bg-white border border-gray-300 rounded-lg text-sm"
                    autoFocus
                  />
                  <button onClick={() => handleEditAmount(index)} className="bg-[#B519FF] text-white px-4 py-2 rounded-lg text-xs font-bold">Save</button>
                  <button onClick={() => setEditingIndex(null)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-xs font-bold">Cancel</button>
                </div>
              ) : (
                
                /* Normal View */
                <>
                  <p className="font-bold text-lg text-gray-900">ETB {amount}</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setEditingIndex(index); setEditAmountValue(amount.toString()); }}
                      className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-200 transition"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteAmount(amount)}
                      className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}