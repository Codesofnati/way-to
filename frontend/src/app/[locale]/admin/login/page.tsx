'use client';

import { useState, use, Suspense } from 'react';

function AdminLoginContent({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = use(params);
  const locale = resolvedParams.locale;

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

    try {
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(data.error || 'Login failed');

      // ✅ Block regular users from admin portal
      if (data.user.role !== 'admin' && data.user.role !== 'super_admin') {
        throw new Error('Access denied: This portal is for admins only.');
      }

      localStorage.setItem('user', JSON.stringify(data.user));

      // ✅ Route based on role correctly
      if (data.user.role === 'super_admin') {
        window.location.href = `/${locale}/admin/super-dashboard`;
      } else {
        window.location.href = `/${locale}/admin/dashboard`;
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0B0F19] p-6 relative overflow-hidden">
      
      {/* Ambient Glow Background */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#B519FF]/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-md w-full bg-[#131825]/80 backdrop-blur-xl p-8 md:p-10 rounded-[2rem] shadow-2xl border border-gray-800 relative z-10">
        
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-tr from-[#B519FF] to-purple-400 text-white p-3 rounded-2xl font-black text-2xl shadow-[0_0_20px_rgba(181,25,255,0.4)] mb-4">
            W
          </div>
          <h1 className="text-2xl font-bold text-white text-center">
            Admin Portal
          </h1>
          <p className="text-sm text-gray-400 mt-1">Secure access only</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          
          {/* Phone Number */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Phone Number</label>
            <div className="relative group">
              <input 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-4 pl-12 bg-[#0B0F19] border border-gray-700 rounded-xl outline-none focus:border-[#B519FF] text-sm text-white font-medium transition-all" 
                required 
              />
              {!phone && (
                <span className="absolute left-12 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                  +251...
                </span>
              )}
              <svg className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-[#B519FF] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Password</label>
            <div className="relative group">
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 pl-12 bg-[#0B0F19] border border-gray-700 rounded-xl outline-none focus:border-[#B519FF] text-sm text-white font-medium transition-all" 
                required 
              />
              {!password && (
                <span className="absolute left-12 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                  ••••••••
                </span>
              )}
              <svg className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-[#B519FF] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#B519FF] text-white p-4 rounded-xl font-bold hover:bg-purple-600 transition shadow-[0_0_15px_rgba(181,25,255,0.3)] disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Authenticating...
              </>
            ) : (
              'Login to Admin Panel'
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-800 pt-6">
          <p className="text-xs text-gray-500">
            Authorized personnel only. All activities are logged.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function AdminLoginPage({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] text-[#B519FF]">
        <div className="w-10 h-10 border-4 border-current border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <AdminLoginContent params={params} />
    </Suspense>
  );
}