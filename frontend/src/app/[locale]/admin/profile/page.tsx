'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SuperAdminProfile({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [userId, setUserId] = useState('');
  const [profile, setProfile] = useState({ name: '', phone: '', role: '' });
  const [loading, setLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push(`/${locale}/auth`);
      return;
    }
    const user = JSON.parse(storedUser);
    if (user.role !== 'super_admin') {
      router.push(`/${locale}/auth`);
      return;
    }
    
    setUserId(user.id); 
    setProfile({ name: user.name || '', phone: user.phone || '', role: user.role });
    setLoading(false);
  }, [router, locale]);

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return alert('User ID not found. Please refresh.');

    try {
      const res = await fetch(`${apiUrl}/api/super-admin/profile/${userId}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profile.name, phone: profile.phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...storedUser, name: data.user.name, phone: data.user.phone }));
      
      alert('Profile updated successfully!');
      window.location.reload(); 
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-400">
      <div className="w-10 h-10 border-4 border-[#B519FF] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-bold tracking-widest uppercase text-xs">Loading Profile...</p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-12">
      
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">Personal Information</h1>
        <p className="text-gray-400 font-medium">Manage your account details and security.</p>
      </div>

      <div className="bg-[#131825] p-6 md:p-10 rounded-3xl border border-gray-800 relative overflow-hidden shadow-lg">
        {/* Decorative Background Blur */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#B519FF]/10 rounded-full blur-3xl"></div>

        {/* Avatar & Name Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-10 relative z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-[#B519FF] blur-xl opacity-40 rounded-full"></div>
            <div className="w-24 h-24 bg-gradient-to-tr from-[#B519FF] to-purple-400 text-white rounded-full flex items-center justify-center text-4xl font-black shadow-[0_0_20px_rgba(181,25,255,0.4)] border-4 border-[#131825] relative z-10">
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'S'}
            </div>
          </div>
          <div className="text-center sm:text-left mt-2 sm:mt-0">
            <h2 className="text-2xl font-bold text-white">{profile.name || 'Super Admin'}</h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#B519FF]/10 text-[#B519FF] text-[10px] font-bold rounded-md uppercase tracking-widest mt-2 border border-[#B519FF]/20">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
              {profile.role.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleUpdateInfo} className="space-y-6 relative z-10">
          
          {/* Name Input */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Full Name</label>
            <div className="relative">
              <input 
                type="text" 
                value={profile.name} 
                onChange={e => setProfile({...profile, name: e.target.value})} 
                className="w-full p-4 pl-12 bg-[#0B0F19] border border-gray-700 rounded-2xl text-sm text-white focus:border-[#B519FF] outline-none transition-colors" 
                required 
              />
              {!profile.name && (
                <span className="absolute left-12 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">Enter your name</span>
              )}
              <svg className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            </div>
          </div>

          {/* Phone Input */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Phone Number</label>
            <div className="relative">
              <input 
                type="tel" 
                value={profile.phone} 
                onChange={e => setProfile({...profile, phone: e.target.value})} 
                className="w-full p-4 pl-12 bg-[#0B0F19] border border-gray-700 rounded-2xl text-sm text-white focus:border-[#B519FF] outline-none transition-colors" 
                required 
              />
              {!profile.phone && (
                <span className="absolute left-12 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">+251...</span>
              )}
              <svg className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
            </div>
          </div>

          <button type="submit" className="w-full bg-[#B519FF] text-white p-4 rounded-2xl font-bold hover:bg-purple-600 transition shadow-[0_0_15px_rgba(181,25,255,0.3)] mt-4">
            Save Changes
          </button>
        </form>

        {/* Security Link Footer */}
        <div className="mt-8 pt-6 border-t border-gray-800 relative z-10">
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
                <p className="text-xs text-gray-500">Update your password</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-600 group-hover:text-[#B519FF] group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </Link>
        </div>

      </div>
    </div>
  );
}