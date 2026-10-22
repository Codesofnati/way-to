'use client';

import { useState, useEffect, use, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function AuthContent({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = use(params);
  const locale = resolvedParams.locale;
  const isAmharic = locale === 'am';
  
  const searchParams = useSearchParams();
  const refId = searchParams.get('ref') || '';

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [invitedBy, setInvitedBy] = useState(refId);
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (refId) {
      setInvitedBy(refId);
      setIsSignup(true); // Automatically switch to signup if ref link is opened
    }
  }, [refId]);

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (isSignup && password !== confirmPassword) {
    alert(isAmharic ? 'የይለፍ ቃሎቹ አይመሳሰሉም!' : 'Passwords do not match!');
    return;
  }

  setLoading(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  try {
    const endpoint = isSignup ? '/api/auth/register' : '/api/auth/login';
    const bodyData = isSignup 
      ? { phone, password, invitedBy: invitedBy || null }
      : { phone, password };

    const res = await fetch(`${apiUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Authentication failed');

    if (!isSignup) {
      // ✅ NEW: Block admins from logging in here
      if (data.user.role === 'admin' || data.user.role === 'super_admin') {
        throw new Error(
          isAmharic 
            ? 'ይህ የተጠቃሚ መግቢያ ነው። እባክዎ የአድሚን ፖርታል ይጠቀሙ።' 
            : 'This is the user portal. Please use the admin portal.'
        );
      }
      
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = `/${locale}/dashboard`;
    } else {
      alert(isAmharic ? 'በተሳካ ሁኔታ ተመዝግበዋል! አሁን ይግቡ' : 'Registered successfully! Please login.');
      setIsSignup(false);
    }
  } catch (err: any) {
    alert(err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border">
        <h1 className="text-2xl font-bold mb-6 text-indigo-600 text-center">
          {isSignup ? (isAmharic ? 'መመዝገቢያ' : 'Create Account') : (isAmharic ? 'ግባ' : 'Login')}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isAmharic ? 'ስልክ ቁጥር' : 'Phone Number'}
            </label>
            <input 
              type="tel" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+251..."
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isAmharic ? 'የይለፍ ቃል' : 'Password'}
            </label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              required 
            />
          </div>

          {isSignup && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isAmharic ? 'የይለፍ ቃል ማረጋገጫ' : 'Confirm Password'}
                </label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isAmharic ? 'የጋባዥ መታወቂያ' : 'Inviter ID'}
                </label>
                <input 
                  type="text" 
                  value={invitedBy} 
                  onChange={(e) => setInvitedBy(e.target.value)}
                  placeholder="Parent User UUID"
                  className="w-full p-3 border rounded-xl bg-gray-50 text-gray-600 outline-none"
                />
              </div>
            </>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white p-3 rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? '...' : (isSignup ? (isAmharic ? 'ይመዝገቡ' : 'Sign Up') : (isAmharic ? 'ይግቡ' : 'Login'))}
          </button>
        </form>

        <button 
          onClick={() => setIsSignup(!isSignup)}
          className="w-full mt-4 text-sm text-indigo-600 hover:underline text-center block"
        >
          {isSignup 
            ? (isAmharic ? 'መለያ አለዎት? ይግቡ' : 'Already have an account? Login') 
            : (isAmharic ? 'መለያ የለዎትም? ይመዝገቡ' : "Don't have an account? Sign Up")}
        </button>
      </div>
    </main>
  );
}

export default function AuthPage({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AuthContent params={params} />
    </Suspense>
  );
}