'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function UserBankInfo({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [banks, setBanks] = useState<any[]>([]);
  const [myBankDetails, setMyBankDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({ bankId: '', accountHolderName: '', accountNumber: '' });

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  const isAmharic = locale === 'am';

  useEffect(() => {
    if (!user.id) return router.push(`/${locale}/auth`);
    
    Promise.all([
      fetch(`${apiUrl}/api/banks`).then(res => res.json()),
      fetch(`${apiUrl}/api/user/${user.id}/bank-details`).then(res => res.json())
    ]).then(([banksRes, detailsRes]) => {
      if (banksRes.success) setBanks(banksRes.banks);
      if (detailsRes.success) setMyBankDetails(detailsRes.details);
    }).finally(() => setLoading(false));
  }, [router, locale, user.id, apiUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm(isAmharic ? 'ማስጠንቀቂያ፡ የባንክ መረጃ ከተቀመጠ በኋላ መቀየር አይቻልም። ይህ ትክክል መሆኑን እርግጠኛ ነዎት?' : 'WARNING: Bank information cannot be modified after saving. Are you sure this is correct?')) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/user/${user.id}/bank-details`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert(isAmharic ? 'የባንክ መረጃ በተሳካ ሁኔታ ተቀምጧል!' : 'Bank information saved successfully!');
      setMyBankDetails(data.details);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E4E79]"></div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-24 relative overflow-hidden">
      
      {/* ✅ Decorative Background Blur - Updated to Deep Blue */}
      <div className="absolute top-0 right-[-20%] w-64 h-64 bg-[#1E4E79]/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-[-20%] w-64 h-64 bg-[#15608D]/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center justify-center pt-6">
        <div className="relative">
          {/* ✅ Glow updated to deep blue */}
          <div className="absolute inset-0 bg-[#1E4E79] blur-xl opacity-40 rounded-[1.5rem]"></div>
          {/* ✅ Updated gradient & icon style */}
          <div className="w-20 h-20 bg-gradient-to-tr from-[#1E4E79] to-[#15608D] rounded-[1.5rem] flex items-center justify-center shadow-lg border-2 border-white relative z-10 mb-3 transform transition hover:scale-105 duration-300">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
          </div>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight text-center">
          {isAmharic ? 'የባንክ መረጃ' : 'Bank Information'}
        </h1>
        <p className="text-sm font-medium text-gray-500 mt-1 text-center">
          {isAmharic ? 'ገንዘብ ማውጣት የሚላክበት ቦታ ነው።' : 'This is where your withdrawals will be sent.'}
        </p>
      </div>

      {myBankDetails ? (
        /* ✅ VIEW MODE (Locked) */
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-blue-100 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="flex items-center justify-center flex-col gap-3 mb-8">
            {/* ✅ Updated success check to deep blue gradient */}
            <div className="w-16 h-16 bg-gradient-to-tr from-[#1E4E79] to-[#15608D] text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-900/30">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">
                {isAmharic ? 'የባንክ መረጃ ተቀምጧል' : 'Bank Information Saved'}
              </h2>
              <p className="text-sm text-[#1E4E79] font-bold uppercase tracking-wider mt-1">
                {isAmharic ? 'የተረጋገጠ እና የተቆለፈ' : 'Verified & Locked'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 col-span-1 md:col-span-2">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{isAmharic ? 'የባንክ ስም' : 'Bank Name'}</p>
              <p className="font-bold text-lg text-gray-900 flex items-center gap-2">
                {/* ✅ Updated icon color to deep blue */}
                <svg className="w-5 h-5 text-[#1E4E79]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                {myBankDetails.bankName}
              </p>
            </div>
            <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{isAmharic ? 'የሂሳብ ባለቤት ስም' : 'Account Holder Name'}</p>
              <p className="font-bold text-gray-900">{myBankDetails.accountHolderName}</p>
            </div>
            {/* ✅ Updated account number box to deep blue */}
            <div className="bg-blue-50/80 p-4 rounded-2xl border border-blue-100">
              <p className="text-[10px] text-[#1E4E79] font-bold uppercase tracking-wider mb-1">{isAmharic ? 'የሂሳብ ቁጥር' : 'Account Number'}</p>
              <p className="font-mono font-black text-[#1E4E79] text-lg tracking-wider">{myBankDetails.accountNumber}</p>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            <p className="text-sm text-red-700 font-medium">
              {isAmharic ? 'መረጃው ከተጨመረ በኋላ መቀየር አይቻልም። ማዘመን ከፈለጉ እባክዎ የደንበኛ አገልግሎትን ያግኙ።' : 'Information cannot be modified after it is added. If you need to update, please contact online customer service.'}
            </p>
          </div>
        </div>
      ) : (
        /* ✅ FORM MODE */
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-gray-100 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="bg-orange-50/80 p-5 rounded-2xl border border-orange-100 flex items-start gap-3 mb-2">
              <svg className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              <p className="text-sm text-orange-800 font-medium">
                {isAmharic ? 'እባክዎ ዝርዝሮችዎን በደንብ ያረጋግጡ። ከተቀመጠ በኋላ ይህን መረጃ መቀየር አይችሉም።' : 'Please double-check your details. You cannot change this information after saving.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2 flex items-center gap-1.5">
                {/* ✅ Updated icon colors to deep blue */}
                <svg className="w-4 h-4 text-[#1E4E79]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                {isAmharic ? 'ባንክ ይምረጡ' : 'Choose Bank'}
              </label>
              <select 
                value={formData.bankId} 
                onChange={e => setFormData({...formData, bankId: e.target.value})} 
                className="w-full p-4 bg-white border border-gray-300 rounded-2xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1E4E79] transition-all"
                required
              >
                <option value="" disabled className="text-gray-400">{isAmharic ? 'ባንክ ይምረጡ...' : 'Select a bank...'}</option>
                {banks.map(bank => (
                  <option key={bank.id} value={bank.id}>{bank.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[#1E4E79]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                {isAmharic ? 'የሂሳብ ባለቤት ስም' : 'Account Holder Name'}
              </label>
              <input 
                type="text" 
                value={formData.accountHolderName} 
                onChange={e => setFormData({...formData, accountHolderName: e.target.value})} 
                placeholder={isAmharic ? 'በባንክ ሂሳብ ላይ ያለው ትክክለኛ ስም' : 'Exact name on bank account'}
                className="w-full p-4 bg-white border border-gray-300 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E4E79] transition-all" 
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[#1E4E79]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path></svg>
                {isAmharic ? 'የሂሳብ ቁጥር' : 'Account Number'}
              </label>
              <input 
                type="text" 
                value={formData.accountNumber} 
                onChange={e => setFormData({...formData, accountNumber: e.target.value})} 
                placeholder={isAmharic ? 'የባንክ ሂሳብ ቁጥርዎ' : 'Your bank account number'}
                className="w-full p-4 bg-white border border-gray-300 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E4E79] transition-all" 
                required
              />
            </div>

            {/* ✅ Updated submit button to deep blue gradient */}
            <button 
              type="submit" 
              disabled={submitting} 
              className="w-full bg-gradient-to-br from-[#1E4E79] to-[#15608D] text-white p-4 rounded-2xl font-bold hover:opacity-95 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none mt-4 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isAmharic ? 'በማስቀመጥ ላይ...' : 'Saving...'}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                  {isAmharic ? 'የባንክ መረጃ አስቀምጥ' : 'Save Bank Information'}
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}