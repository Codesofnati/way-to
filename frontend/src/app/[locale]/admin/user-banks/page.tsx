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

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-400">
      <div className="w-10 h-10 border-4 border-[#B519FF] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-bold tracking-widest uppercase text-xs">Loading Details...</p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">User Bank Details</h1>
        <p className="text-gray-400 font-medium">Manage bank information for withdrawals. Users cannot edit this once saved.</p>
      </div>

      {/* Search Bar */}
      <div className="bg-[#131825] p-2 rounded-2xl border border-gray-800">
        <div className="relative">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 pl-10 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-[#B519FF]" 
          />
          {!searchQuery && (
            <span className="absolute left-10 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
              Search by Name, Phone, Account Number, or Bank...
            </span>
          )}
          <svg className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#131825] rounded-3xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-gray-300 min-w-[900px]">
            <thead className="bg-[#0B0F19] text-[10px] uppercase font-bold text-gray-500">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Bank Name</th>
                <th className="px-6 py-4">Account Holder</th>
                <th className="px-6 py-4">Account Number</th>
                <th className="px-6 py-4">Last Updated</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {filteredDetails.map((d: any) => (
                <tr key={d.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <p className={`font-bold ${d.userName ? 'text-white' : 'text-red-400'}`}>
                      {d.userName || 'Deleted User'}
                    </p>
                    <p className="text-xs text-gray-400">{d.userPhone || 'No Phone'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-800 text-gray-300 px-2.5 py-1 rounded-md text-[10px] font-bold border border-gray-700">
                      {d.bankName}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{d.accountHolderName}</td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-400">{d.accountNumber}</td>
                  <td className="px-6 py-4 text-xs">
                    <p className="text-gray-400">{new Date(d.updatedAt).toLocaleString()}</p>
                    {d.adminEdited && (
                      <span className="text-[9px] text-orange-400 font-bold bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-md mt-1 inline-block uppercase tracking-widest">
                        Edited by Admin
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => handleEditClick(d)}
                      className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-500/20 transition"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(d.id)}
                      className="bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-500/20 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredDetails.length === 0 && (
            <div className="p-12 text-center text-gray-500 bg-[#0B0F19] border-t border-gray-800">
              No bank details found.
            </div>
          )}
        </div>
      </div>

      {/* EDIT MODAL */}
      {selectedDetails && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#131825] rounded-3xl border border-gray-700 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#0B0F19]">
              <h2 className="text-xl font-bold text-white">Edit Bank Details</h2>
              <button onClick={() => setSelectedDetails(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:text-white transition text-xl font-bold">&times;</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="bg-orange-500/10 p-4 rounded-xl border border-orange-500/20">
                <p className="text-xs text-orange-400 font-medium leading-relaxed">
                  You are editing the bank information for <strong className="text-orange-300 underline">{selectedDetails.userName}</strong> ({selectedDetails.userPhone}). Please double-check the details.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Bank</label>
                <div className="relative">
                  <select 
                    value={editForm.bankId} 
                    onChange={e => setEditForm({...editForm, bankId: e.target.value})} 
                    className="w-full p-4 bg-[#0B0F19] border border-gray-700 rounded-2xl text-sm text-white outline-none focus:border-[#B519FF] appearance-none"
                    required
                  >
                    <option value="" disabled hidden>Select a bank...</option>
                    {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  <svg className="w-5 h-5 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Account Holder Name</label>
                <input 
                  type="text" 
                  value={editForm.accountHolderName} 
                  onChange={e => setEditForm({...editForm, accountHolderName: e.target.value})} 
                  className="w-full p-4 bg-[#0B0F19] border border-gray-700 rounded-2xl text-sm text-white outline-none focus:border-[#B519FF]" 
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Account Number</label>
                <input 
                  type="text" 
                  value={editForm.accountNumber} 
                  onChange={e => setEditForm({...editForm, accountNumber: e.target.value})} 
                  className="w-full p-4 bg-[#0B0F19] border border-gray-700 rounded-2xl text-sm text-white outline-none focus:border-[#B519FF] font-mono" 
                  required
                />
              </div>

              <button type="submit" className="w-full bg-[#B519FF] text-white p-4 rounded-2xl font-bold hover:bg-purple-600 transition shadow-[0_0_15px_rgba(181,25,255,0.3)] mt-2">
                Save Bank Details
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}