'use client';

import { useState, useEffect, use, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function AuthContent({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = use(params);
  const locale = resolvedParams.locale;
  const isAmharic = locale === 'am';
  
  const searchParams = useSearchParams();
  const refId = searchParams.get('ref') || '';
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [invitedBy, setInvitedBy] = useState(refId);
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (refId) {
      setInvitedBy(refId);
      setIsSignup(true);
    }
  }, [refId]);

  const toggleLanguage = () => {
    const newLocale = isAmharic ? 'en' : 'am';
    const newPath = refId ? `/${newLocale}/auth?ref=${refId}` : `/${newLocale}/auth`;
    router.push(newPath);
  };

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

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          res.status >= 500
            ? (isAmharic ? 'አገልጋዩ በአሁኑ ጊዜ አይገኝም። እባክዎ ከጥቂት ሰዓታት በኋላ ይሞክሩ።' : 'The server is currently unavailable. Please try again in a moment.')
            : (isAmharic ? 'የተሳሳተ ምላሽ። እባክዎ እንደገና ይሞክሩ።' : 'Something went wrong. Please try again.')
        );
      }

      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      if (!isSignup) {
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
    <main className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-6 relative overflow-hidden">
      
      <button 
        onClick={toggleLanguage} 
        className="absolute top-6 right-6 z-50 bg-purple-50 text-[#B519FF] px-4 py-2 rounded-xl text-xs font-bold shadow-sm border border-purple-100 hover:bg-purple-100 transition-colors"
      >
        {isAmharic ? 'English' : 'አማርኛ'}
      </button>

      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#B519FF]/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10">
        
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-[#B519FF] blur-xl opacity-40 rounded-[1.5rem]"></div>
            <div className="w-16 h-16 bg-gradient-to-tr from-[#B519FF] to-purple-400 rounded-[1.25rem] flex items-center justify-center shadow-lg border-2 border-white relative z-10 mb-4 transform transition hover:scale-105 duration-300">
              <span className="text-white text-2xl font-black drop-shadow-md">W</span>
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight text-center">
            {isSignup ? (isAmharic ? 'መመዝገቢያ' : 'Create Account') : (isAmharic ? 'እንኳን ደህና መጡ' : 'Welcome Back')}
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-1 text-center">
            {isSignup 
              ? (isAmharic ? 'አዲስ መለያ ይፍጠሩ' : 'Sign up to get started.') 
              : (isAmharic ? 'መለያዎን ለመክፈት ይግቡ' : 'Login to your account.')}
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur-md p-8 rounded-[2rem] shadow-xl border border-gray-100">
          
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                {isAmharic ? 'ስልክ ቁጥር' : 'Phone Number'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                </div>
                <div className="relative">
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#B519FF] focus:bg-white transition-all"
                    required 
                  />
                  {!phone && (
                    <span className="absolute left-12 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                      +251...
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                {isAmharic ? 'የይለፍ ቃል' : 'Password'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                </div>
                <div className="relative">
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#B519FF] focus:bg-white transition-all"
                    required 
                  />
                  {!password && (
                    <span className="absolute left-12 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                      ••••••••
                    </span>
                  )}
                </div>
              </div>
            </div>

            {isSignup && (
              <>
                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                    {isAmharic ? 'የይለፍ ቃል ማረጋገጫ' : 'Confirm Password'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                    </div>
                    <div className="relative">
                      <input 
                        type="password" 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#B519FF] focus:bg-white transition-all"
                        required 
                      />
                      {!confirmPassword && (
                        <span className="absolute left-12 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                          ••••••••
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {refId && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                      {isAmharic ? 'የጋባዥ መታወቂያ' : 'Inviter ID'}
                    </label>
                    <input 
                      type="text" 
                      value={invitedBy} 
                      readOnly
                      className="w-full p-4 bg-purple-50 border border-purple-100 text-[#B519FF] font-mono rounded-2xl text-sm outline-none cursor-not-allowed"
                    />
                    <p className="text-xs text-[#B519FF] mt-2 font-bold flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      {isAmharic ? 'በጓደኛዎ ተጋብዘዋል!' : 'You were invited by a friend!'}
                    </p>
                  </div>
                )}
              </>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#B519FF] text-white p-4 rounded-2xl font-bold hover:bg-purple-600 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isAmharic ? 'በሂደት ላይ...' : 'Processing...'}
                </>
              ) : (
                isSignup ? (isAmharic ? 'ይመዝገቡ' : 'Sign Up') : (isAmharic ? 'ይግቡ' : 'Login')
              )}
            </button>
          </form>

          <button 
            onClick={() => setIsSignup(!isSignup)}
            className="w-full mt-6 text-sm text-gray-500 hover:text-[#B519FF] transition-colors text-center block font-medium"
          >
            {isSignup 
              ? (isAmharic ? 'መለያ አለዎት? ይግቡ' : 'Already have an account? Login') 
              : (isAmharic ? 'መለያ የለዎትም? ይመዝገቡ' : "Don't have an account? Sign Up")}
          </button>

        </div>
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