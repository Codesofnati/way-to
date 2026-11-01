'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminReport({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [targetUserId, setTargetUserId] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  useEffect(() => {
    if (!user.id) return router.push(`/${locale}/auth`);
  }, [router, locale, user.id]);

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/report`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: user.id, targetUserId, reason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert('Report submitted to Super Admin successfully.');
      setTargetUserId(''); setReason('');
    } catch (err: any) { alert(err.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-12 relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-0 right-[-10%] w-[300px] h-[300px] bg-red-500/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>

      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">Report a User</h1>
        <p className="text-gray-400 font-medium">Send a report directly to the Super Admin if a user breaks the rules.</p>
      </div>
      
      <div className="bg-[#131825] p-6 md:p-10 rounded-[2rem] border border-red-500/30 relative overflow-hidden shadow-[0_0_30px_rgba(239,68,68,0.05)]">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-500/10 rounded-full blur-3xl"></div>

        <div className="flex items-center gap-3 mb-8 relative z-10">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Submit a Report</h2>
            <p className="text-xs text-gray-400">This will be sent directly to the Super Admin.</p>
          </div>
        </div>

        <form onSubmit={handleReport} className="space-y-6 relative z-10">
          
          {/* User ID */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">User ID or Phone Number</label>
            <div className="relative">
              <input 
                type="text" 
                value={targetUserId} 
                onChange={e => setTargetUserId(e.target.value)} 
                className="w-full p-4 pl-12 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-red-500 transition-colors" 
                required 
              />
              {!targetUserId && (
                <span className="absolute left-12 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                  Enter Phone Number or UUID
                </span>
              )}
              <svg className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Reason for Report</label>
            <div className="relative">
              <textarea 
                value={reason} 
                onChange={e => setReason(e.target.value)} 
                className="w-full p-4 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-red-500 h-32 resize-none transition-colors" 
                required 
              />
              {!reason && (
                <span className="absolute left-4 top-4 text-gray-500 text-sm pointer-events-none">
                  Explain why you are reporting this user...
                </span>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={submitting} 
            className="w-full bg-red-600 text-white p-4 rounded-xl font-bold hover:bg-red-700 transition shadow-[0_0_15px_rgba(239,68,68,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Submitting Report...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                Submit Report
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}