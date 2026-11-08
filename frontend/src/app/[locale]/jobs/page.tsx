'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function UserJobs({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [jobs, setJobs] = useState<any[]>([]);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ✅ NEW: Custom Message & Confirmation State
  const [message, setMessage] = useState({ text: '', type: '' });
  const [confirmJob, setConfirmJob] = useState<any>(null);

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  const isAmharic = locale === 'am';

  useEffect(() => {
    if (!user.id) return router.push(`/${locale}/auth`);
    fetchData();
  }, [router, locale, user.id, apiUrl]);

  const fetchData = async () => {
    try {
      const [jobsRes, myJobsRes, userRes] = await Promise.all([
        fetch(`${apiUrl}/api/jobs`).then(res => res.json()),
        fetch(`${apiUrl}/api/user/${user.id}/my-jobs`).then(res => res.json()),
        fetch(`${apiUrl}/api/user/${user.id}/dashboard`).then(res => res.json())
      ]);
      if (jobsRes.success) setJobs(jobsRes.jobs);
      if (myJobsRes.success) setMyJobs(myJobsRes.myJobs);
      if (userRes.success) setUserData(userRes);
    } finally { setLoading(false); }
  };

  const handleInitialBuy = (job: any) => {
    setMessage({ text: '', type: '' });
    
    if (myJobs.length > 0) {
      return setMessage({ 
        text: isAmharic ? 'አስቀድመው ንቁ ስራ አለዎት። እባክዎ አዲስ ለመግዛት በመጀመሪያ ድጋፍን ያግኙ።' : 'You already have an active job. Please contact support to terminate it first.', 
        type: 'error' 
      });
    }
    
    // Check wallet balance before showing modal
    const walletBal = parseFloat(userData?.user?.walletBalance || '0');
    if (walletBal < parseFloat(job.price)) {
      return setMessage({ 
        text: isAmharic ? 'በቂ የኪስ ቦርሳ ቀሪ ሂሳብ የለዎትም። እባክዎ መጀመሪያ ገንዘብ ያስገቡ።' : 'Insufficient wallet balance. Please deposit funds first.', 
        type: 'error' 
      });
    }

    setConfirmJob(job);
  };

  const confirmBuyJob = async () => {
    if (!confirmJob) return;
    
    const jobId = confirmJob.id;
    setConfirmJob(null); // Close modal
    setSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await fetch(`${apiUrl}/api/user/${user.id}/buy-job`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setMessage({ 
        text: isAmharic ? 'ስራው ተከፍቷል! ገቢ ለማግኘት ወደ ተግባር ማዕከል ይሂዱ።' : 'Job unlocked! Go to the Tasks page to start earning.', 
        type: 'success' 
      });
      fetchData();
    } catch (err: any) { 
      setMessage({ text: err.message, type: 'error' }); 
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E4E79]"></div>
    </div>
  );

  const hasActiveJob = myJobs.length > 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-24 relative overflow-hidden">
      
      <div className="absolute top-0 right-[-20%] w-64 h-64 bg-[#1E4E79]/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-[-20%] w-64 h-64 bg-[#15608D]/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
            {isAmharic ? 'የስራ ምዝገባ' : 'Job Registration'}
          </h1>
          <p className="text-gray-500 font-medium">
            {isAmharic ? 'ተግባሮችን ለመክፈት ስራ ይመዝገቡ።' : 'Register for a job to unlock tasks.'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-[#1E4E79] to-[#15608D] text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden group w-full md:w-auto">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10">
            <p className="text-xs text-blue-100 uppercase font-bold tracking-wider mb-1">
              {isAmharic ? 'ያለዎት ቀሪ ሂሳብ' : 'Available Balance'}
            </p>
            <p className="text-3xl font-black tracking-tight">ETB {userData?.user?.walletBalance || '0.00'}</p>
          </div>
        </div>
      </div>

      {/* ✅ NEW: Custom Message Display */}
      {message.text && (
        <div className={`relative z-10 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${
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

      {hasActiveJob && (
        <div className="bg-orange-50/80 backdrop-blur-md border border-orange-200 p-6 rounded-[2rem] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <div>
              <p className="text-xs text-orange-600 font-bold uppercase tracking-wider mb-1">
                {isAmharic ? 'ንቁ ስራ ተቆልፏል' : 'Active Job Locked'}
              </p>
              <h2 className="text-xl font-bold text-orange-900">{myJobs[0].jobName}</h2>
              <p className="text-sm text-orange-700 mt-1">
                {isAmharic ? 'አዲስ ለመግዛት በመጀመሪያ ይህን ስራ ለማቋረጥ ድጋፍን ማግኘት አለብዎት።' : 'You must contact support to terminate this job before buying a new one.'}
              </p>
            </div>
          </div>
          <a href={`/${locale}/contact`} className="bg-orange-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-orange-700 transition whitespace-nowrap shadow-md hover:shadow-lg">
            {isAmharic ? 'ድጋፍ ያግኙ' : 'Contact Support'}
          </a>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:gap-6 relative z-10">
        {jobs.map((job: any) => (
          <div key={job.id} className="bg-white/95 backdrop-blur-md p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-gray-100 hover:border-[#1E4E79]/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between">
            <div>
              <div className="flex flex-col md:flex-row justify-between items-start mb-3 md:mb-4 gap-2">
                <div>
                  <h3 className="text-sm md:text-lg font-bold text-gray-900 group-hover:text-[#1E4E79] transition-colors leading-tight">{job.name}</h3>
                  <p className="text-[10px] md:text-sm text-gray-500 mt-1 line-clamp-2">{job.description}</p>
                </div>
                <div className="bg-blue-50 text-[#1E4E79] px-2 py-1 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold whitespace-nowrap shadow-sm">
                  ETB {job.price}
                </div>
              </div>
              <div className="flex flex-col md:flex-row justify-between text-xs md:text-sm mb-4 md:mb-6 bg-gray-50/80 p-2 md:p-4 rounded-xl md:rounded-2xl border border-gray-100 gap-2">
                <div>
                  <p className="text-[8px] md:text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5 md:mb-1">{isAmharic ? 'ተግባሮች' : 'Tasks'}</p>
                  <p className="font-bold text-gray-900">{job.taskCount} {isAmharic ? 'ቪዲዮዎች' : 'Videos'}</p>
                </div>
                <div className="md:text-right">
                  <p className="text-[8px] md:text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5 md:mb-1">{isAmharic ? 'ያግኙ' : 'Earn'}</p>
                  <p className="font-bold text-[#1E4E79]">ETB {job.rewardPerTask} <span className="text-[10px] font-medium text-[#1E4E79]/70">/ {isAmharic ? 'ቪዲዮ' : 'video'}</span></p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => handleInitialBuy(job)} 
              disabled={hasActiveJob || submitting}
              className={`w-full py-2 md:py-3 rounded-xl text-xs md:text-base font-bold transition-all ${
                hasActiveJob 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-[#1E4E79] text-white hover:bg-[#15608D] hover:shadow-lg'
              }`}
            >
              {hasActiveJob 
                ? (isAmharic ? 'ስራ ንቁ ነው' : 'Active') 
                : (isAmharic ? 'ስራ ግዛ' : 'Buy Job')}
            </button>
          </div>
        ))}
      </div>

      {/* ✅ NEW: Custom Confirmation Modal */}
      {confirmJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-blue-100 text-[#1E4E79] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              {isAmharic ? 'ስራ መግዛት' : 'Confirm Purchase'}
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              {isAmharic 
                ? `ይህን ስራ በ ETB ${confirmJob.price} መግዛት ይፈልጋሉ?` 
                : `Buy this job for ETB ${confirmJob.price}?`}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmJob(null)}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition"
              >
                {isAmharic ? 'ሰርዝ' : 'Cancel'}
              </button>
              <button 
                onClick={confirmBuyJob}
                className="flex-1 py-3 px-4 bg-gradient-to-br from-[#1E4E79] to-[#15608D] text-white font-bold rounded-xl hover:opacity-95 transition shadow-lg"
              >
                {isAmharic ? 'አረጋግጥ' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}