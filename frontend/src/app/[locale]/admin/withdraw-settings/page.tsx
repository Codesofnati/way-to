'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function WithdrawSettings({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [taxPercent, setTaxPercent] = useState('');
  const [amounts, setAmounts] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // New Amount State
  const [newAmount, setNewAmount] = useState('');

  // Edit Amount State
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

    const updated = [...amounts, val].sort((a, b) => a - b);
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

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-400">
      <div className="w-10 h-10 border-4 border-[#B519FF] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-bold tracking-widest uppercase text-xs">Loading Settings...</p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-12">
      
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">Withdrawal Settings</h1>
        <p className="text-gray-400 font-medium">Manage tax rates and pre-set withdrawable amounts.</p>
      </div>

      {/* Tax Settings */}
      <div className="bg-[#131825] p-6 md:p-8 rounded-3xl border border-gray-800 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#B519FF]/5 rounded-full blur-3xl"></div>
        
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
          <svg className="w-5 h-5 text-[#B519FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"></path></svg>
          Tax Percentage
        </h2>
        
        <form onSubmit={handleSaveTax} className="flex flex-col md:flex-row gap-4 items-start md:items-end relative z-10">
          <div className="flex-1 w-full">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Withdrawal Tax (%)</label>
            <div className="relative">
              <input 
                type="number" 
                step="0.1" 
                value={taxPercent} 
                onChange={e => setTaxPercent(e.target.value)} 
                className="w-full p-4 bg-[#0B0F19] border border-gray-700 rounded-2xl text-sm text-white outline-none focus:border-[#B519FF]" 
                required 
              />
              {!taxPercent && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">e.g. 5</span>}
            </div>
            <p className="text-[11px] text-gray-500 mt-2">Example: 5 for 5%. Deducted from the requested amount.</p>
          </div>
          <button type="submit" className="w-full md:w-auto bg-[#B519FF] text-white px-8 py-4 rounded-2xl font-bold hover:bg-purple-600 transition shadow-[0_0_15px_rgba(181,25,255,0.3)] whitespace-nowrap">
            Save Tax
          </button>
        </form>
      </div>

      {/* Amounts Settings */}
      <div className="bg-[#131825] p-6 md:p-8 rounded-3xl border border-gray-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl"></div>
        
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          Allowed Withdraw Amounts
        </h2>
        
        {/* Add New Amount */}
        <form onSubmit={handleAddAmount} className="flex flex-col md:flex-row gap-4 mb-8 relative z-10">
          <div className="relative flex-1">
            <input 
              type="number" 
              value={newAmount} 
              onChange={e => setNewAmount(e.target.value)} 
              className="w-full p-4 bg-[#0B0F19] border border-gray-700 rounded-2xl text-sm text-white outline-none focus:border-emerald-500" 
              required 
            />
            {!newAmount && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">Enter amount (e.g. 500)</span>}
          </div>
          <button type="submit" className="w-full md:w-auto bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-emerald-700 transition shadow-[0_0_15px_rgba(16,185,129,0.3)] whitespace-nowrap">
            Add Amount
          </button>
        </form>

        {/* List of Amounts */}
        <div className="space-y-3 relative z-10">
          {amounts.length === 0 && (
            <div className="text-center py-8 bg-[#0B0F19] rounded-xl border border-gray-800 border-dashed">
              <p className="text-gray-500 text-sm">No amounts added yet.</p>
            </div>
          )}
          
          {amounts.map((amount, index) => (
            <div key={index} className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 p-4 bg-[#0B0F19] rounded-2xl border border-gray-800 hover:border-gray-600 transition">
              
              {editingIndex === index ? (
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <input 
                    type="number" 
                    value={editAmountValue} 
                    onChange={(e) => setEditAmountValue(e.target.value)}
                    className="flex-1 p-3 bg-[#131825] border border-gray-600 rounded-lg text-sm text-white outline-none focus:border-emerald-500"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleEditAmount(index)} className="flex-1 sm:flex-none bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-700 transition">Save</button>
                    <button onClick={() => setEditingIndex(null)} className="flex-1 sm:flex-none bg-gray-800 text-gray-300 px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-700 transition">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/20">
                      <span className="text-sm">ETB</span>
                    </div>
                    <p className="font-black text-xl text-white">{amount}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setEditingIndex(index); setEditAmountValue(amount.toString()); }}
                      className="flex-1 sm:flex-none bg-blue-500/10 text-blue-400 border border-blue-500/20 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-500/20 transition"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteAmount(amount)}
                      className="flex-1 sm:flex-none bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-500/20 transition"
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