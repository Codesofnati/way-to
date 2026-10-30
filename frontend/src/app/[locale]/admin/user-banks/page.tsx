'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminUserBanks({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [details, setDetails] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Edit Modal State
  const [selectedDetails, setSelectedDetails] = useState<any>(null);
  const [editForm, setEditForm] = useState({ bankId: '', accountHolderName: '', accountNumber: '' });

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  useEffect(() => {
    if (user.role !== 'super_admin') return router.push(`/${locale}/auth`);
    fetchData();
  }, [router, locale]);

  const fetchData = async () => {
    try {
      const [detailsRes, banksRes] = await Promise.all([
        fetch(`${apiUrl}/api/super-admin/user-banks`).then(res => res.json()),
        fetch(`${apiUrl}/api/super-admin/banks`).then(res => res.json())
      ]);
      
      if (detailsRes.success) setDetails(detailsRes.details);
      if (banksRes.success) setBanks(banksRes.banks);
    } finally { setLoading(false); }
  };

  const handleEditClick = (detail: any) => {
    setSelectedDetails(detail);
    setEditForm({
      bankId: detail.bankId,
      accountHolderName: detail.accountHolderName,
      accountNumber: detail.accountNumber
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/user-banks/${selectedDetails.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert('Bank details updated successfully!');
      setSelectedDetails(null);
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  // ✅ NEW: Handle Delete Function
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bank information? The user will have to submit it again.')) return;
    
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/user-banks/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  const filteredDetails = details.filter((d: any) => {
    const query = searchQuery.toLowerCase();
    return (
      (d.userName && d.userName.toLowerCase().includes(query)) ||
      (d.userPhone && d.userPhone.includes(query)) ||
      (d.accountNumber && d.accountNumber.includes(query)) ||
      (d.bankName && d.bankName.toLowerCase().includes(query))
    );
  });

  if (loading) return <div className="p-8 text-center text-gray-500">Loading bank details...</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">User Bank Details</h1>
        <p className="text-gray-500 font-medium">Manage bank information for withdrawals. Users cannot edit this once saved.</p>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <input 
          type="text" 
          placeholder="Search by Name, Phone, Account Number, or Bank..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]"
        />
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Bank Name</th>
                <th className="px-6 py-4">Account Holder</th>
                <th className="px-6 py-4">Account Number</th>
                <th className="px-6 py-4">Last Updated</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDetails.map((d: any) => (
                <tr key={d.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    {/* ✅ Highlight if user is deleted/orphaned */}
                    <p className={`font-bold ${d.userName ? 'text-gray-900' : 'text-red-500'}`}>
                      {d.userName || 'Deleted User'}
                    </p>
                    <p className="text-xs text-gray-500">{d.userPhone || 'No Phone'}</p>
                  </td>
                  <td className="px-6 py-4 font-medium">{d.bankName}</td>
                  <td className="px-6 py-4">{d.accountHolderName}</td>
                  <td className="px-6 py-4 font-mono">{d.accountNumber}</td>
                  <td className="px-6 py-4 text-xs">
                    <p>{new Date(d.updatedAt).toLocaleString()}</p>
                    {d.adminEdited && <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded-md mt-1 inline-block">Edited by Admin</span>}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => handleEditClick(d)}
                      className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-100 transition"
                    >
                      Edit
                    </button>
                    {/* ✅ NEW: Delete Button */}
                    <button 
                      onClick={() => handleDelete(d.id)}
                      className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredDetails.length === 0 && <div className="p-8 text-center text-gray-500">No bank details found.</div>}
        </div>
      </div>

      {/* EDIT MODAL */}
      {selectedDetails && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Edit Bank Details</h2>
              <button onClick={() => setSelectedDetails(null)} className="text-gray-400 hover:text-gray-900 font-bold text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 mb-4">
                <p className="text-xs text-orange-700 font-bold">You are editing the bank information for <span className="underline">{selectedDetails.userName}</span> ({selectedDetails.userPhone}). Please double-check the details.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bank</label>
                <select 
                  value={editForm.bankId} 
                  onChange={e => setEditForm({...editForm, bankId: e.target.value})} 
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]"
                  required
                >
                  <option value="">Select a bank...</option>
                  {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Account Holder Name</label>
                <input 
                  type="text" 
                  value={editForm.accountHolderName} 
                  onChange={e => setEditForm({...editForm, accountHolderName: e.target.value})} 
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]" 
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Account Number</label>
                <input 
                  type="text" 
                  value={editForm.accountNumber} 
                  onChange={e => setEditForm({...editForm, accountNumber: e.target.value})} 
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]" 
                  required
                />
              </div>

              <button type="submit" className="w-full bg-[#B519FF] text-white p-4 rounded-2xl font-bold hover:bg-purple-600 transition mt-4">
                Save Bank Details
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}