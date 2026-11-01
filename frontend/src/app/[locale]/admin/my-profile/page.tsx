'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminMyProfile({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [profile, setProfile] = useState({ name: '', username: '', email: '', phone: '' });
  const [loading, setLoading] = useState(true);

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  useEffect(() => {
    if (!user.id || user.role !== 'admin') return router.push(`/${locale}/auth`);
    
    fetch(`${apiUrl}/api/admin/profile/${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProfile({ 
            name: data.profile.name || '', 
            username: data.profile.username || '', 
            email: data.profile.email || '', 
            phone: data.profile.phone || '' 
          });
        }
      }).finally(() => setLoading(false));
  }, [router, locale, user.id, apiUrl, user.role]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/admin/profile/${user.id}/update`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profile.name, username: profile.username, email: profile.email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...storedUser, name: data.user.name }));
      alert('Profile updated successfully!');
      window.location.reload();
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-400">
      <div className="w-10 h-10 border-4 border-[#B519FF] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-bold tracking-widest uppercase text-xs">Loading Profile...</p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-12 relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-0 right-[-10%] w-[300px] h-[300px] bg-[#B519FF]/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>

      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">My Profile</h1>
        <p className="text-gray-400 font-medium">Manage your personal information.</p>
      </div>

      <div className="bg-[#131825] p-6 md:p-10 rounded-[2rem] border border-gray-800 shadow-2xl relative z-10">
        
        {/* Avatar Header */}
        <div className="flex items-center gap-5 mb-10 border-b border-gray-800 pb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-[#B519FF] blur-xl opacity-40 rounded-full"></div>
            <div className="w-20 h-20 bg-gradient-to-tr from-[#B519FF] to-purple-400 text-white rounded-full flex items-center justify-center text-3xl font-black shadow-[0_0_20px_rgba(181,25,255,0.4)] border-4 border-[#131825] relative z-10">
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'A'}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{profile.name || 'Admin User'}</h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#B519FF]/10 text-[#B519FF] text-[10px] font-bold rounded-md uppercase tracking-widest mt-2 border border-[#B519FF]/20">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
              Admin Role
            </span>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          
          {/* Phone Number (Disabled) */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center justify-between">
              Phone Number
              <span className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded text-[9px]">Cannot change</span>
            </label>
            <input 
              type="tel" 
              value={profile.phone} 
              disabled 
              className="w-full p-4 bg-[#0B0F19]/50 border border-gray-800 rounded-xl text-sm text-gray-500 cursor-not-allowed font-mono" 
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Full Name</label>
            <div className="relative">
              <input 
                type="text" 
                value={profile.name} 
                onChange={e => setProfile({...profile, name: e.target.value})} 
                className="w-full p-4 pl-12 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-[#B519FF] transition-colors" 
                required 
              />
              {!profile.name && <span className="absolute left-12 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">Enter your full name</span>}
              <svg className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Username</label>
            <div className="relative">
              <input 
                type="text" 
                value={profile.username} 
                onChange={e => setProfile({...profile, username: e.target.value})} 
                className="w-full p-4 pl-12 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-[#B519FF] transition-colors" 
              />
              {!profile.username && <span className="absolute left-12 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">@username</span>}
              <svg className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path></svg>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Email Address</label>
            <div className="relative">
              <input 
                type="email" 
                value={profile.email} 
                onChange={e => setProfile({...profile, email: e.target.value})} 
                className="w-full p-4 pl-12 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-[#B519FF] transition-colors" 
              />
              {!profile.email && <span className="absolute left-12 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">admin@wayto.com</span>}
              <svg className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            </div>
          </div>

          <button type="submit" className="w-full bg-[#B519FF] text-white p-4 rounded-xl font-bold hover:bg-purple-600 transition shadow-[0_0_15px_rgba(181,25,255,0.3)] mt-4">
            Save Changes
          </button>
        </form>

        {/* Link to Security Page */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <Link 
            href={`/${locale}/admin/security`} 
            className="flex items-center justify-between p-4 bg-[#0B0F19] rounded-2xl border border-gray-800 hover:border-[#B519FF]/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-[#B519FF] transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              </div>
              <div>
                <p className="text-sm font-bold text-white">Account Security</p>
                <p className="text-xs text-gray-500">Change your password</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-600 group-hover:text-[#B519FF] group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </Link>
        </div>
      </div>
    </div>
  );
}