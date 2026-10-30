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

  // ✅ Edit State
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

  // ✅ Handle Edit Submit
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

  // ✅ Handle Delete
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/fund-plans/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      fetchPlans();
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading funds...</div>;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Fund Plans</h1>
      </div>

      {/* Create Fund Plan */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Plan</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <input type="text" placeholder="Plan Name" value={newPlan.name} onChange={e => setNewPlan({...newPlan, name: e.target.value})} className="w-full p-4 bg-gray-50 border rounded-2xl" required />
          <textarea placeholder="Description" value={newPlan.description} onChange={e => setNewPlan({...newPlan, description: e.target.value})} className="w-full p-4 bg-gray-50 border rounded-2xl" required />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <input type="number" placeholder="Duration (Days)" value={newPlan.durationDays} onChange={e => setNewPlan({...newPlan, durationDays: e.target.value})} className="w-full p-4 bg-gray-50 border rounded-2xl" required />
             <input type="number" step="0.01" placeholder="Interest % / day" value={newPlan.interestRate} onChange={e => setNewPlan({...newPlan, interestRate: e.target.value})} className="w-full p-4 bg-gray-50 border rounded-2xl" required />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="number" placeholder="Min Amount (ETB)" value={newPlan.minAmount} onChange={e => setNewPlan({...newPlan, minAmount: e.target.value})} className="w-full p-4 bg-gray-50 border rounded-2xl" required />
            <input type="number" placeholder="Max Amount (ETB)" value={newPlan.maxAmount} onChange={e => setNewPlan({...newPlan, maxAmount: e.target.value})} className="w-full p-4 bg-gray-50 border rounded-2xl" required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Start Date</label>
              <input type="datetime-local" value={newPlan.startDate} onChange={e => setNewPlan({...newPlan, startDate: e.target.value})} className="w-full p-4 bg-gray-50 border rounded-2xl mt-1" required />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Max Users</label>
              <input type="number" placeholder="100" value={newPlan.maxParticipants} onChange={e => setNewPlan({...newPlan, maxParticipants: e.target.value})} className="w-full p-4 bg-gray-50 border rounded-2xl mt-1" required />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Fake Joined Users</label>
              <input type="number" placeholder="0" value={newPlan.fakeJoinedUsers} onChange={e => setNewPlan({...newPlan, fakeJoinedUsers: e.target.value})} className="w-full p-4 bg-gray-50 border rounded-2xl mt-1" />
            </div>
          </div>

          <button type="submit" className="w-full bg-black text-white p-4 rounded-2xl font-bold hover:bg-gray-800 transition">Create Fund Plan</button>
        </form>
      </div>

      {/* List Plans */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Active Plans</h2>
        {plans.map((plan: any) => {
          const isClosed = new Date() >= new Date(plan.startDate);
          
          return (
            <div key={plan.id} className="bg-white p-4 rounded-2xl border border-gray-100">
              {editingPlan?.id === plan.id ? (
                <form onSubmit={handleEditSubmit} className="space-y-3">
                  <input type="text" value={editingPlan.name} onChange={e => setEditingPlan({...editingPlan, name: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl text-sm" required />
                  <input type="text" value={editingPlan.description} onChange={e => setEditingPlan({...editingPlan, description: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl text-sm" required />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" value={editingPlan.durationDays} onChange={e => setEditingPlan({...editingPlan, durationDays: e.target.value})} className="p-3 bg-gray-50 border rounded-xl text-sm" required placeholder="Days" />
                    <input type="number" step="0.01" value={editingPlan.interestRate} onChange={e => setEditingPlan({...editingPlan, interestRate: e.target.value})} className="p-3 bg-gray-50 border rounded-xl text-sm" required placeholder="Interest %" />
                    <input type="number" value={editingPlan.minAmount} onChange={e => setEditingPlan({...editingPlan, minAmount: e.target.value})} className="p-3 bg-gray-50 border rounded-xl text-sm" required placeholder="Min ETB" />
                    <input type="number" value={editingPlan.maxAmount} onChange={e => setEditingPlan({...editingPlan, maxAmount: e.target.value})} className="p-3 bg-gray-50 border rounded-xl text-sm" required placeholder="Max ETB" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Start Date</label>
                      <input type="datetime-local" value={new Date(editingPlan.startDate).toISOString().slice(0,16)} onChange={e => setEditingPlan({...editingPlan, startDate: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl text-sm" required />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Fake Users</label>
                      <input type="number" value={editingPlan.fakeJoinedUsers} onChange={e => setEditingPlan({...editingPlan, fakeJoinedUsers: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl text-sm" />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button type="submit" className="bg-[#B519FF] text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-purple-600">Save Changes</button>
                    <button type="button" onClick={() => setEditingPlan(null)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl text-xs font-bold hover:bg-gray-300">Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <p className="font-bold text-gray-900">{plan.name}</p>
                    <p className="text-sm text-gray-600">{plan.description}</p>
                    <p className="text-xs font-bold text-[#B519FF] mt-1">{plan.durationDays} Days • {plan.interestRate}% / day</p>
                    <p className={`text-xs font-bold mt-1 ${isClosed ? 'text-red-500' : 'text-emerald-500'}`}>
                      {isClosed ? 'Status: CLOSED (Started)' : 'Status: OPEN'}
                    </p>
                  </div>
                  
                  <div className="text-left md:text-right">
                    <p className="text-xs text-gray-500 uppercase font-bold">Limits (Min - Max)</p>
                    <p className="font-bold text-gray-900">ETB {plan.minAmount} - {plan.maxAmount}</p>
                    <p className="text-[10px] text-gray-400 mt-1 mb-2">Max {plan.maxParticipants} Users ({plan.fakeJoinedUsers} Fake)</p>
                    
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditingPlan(plan)} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-100 transition">Edit</button>
                      <button onClick={() => handleDelete(plan.id, plan.name)} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-100 transition">Delete</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}