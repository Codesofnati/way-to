'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function UserSecurity({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [submitting, setSubmitting] = useState(false);

  // ✅ NEW: Unified Message State
  const [message, setMessage] = useState({ text: '', type: '' });

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  const isAmharic = locale === 'am';

  useEffect(() => {
    if (!user.id) return router.push(`/${locale}/auth`);
  }, [router, locale, user.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: '', type: '' }); // Clear previous messages

    // ✅ CLIENT-SIDE VALIDATION
    if (!passwords.current) {
      return setMessage({ 
        text: isAmharic ? 'እባክዎ የአሁኑን የይለፍ ቃል ያስገቡ።' : 'Please enter your current password.', 
        type: 'error' 
      });
    }
    if (passwords.new.length < 6) {
      return setMessage({ 
        text: isAmharic ? 'አዲሱ የይለፍ ቃል ቢያንስ 6 ፊደሎች መሆን አለበት።' : 'New password must be at least 6 characters.', 
        type: 'error' 
      });
    }
    if (passwords.new !== passwords.confirm) {
      return setMessage({ 
        text: isAmharic ? 'አዲሶቹ የይለፍ ቃላት አይመሳሰሉም።' : 'New passwords do not match.', 
        type: 'error' 
      });
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/user/${user.id}/password`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          currentPassword: passwords.current, 
          newPassword: passwords.new 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setMessage({ 
        text: isAmharic ? 'የይለፍ ቃል በተሳካ ሁኔታ ተዘምኗል!' : 'Password updated successfully!', 
        type: 'success' 
      });
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-24 relative overflow-hidden">
      
      <div className="absolute top-0 right-[-20%] w-64 h-64 bg-[#1E4E79]/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-[-20%] w-64 h-64 bg-[#15608D]/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center justify-center pt-6">
        <div className="relative">
          <div className="absolute inset-0 bg-[#1E4E79] blur-xl opacity-40 rounded-[1.5rem]"></div>
          <div className="w-20 h-20 bg-gradient-to-tr from-[#1E4E79] to-[#15608D] rounded-[1.5rem] flex items-center justify-center shadow-lg border-2 border-white relative z-10 mb-3 transform transition hover:scale-105 duration-300">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight text-center">
          {isAmharic ? 'ደህንነት' : 'Security'}
        </h1>
        <p className="text-sm font-medium text-gray-500 mt-1 text-center max-w-md mx-auto">
          {isAmharic ? 'መለያዎን ደህንነቱ የተጠበቀ ለማድረግ የይለፍ ቃልዎን ይቀይሩ።' : 'Change your password to keep your account safe.'}
        </p>
      </div>

      <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-gray-100 relative z-10">
        
        {/* ✅ NEW: Custom Unified Message Display */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${
            message.type === 'error' 
              ? 'bg-red-50 border border-red-200 text-red-700' 
              : 'bg-green-50 border border-green-200 text-green-700'
          }`}>
            {message.type === 'error' ? (
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            ) : (
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            )}
            <div className="flex-1 text-sm font-medium">
              {message.text}
            </div>
            <button type="button" onClick={() => setMessage({ text: '', type: '' })} className="opacity-50 hover:opacity-100 transition-opacity">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#1E4E79]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
              {isAmharic ? 'የአሁኑ የይለፍ ቃል' : 'Current Password'}
            </label>
            <input 
              type="password" 
              value={passwords.current} 
              onChange={e => {
                setPasswords({...passwords, current: e.target.value});
                if (message.text) setMessage({ text: '', type: '' });
              }} 
              placeholder="••••••••"
              className="w-full p-4 bg-white border border-gray-300 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E4E79] transition-all" 
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#1E4E79]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              {isAmharic ? 'አዲስ የይለፍ ቃል' : 'New Password'}
            </label>
            <input 
              type="password" 
              value={passwords.new} 
              onChange={e => {
                setPasswords({...passwords, new: e.target.value});
                if (message.text) setMessage({ text: '', type: '' });
              }} 
              placeholder="••••••••"
              className="w-full p-4 bg-white border border-gray-300 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E4E79] transition-all" 
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#1E4E79]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              {isAmharic ? 'አዲሱን የይለፍ ቃል ያረጋግጡ' : 'Confirm New Password'}
            </label>
            <input 
              type="password" 
              value={passwords.confirm} 
              onChange={e => {
                setPasswords({...passwords, confirm: e.target.value});
                if (message.text) setMessage({ text: '', type: '' });
              }} 
              placeholder="••••••••"
              className="w-full p-4 bg-white border border-gray-300 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E4E79] transition-all" 
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={submitting} 
            className="w-full bg-gradient-to-br from-[#1E4E79] to-[#15608D] text-white p-4 rounded-2xl font-bold hover:opacity-95 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none mt-4 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {isAmharic ? 'በማዘመን ላይ...' : 'Updating...'}
              </>
            ) : (
              isAmharic ? 'የይለፍ ቃል አዘምን' : 'Update Password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}