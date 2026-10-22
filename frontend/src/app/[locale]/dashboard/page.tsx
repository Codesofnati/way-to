'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function UserDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Deposit Form State
  const [depositData, setDepositData] = useState({ 
    amount: '', 
    method: 'CBE Bank', 
    ft: '', 
    screenshot: '' 
  });
  const [submitting, setSubmitting] = useState(false);

  // Withdrawal State
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdraw, setShowWithdraw] = useState(false);

  // Safe localStorage access
  const user = typeof window !== 'undefined' 
    ? JSON.parse(localStorage.getItem('user') || '{}') 
    : {};

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  useEffect(() => {
    if (!user.id) {
      router.push(`/${locale}/auth`);
      return;
    }
    
    // Block admins from accessing the user dashboard
    if (user.role === 'admin' || user.role === 'super_admin') {
      router.push(`/${locale}/admin/dashboard`);
      return;
    }

    fetchUserData();
  }, [router, locale, user.id, user.role]);

  const fetchUserData = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/user/${user.id}/dashboard`);
      const data = await res.json();
      if (data.success) setUserData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/user/${user.id}/payment`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: depositData.amount, 
          paymentMethod: depositData.method, 
          ftNumber: depositData.ft, 
          screenshotUrl: depositData.screenshot 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert('Deposit request submitted successfully! Waiting for admin approval.');
      setDepositData({ amount: '', method: 'CBE Bank', ft: '', screenshot: '' });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/user/${user.id}/withdraw`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: withdrawAmount })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert('Withdrawal requested! Pending admin approval.');
      setWithdrawAmount('');
      setShowWithdraw(false);
      fetchUserData(); // Refresh balance
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
  if (!userData) return <div className="p-8 text-center text-red-600">Failed to load data.</div>;

  // Generate Referral Link
  const referralLink = `${window.location.origin}/${locale}/auth?ref=${user.id}`;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      
      {/* 1. WALLET HEADER */}
      <div className="bg-black text-white p-8 rounded-3xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">My Wallet Balance</p>
          <h1 className="text-5xl font-black">ETB {userData.user.walletBalance}</h1>
          <p className="text-sm text-gray-400 mt-2">Welcome back, {userData.user.name || userData.user.phone}</p>
        </div>
        
        <div className="w-full md:w-auto">
          {!showWithdraw ? (
            <button 
              onClick={() => setShowWithdraw(true)}
              className="w-full md:w-auto bg-white text-black px-8 py-4 rounded-2xl font-bold hover:bg-gray-200 transition"
            >
              Withdraw Funds
            </button>
          ) : (
            <form onSubmit={handleWithdraw} className="flex gap-2 w-full md:w-auto">
              <input 
                type="number" 
                placeholder="Amount" 
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="p-4 bg-gray-800 text-white rounded-2xl w-full md:w-32 focus:outline-none focus:ring-2 focus:ring-[#B519FF]"
                required
              />
              <button type="submit" className="bg-[#B519FF] text-white px-6 py-4 rounded-2xl font-bold hover:bg-purple-600 transition">Go</button>
              <button type="button" onClick={() => setShowWithdraw(false)} className="text-gray-400 px-2 hover:text-white">&times;</button>
            </form>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 2. DEPOSIT FORM */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Deposit Money</h2>
          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Payment Method</label>
              <select 
                value={depositData.method}
                onChange={e => setDepositData({...depositData, method: e.target.value})} 
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]"
              >
                <option value="CBE Bank">CBE Bank</option>
                <option value="CBE Birr">CBE Birr</option>
                <option value="Telebirr">Telebirr</option>
                <option value="Abyssinia Bank">Abyssinia Bank</option>
                <option value="Dashen Bank">Dashen Bank</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount (ETB)</label>
              <input type="number" placeholder="e.g. 500" value={depositData.amount} onChange={e => setDepositData({...depositData, amount: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]" required />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">FT Number (Transaction ID)</label>
              <input type="text" placeholder="e.g. FT123456789" value={depositData.ft} onChange={e => setDepositData({...depositData, ft: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]" required />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Screenshot URL (Proof)</label>
              <input type="url" placeholder="https://..." value={depositData.screenshot} onChange={e => setDepositData({...depositData, screenshot: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]" />
            </div>

            <button type="submit" disabled={submitting} className="w-full bg-[#B519FF] text-white p-4 rounded-2xl font-bold hover:bg-purple-600 transition disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit Deposit'}
            </button>
          </form>
        </div>

        {/* 3. REFERRAL NETWORK */}
        <div className="space-y-6">
          
          {/* Referral Link Box */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Invite Friends</h2>
            <p className="text-sm text-gray-500 mb-4">Earn by growing your network.</p>
            
            <div className="flex gap-2">
              <input 
                type="text" 
                readOnly 
                value={referralLink} 
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-600 font-mono outline-none" 
              />
              <button 
                onClick={() => { navigator.clipboard.writeText(referralLink); alert('Link copied!'); }} 
                className="bg-black text-white px-6 rounded-2xl font-bold text-sm hover:bg-gray-800 transition"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Level 1 Tree */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider flex justify-between">
              <span>Level 1 Network</span>
              <span className="text-[#B519FF] bg-purple-50 px-2 py-1 rounded-md">{userData.referrals.level1.length} Users</span>
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {userData.referrals.level1.length === 0 ? (
                <p className="text-sm text-gray-400">No direct invites yet.</p>
              ) : (
                userData.referrals.level1.map((ref: any) => (
                  <div key={ref.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center text-sm">
                    <span className="font-bold text-gray-800">{ref.name}</span>
                    <span className="text-xs text-gray-500 font-mono">{ref.phone}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Level 2 Tree */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider flex justify-between">
              <span>Level 2 Network</span>
              <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{userData.referrals.level2.length} Users</span>
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {userData.referrals.level2.length === 0 ? (
                <p className="text-sm text-gray-400">No grandchild invites yet.</p>
              ) : (
                userData.referrals.level2.map((ref: any) => (
                  <div key={ref.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-700">{ref.name}</span>
                    <span className="text-xs text-gray-500 font-mono">{ref.phone}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}