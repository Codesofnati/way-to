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
    <main className="min-h-screen flex items-center justify-center bg-gray-900 p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 text-center">
          Admin Portal Login
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <div className="relative">
              <input 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium transition-all"
                required 
              />
              {!phone && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                  +251...
                </span>
              )}
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium transition-all"
                required 
              />
              {!password && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                  ••••••••
                </span>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gray-900 text-white p-3 rounded-xl font-medium hover:bg-black transition disabled:opacity-50 mt-2"
          >
            {loading ? 'Processing...' : 'Login to Admin Panel'}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function AdminLoginPage({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading...</div>}>
      <AdminLoginContent params={params} />
    </Suspense>
  );
}