'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function ReferralSettings({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [level1Percent, setLevel1Percent] = useState('');
  const [level2Percent, setLevel2Percent] = useState('');
  const [loading, setLoading] = useState(true);

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  useEffect(() => {
    if (user.role !== 'super_admin') return router.push(`/${locale}/auth`);
    
    fetch(`${apiUrl}/api/super-admin/referral-settings`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) {
          setLevel1Percent(data.settings.level1Percent);
          setLevel2Percent(data.settings.level2Percent);
        }
      })
      .finally(() => setLoading(false));
  }, [router, locale, apiUrl, user.role]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/referral-settings`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level1Percent, level2Percent })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert('Referral percentages updated successfully!');
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Referral Settings</h1>
        <p className="text-gray-500 font-medium">Set the percentage bonus based on the job price.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Level 1 Bonus (%)</label>
            <div className="relative">
              <input type="number" step="0.1" value={level1Percent} onChange={e => setLevel1Percent(e.target.value)} className="w-full p-4 bg-gray-50 border rounded-2xl pr-12" required />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">%</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Example: If the job is 2,500 ETB and the rate is 20%, the inviter gets 500 ETB.</p>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Level 2 Bonus (%)</label>
            <div className="relative">
              <input type="number" step="0.1" value={level2Percent} onChange={e => setLevel2Percent(e.target.value)} className="w-full p-4 bg-gray-50 border rounded-2xl pr-12" required />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">%</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Example: If the job is 2,500 ETB and the rate is 5%, the grand-inviter gets 125 ETB.</p>
          </div>

          <button type="submit" className="w-full bg-black text-white p-4 rounded-2xl font-bold hover:bg-gray-800 transition">Save Settings</button>
        </form>
      </div>
    </div>
  );
}