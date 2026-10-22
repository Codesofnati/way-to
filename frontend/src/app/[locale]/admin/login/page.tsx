'use client';

import { useState, use, Suspense } from 'react';

function AdminLoginContent({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = use(params);
  const locale = resolvedParams.locale;
  const isAmharic = locale === 'am';

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
      window.location.href = `/${locale}/admin/dashboard`; // Admin dashboard
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
          {isAmharic ? 'የአድሚን መግቢያ' : 'Admin Portal Login'}
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{isAmharic ? 'ስልክ ቁጥር' : 'Phone Number'}</label>
            <input 
              type="tel" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+251..."
              className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{isAmharic ? 'የይለፍ ቃል' : 'Password'}</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gray-900 text-white p-3 rounded-xl font-medium hover:bg-black transition disabled:opacity-50"
          >
            {loading ? '...' : (isAmharic ? 'ግባ' : 'Login to Admin Panel')}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function AdminLoginPage({ params }: { params: Promise<{ locale: string }> }) {
  return <Suspense fallback={<div>Loading...</div>}><AdminLoginContent params={params} /></Suspense>;
}