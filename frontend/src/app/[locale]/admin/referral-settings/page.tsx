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

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-400">
      <div className="w-10 h-10 border-4 border-[#B519FF] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-bold tracking-widest uppercase text-xs">Loading Settings...</p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-12">
      
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">Referral Settings</h1>
        <p className="text-gray-400 font-medium">Set the percentage bonus based on the job price.</p>
      </div>

      <div className="bg-[#131825] p-6 md:p-10 rounded-3xl border border-gray-800 relative overflow-hidden shadow-2xl">
        {/* Glassmorphism Background Glow */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#B519FF]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <form onSubmit={handleSave} className="space-y-8 relative z-10">
          
          {/* Level 1 */}
          <div className="bg-[#0B0F19]/60 backdrop-blur-md p-6 rounded-2xl border border-[#B519FF]/30 shadow-[0_0_15px_rgba(181,25,255,0.05)]">
            <label className="block text-[10px] text-[#B519FF] font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
              Level 1 Bonus (%)
            </label>
            
            <div className="relative">
              <input 
                type="number" 
                step="0.1" 
                value={level1Percent} 
                onChange={e => setLevel1Percent(e.target.value)} 
                className="w-full p-4 bg-[#131825] border border-gray-700 rounded-xl text-lg text-white font-bold outline-none focus:border-[#B519FF] focus:ring-1 focus:ring-[#B519FF] transition-all pr-12" 
                required 
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">%</span>
            </div>
            
            <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#B519FF]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>
              Example: If the job is 2,500 ETB and the rate is 20%, the inviter gets 500 ETB.
            </p>
          </div>
          
          {/* Level 2 */}
          <div className="bg-[#0B0F19]/60 backdrop-blur-md p-6 rounded-2xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
            <label className="block text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
              Level 2 Bonus (%)
            </label>
            
            <div className="relative">
              <input 
                type="number" 
                step="0.1" 
                value={level2Percent} 
                onChange={e => setLevel2Percent(e.target.value)} 
                className="w-full p-4 bg-[#131825] border border-gray-700 rounded-xl text-lg text-white font-bold outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all pr-12" 
                required 
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">%</span>
            </div>
            
            <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>
              Example: If the job is 2,500 ETB and the rate is 5%, the grand-inviter gets 125 ETB.
            </p>
          </div>

          <button 
            type="submit" 
            className="w-full bg-[#B519FF] text-white p-4 rounded-2xl font-bold text-lg hover:bg-purple-600 transition-all shadow-[0_0_20px_rgba(181,25,255,0.4)] hover:shadow-[0_0_30px_rgba(181,25,255,0.6)] hover:-translate-y-0.5"
          >
            Save Settings
          </button>
        </form>
      </div>
    </div>
  );
}