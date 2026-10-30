'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function UserProfile({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [profile, setProfile] = useState({ name: '', username: '', email: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  const isAmharic = locale === 'am';

  useEffect(() => {
    if (!user.id) return router.push(`/${locale}/auth`);
    
    fetch(`${apiUrl}/api/user/${user.id}/dashboard`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProfile({
            name: data.user.name || '',
            username: data.user.username || '',
            email: data.user.email || '',
            phone: data.user.phone || '',
          });
        }
      })
      .finally(() => setLoading(false));
  }, [router, locale, user.id, apiUrl]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/user/${user.id}/profile`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: profile.name, 
          username: profile.username, 
          email: profile.email 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...storedUser, name: data.user.name }));
      
      alert(isAmharic ? 'መገለጫው በተሳካ ሁኔታ ተዘምኗል!' : 'Profile updated successfully!');
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B519FF]"></div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-24 relative overflow-hidden">
      
      {/* Decorative Background Blur */}
      <div className="absolute top-0 right-[-20%] w-64 h-64 bg-[#B519FF]/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-[-20%] w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center justify-center pt-6">
        <div className="relative">
          <div className="absolute inset-0 bg-[#B519FF] blur-xl opacity-40 rounded-[1.5rem]"></div>
          <div className="w-20 h-20 bg-gradient-to-tr from-[#B519FF] to-purple-400 rounded-[1.5rem] flex items-center justify-center shadow-lg border-2 border-white relative z-10 mb-3 transform transition hover:scale-105 duration-300">
            <span className="text-white text-3xl font-black drop-shadow-md">W</span>
          </div>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          {isAmharic ? 'የግል መረጃ' : 'Personal Information'}
        </h1>
        <p className="text-sm font-medium text-gray-500 mt-1">
          {isAmharic ? 'የግል ዝርዝሮችዎን እዚህ ያዘምኑ።' : 'Update your personal details here.'}
        </p>
      </div>

      <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-gray-100 relative z-10">
        <form onSubmit={handleUpdate} className="space-y-6">
          
          <div className="relative">
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#B519FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
              {isAmharic ? 'የስልክ ቁጥር (መቀየር አይቻልም)' : 'Phone Number (Cannot be changed)'}
            </label>
            <input 
              type="tel" 
              value={profile.phone} 
              disabled 
              className="w-full p-4 bg-gray-100 border border-gray-200 rounded-2xl text-sm text-gray-500 cursor-not-allowed font-medium" 
            />
          </div>

          <div className="relative">
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#B519FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              {isAmharic ? 'እውነተኛ ስም' : 'Real Name'}
            </label>
            <input 
              type="text" 
              value={profile.name} 
              onChange={e => setProfile({...profile, name: e.target.value})} 
              placeholder={isAmharic ? 'ለምሳሌ አበበ ከበደ' : 'e.g. Abebe Kebede'}
              className="w-full p-4 bg-white border border-gray-300 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B519FF] transition-all" 
              required
            />
          </div>

          <div className="relative">
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#B519FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {isAmharic ? 'የተጠቃሚ ስም' : 'Username'}
            </label>
            <input 
              type="text" 
              value={profile.username} 
              onChange={e => setProfile({...profile, username: e.target.value})} 
              placeholder="e.g. abebe123"
              className="w-full p-4 bg-white border border-gray-300 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B519FF] transition-all" 
            />
          </div>

          <div className="relative">
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#B519FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              {isAmharic ? 'የኢሜይል አድራሻ' : 'Email Address'}
            </label>
            <input 
              type="email" 
              value={profile.email} 
              onChange={e => setProfile({...profile, email: e.target.value})} 
              placeholder="e.g. abebe@example.com"
              className="w-full p-4 bg-white border border-gray-300 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B519FF] transition-all" 
            />
          </div>

          <button 
            type="submit" 
            disabled={submitting} 
            className="w-full bg-[#B519FF] text-white p-4 rounded-2xl font-bold hover:bg-purple-600 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none mt-4"
          >
            {submitting ? (isAmharic ? 'በማስቀመጥ ላይ...' : 'Saving...') : (isAmharic ? 'ለውጦችን አስቀምጥ' : 'Save Changes')}
          </button>
        </form>
      </div>
    </div>
  );
}