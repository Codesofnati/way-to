'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminFunds({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [plans, setPlans] = useState<any[]>([]);
  const [newPlan, setNewPlan] = useState({ 
    name: '', description: '', durationDays: '', interestRate: '', minAmount: '', maxAmount: '', maxParticipants: '100',
    startDate: '', fakeJoinedUsers: '0'
  });
  const [loading, setLoading] = useState(true);

  // Edit State
  const [editingPlan, setEditingPlan] = useState<any>(null);

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  useEffect(() => {
    if (user.role !== 'super_admin') return router.push(`/${locale}/auth`);
    fetchPlans();
  }, [router, locale]);

  const fetchPlans = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/fund-plans`);
      const data = await res.json();
      if (data.success) setPlans(data.plans);
    } finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...newPlan,
      durationDays: parseInt(newPlan.durationDays),
      interestRate: parseFloat(newPlan.interestRate),
      minAmount: parseFloat(newPlan.minAmount),
      maxAmount: parseFloat(newPlan.maxAmount),
      maxParticipants: parseInt(newPlan.maxParticipants),
      fakeJoinedUsers: parseInt(newPlan.fakeJoinedUsers)
    };

    if (!payload.startDate) return alert("Please select a start date.");

    try {
      const res = await fetch(`${apiUrl}/api/super-admin/fund-plans`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setNewPlan({ name: '', description: '', durationDays: '', interestRate: '', minAmount: '', maxAmount: '', maxParticipants: '100', startDate: '', fakeJoinedUsers: '0' });
      fetchPlans();
    } catch (err: any) { alert(err.message); }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...editingPlan,
        durationDays: parseInt(editingPlan.durationDays),
        interestRate: parseFloat(editingPlan.interestRate),
        minAmount: parseFloat(editingPlan.minAmount),
        maxAmount: parseFloat(editingPlan.maxAmount),
        maxParticipants: parseInt(editingPlan.maxParticipants),
        fakeJoinedUsers: parseInt(editingPlan.fakeJoinedUsers)
      };

      const res = await fetch(`${apiUrl}/api/super-admin/fund-plans/${editingPlan.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert('Plan updated successfully!');
      setEditingPlan(null);
      fetchPlans();
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/fund-plans/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      fetchPlans();
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-400">
      <div className="w-10 h-10 border-4 border-[#B519FF] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-bold tracking-widest uppercase text-xs">Loading Funds...</p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">Fund Plans</h1>
        <p className="text-gray-400 font-medium">Create and manage investment plans.</p>
      </div>

      {/* Create Fund Plan */}
      <div className="bg-[#131825] p-6 md:p-8 rounded-3xl border border-gray-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#B519FF]/10 rounded-full blur-3xl"></div>
        
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
          <svg className="w-5 h-5 text-[#B519FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Create New Plan
        </h2>
        
        <form onSubmit={handleCreate} className="space-y-4 relative z-10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <input type="text" value={newPlan.name} onChange={e => setNewPlan({...newPlan, name: e.target.value})} className="w-full p-4 bg-[#0B0F19] border border-gray-700 rounded-2xl text-sm text-white outline-none focus:border-[#B519FF]" required />
              {!newPlan.name && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">Plan Name</span>}
            </div>
            <div className="relative">
              <input type="text" value={newPlan.description} onChange={e => setNewPlan({...newPlan, description: e.target.value})} className="w-full p-4 bg-[#0B0F19] border border-gray-700 rounded-2xl text-sm text-white outline-none focus:border-[#B519FF]" required />
              {!newPlan.description && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">Description</span>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="relative">
               <input type="number" value={newPlan.durationDays} onChange={e => setNewPlan({...newPlan, durationDays: e.target.value})} className="w-full p-4 bg-[#0B0F19] border border-gray-700 rounded-2xl text-sm text-white outline-none focus:border-[#B519FF]" required />
               {!newPlan.durationDays && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">Duration (Days)</span>}
             </div>
             <div className="relative">
               <input type="number" step="0.01" value={newPlan.interestRate} onChange={e => setNewPlan({...newPlan, interestRate: e.target.value})} className="w-full p-4 bg-[#0B0F19] border border-gray-700 rounded-2xl text-sm text-white outline-none focus:border-[#B519FF]" required />
               {!newPlan.interestRate && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">Interest % / day</span>}
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <input type="number" value={newPlan.minAmount} onChange={e => setNewPlan({...newPlan, minAmount: e.target.value})} className="w-full p-4 bg-[#0B0F19] border border-gray-700 rounded-2xl text-sm text-white outline-none focus:border-[#B519FF]" required />
              {!newPlan.minAmount && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">Min Amount (ETB)</span>}
            </div>
            <div className="relative">
              <input type="number" value={newPlan.maxAmount} onChange={e => setNewPlan({...newPlan, maxAmount: e.target.value})} className="w-full p-4 bg-[#0B0F19] border border-gray-700 rounded-2xl text-sm text-white outline-none focus:border-[#B519FF]" required />
              {!newPlan.maxAmount && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">Max Amount (ETB)</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Start Date</label>
              <input type="datetime-local" value={newPlan.startDate} onChange={e => setNewPlan({...newPlan, startDate: e.target.value})} className="w-full p-4 bg-[#0B0F19] border border-gray-700 rounded-2xl text-sm text-white outline-none focus:border-[#B519FF] color-scheme-dark" required />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Max Users</label>
              <input type="number" value={newPlan.maxParticipants} onChange={e => setNewPlan({...newPlan, maxParticipants: e.target.value})} className="w-full p-4 bg-[#0B0F19] border border-gray-700 rounded-2xl text-sm text-white outline-none focus:border-[#B519FF]" required />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Fake Joined Users</label>
              <input type="number" value={newPlan.fakeJoinedUsers} onChange={e => setNewPlan({...newPlan, fakeJoinedUsers: e.target.value})} className="w-full p-4 bg-[#0B0F19] border border-gray-700 rounded-2xl text-sm text-white outline-none focus:border-[#B519FF]" />
            </div>
          </div>

          <button type="submit" className="w-full bg-[#B519FF] text-white p-4 rounded-2xl font-bold hover:bg-purple-600 transition shadow-[0_0_15px_rgba(181,25,255,0.3)] mt-2">
            Create Fund Plan
          </button>
        </form>
      </div>

      {/* List Plans */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white mb-4">Active Plans</h2>
        
        {plans.map((plan: any) => {
          const isClosed = new Date() >= new Date(plan.startDate);
          
          return (
            <div key={plan.id} className="bg-[#131825] p-6 rounded-3xl border border-gray-800 transition-colors hover:border-[#B519FF]/30">
              {editingPlan?.id === plan.id ? (
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="text" value={editingPlan.name} onChange={e => setEditingPlan({...editingPlan, name: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-white outline-none" required placeholder="Name" />
                    <input type="text" value={editingPlan.description} onChange={e => setEditingPlan({...editingPlan, description: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-white outline-none" required placeholder="Description" />
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <input type="number" value={editingPlan.durationDays} onChange={e => setEditingPlan({...editingPlan, durationDays: e.target.value})} className="p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-white outline-none" required placeholder="Days" />
                    <input type="number" step="0.01" value={editingPlan.interestRate} onChange={e => setEditingPlan({...editingPlan, interestRate: e.target.value})} className="p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-white outline-none" required placeholder="Interest %" />
                    <input type="number" value={editingPlan.minAmount} onChange={e => setEditingPlan({...editingPlan, minAmount: e.target.value})} className="p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-white outline-none" required placeholder="Min ETB" />
                    <input type="number" value={editingPlan.maxAmount} onChange={e => setEditingPlan({...editingPlan, maxAmount: e.target.value})} className="p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-white outline-none" required placeholder="Max ETB" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Start Date</label>
                      <input type="datetime-local" value={new Date(editingPlan.startDate).toISOString().slice(0,16)} onChange={e => setEditingPlan({...editingPlan, startDate: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-white outline-none color-scheme-dark" required />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Max Users</label>
                      <input type="number" value={editingPlan.maxParticipants} onChange={e => setEditingPlan({...editingPlan, maxParticipants: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-white outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Fake Users</label>
                      <input type="number" value={editingPlan.fakeJoinedUsers} onChange={e => setEditingPlan({...editingPlan, fakeJoinedUsers: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-white outline-none" />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-3 border-t border-gray-800">
                    <button type="submit" className="bg-[#B519FF] text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-purple-600 transition">Save Changes</button>
                    <button type="button" onClick={() => setEditingPlan(null)} className="bg-gray-800 text-gray-300 px-6 py-2 rounded-xl text-xs font-bold hover:bg-gray-700 transition">Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-bold text-lg text-white">{plan.name}</p>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest border ${isClosed ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                        {isClosed ? 'Closed' : 'Open'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{plan.description}</p>
                    <p className="text-xs font-bold text-[#B519FF] mt-2 bg-[#B519FF]/10 w-fit px-2 py-1 rounded border border-[#B519FF]/20">
                      {plan.durationDays} Days • {plan.interestRate}% / day
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-[#0B0F19] p-4 rounded-2xl border border-gray-800 min-w-[300px]">
                    <div>
                      <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Min Limit</p>
                      <p className="font-bold text-white text-sm">ETB {plan.minAmount}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Max Limit</p>
                      <p className="font-bold text-white text-sm">ETB {plan.maxAmount}</p>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Users</p>
                      <p className="font-bold text-white text-sm">{plan.fakeJoinedUsers} <span className="text-gray-500 text-[10px]">Fake</span></p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button onClick={() => setEditingPlan(plan)} className="flex-1 lg:flex-none bg-blue-500/10 text-blue-400 border border-blue-500/20 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-500/20 transition">Edit</button>
                    <button onClick={() => handleDelete(plan.id, plan.name)} className="flex-1 lg:flex-none bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-red-500/20 transition">Delete</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {plans.length === 0 && (
          <div className="text-center py-12 bg-[#0B0F19] rounded-2xl border border-gray-800 border-dashed">
            <p className="text-gray-500 text-sm">No fund plans created yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}