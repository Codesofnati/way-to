'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UserWithdraw({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [userData, setUserData] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [bankDetails, setBankDetails] = useState<any>(null); // ✅ Track bank info
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Time Restriction State
  const [isTimeAllowed, setIsTimeAllowed] = useState(false);
  const [timeMessage, setTimeMessage] = useState('');

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  const isAmharic = locale === 'am';

  useEffect(() => {
    if (!user.id) return router.push(`/${locale}/auth`);
    fetchData();
    
    checkTimeWindow();
    const interval = setInterval(checkTimeWindow, 60000);
    return () => clearInterval(interval);
  }, [router, locale, user.id, apiUrl]);

  const fetchData = async () => {
    try {
      const [userRes, settingsRes, requestsRes, bankRes] = await Promise.all([
        fetch(`${apiUrl}/api/user/${user.id}/dashboard`).then(res => res.json()),
        fetch(`${apiUrl}/api/withdraw-settings`).then(res => res.json()),
        fetch(`${apiUrl}/api/user/${user.id}/my-withdrawals`).then(res => res.json()),
        fetch(`${apiUrl}/api/user/${user.id}/bank-details`).then(res => res.json()) // ✅ Fetch bank info
      ]);
      
      if (userRes.success) setUserData(userRes);
      if (settingsRes.success) setSettings(settingsRes.settings);
      if (requestsRes.success) setMyRequests(requestsRes.requests);
      if (bankRes.success) setBankDetails(bankRes.details);
    } finally { setLoading(false); }
  };

  // Time Restriction Logic (Local PC Time: 8 AM to 4 PM)
  const checkTimeWindow = () => {
    const now = new Date();
    const currentHour = now.getHours();
    
    if (currentHour >= 8 && currentHour < 16) {
      setIsTimeAllowed(true);
      setTimeMessage(isAmharic ? '✅ ገንዘብ ማውጣት አሁን ክፍት ነው።' : '✅ Withdrawals are currently OPEN.');
    } else {
      setIsTimeAllowed(false);
      setTimeMessage(isAmharic ? '⚠️ ገንዘብ ማውጣት ተዘግቷል። በየቀኑ ከጠዋቱ 2:00 እስከ ምሽቱ 10:00 ክፍት ነው።' : '⚠️ Withdrawals are CLOSED. Open daily from 8:00 AM to 4:00 PM.');
    }
  };

  const handleRequest = async () => {
    if (!selectedAmount) return;
    if (!isTimeAllowed) return alert(isAmharic ? 'ገንዘብ ማውጣት አሁን ተዘግቷል። እባክዎ በሚፈቀዱ ሰዓታት ውስጥ ይመለሱ።' : 'Withdrawals are currently closed for the day. Please come back during the allowed hours.');
    if (!bankDetails) return alert(isAmharic ? 'እባክዎ መጀመሪያ የባንክ መረጃዎን ያስገቡ።' : 'Please add your bank information first.');
    
    if (!confirm(isAmharic ? `እርግጠኛ ነዎት ETB ${selectedAmount} ማውጣት ይፈልጋሉ?` : `Are you sure you want to withdraw ETB ${selectedAmount}?`)) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/user/${user.id}/withdraw`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: selectedAmount })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert(isAmharic ? 'የገንዘብ ማውጣት ጥያቄ ተልኳል! የአድሚን ማረጋገጫ በመጠበቅ ላይ።' : 'Withdrawal request submitted! Waiting for admin approval.');
      setSelectedAmount(null);
      fetchData(); 
    } catch (err: any) { alert(err.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E4E79]"></div>
    </div>
  );

  const allowedAmounts = settings ? JSON.parse(settings.amounts) : [];
  const taxPercent = settings ? parseFloat(settings.taxPercent) : 0;
  const taxAmount = selectedAmount ? (selectedAmount * (taxPercent / 100)).toFixed(2) : '0.00';
  const receiveAmount = selectedAmount ? (selectedAmount - parseFloat(taxAmount)).toFixed(2) : '0.00';

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-24 relative overflow-hidden">
      
      {/* ✅ Decorative Background Blur - Updated to Deep Blue */}
      <div className="absolute top-0 right-[-20%] w-64 h-64 bg-[#1E4E79]/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-[-20%] w-64 h-64 bg-[#15608D]/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
            {isAmharic ? 'ገንዘብ ማውጣት' : 'Withdraw Funds'}
          </h1>
          <p className="text-gray-500 font-medium">
            {isAmharic ? 'ወደ ባንክዎ ለማውጣት የሚፈልጉትን መጠን ይምረጡ።' : 'Select an amount to withdraw to your bank.'}
          </p>
        </div>

        {/* ✅ Time Restriction Banner - Updated Open state to Deep Blue */}
        <div className={`p-4 rounded-2xl border font-bold text-sm flex items-center gap-2 w-full md:w-auto ${
          isTimeAllowed ? 'bg-blue-50/80 border-blue-200 text-[#1E4E79]' : 'bg-red-50/80 border-red-200 text-red-700'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isTimeAllowed ? 'bg-[#1E4E79] animate-pulse' : 'bg-red-500'}`}></div>
          {timeMessage}
        </div>
      </div>

      {/* ✅ Main Balance - Updated to Deep Blue Gradient */}
      <div className="bg-gradient-to-br from-[#1E4E79] to-[#15608D] text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden group z-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-500"></div>
        <p className="text-xs text-blue-100 uppercase font-bold tracking-wider mb-1">
          {isAmharic ? 'ያለዎት ቀሪ ሂሳብ' : 'Available Balance'}
        </p>
        <h2 className="text-4xl font-black tracking-tight">ETB {userData?.user?.walletBalance || '0.00'}</h2>
      </div>

      {/* ✅ BANK INFO CHECK */}
      {!bankDetails ? (
        <div className="bg-orange-50/80 backdrop-blur-md p-8 rounded-[2rem] border border-orange-200 text-center relative z-10 shadow-sm">
          <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <h3 className="text-xl font-bold text-orange-900 mb-2">
            {isAmharic ? 'የባንክ መረጃ ያስፈልጋል' : 'Bank Information Required'}
          </h3>
          <p className="text-orange-700 max-w-md mx-auto mb-6 text-sm">
            {isAmharic 
              ? 'ገንዘብ ከማውጣትዎ በፊት እባክዎ የባንክ መለያዎን መረጃ ማስገባት አለብዎት። ይህ መረጃ ለአንድ ጊዜ ብቻ ነው የሚሞላው።' 
              : 'You must add your bank information before you can request a withdrawal. This information is locked once saved.'}
          </p>
          <Link 
            href={`/${locale}/bank-info`} 
            className="inline-flex items-center justify-center gap-2 bg-orange-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-700 transition shadow-md"
          >
            {isAmharic ? 'የባንክ መረጃ ያስገቡ' : 'Add Bank Information'}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
          
          {/* Request Form */}
          <div className="bg-white/90 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              {/* ✅ Updated icon background to deep blue */}
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#1E4E79]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              {isAmharic ? 'መጠን ይምረጡ' : 'Select Amount'}
            </h2>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              {allowedAmounts.map((amount: number) => (
                <button 
                  key={amount}
                  onClick={() => setSelectedAmount(amount)}
                  disabled={!isTimeAllowed}
                  className={`p-4 rounded-2xl font-bold border-2 transition-all ${
                    !isTimeAllowed 
                      ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50' 
                      : selectedAmount === amount 
                        ? 'border-[#1E4E79] bg-blue-50 text-[#1E4E79] shadow-sm transform scale-105' 
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-[#1E4E79]/50 hover:bg-white'
                  }`}
                >
                  ETB {amount}
                </button>
              ))}
            </div>

            {selectedAmount && (
              <div className="bg-gray-50/80 p-6 rounded-2xl border border-gray-100 mb-6 space-y-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{isAmharic ? 'የተጠየቀ መጠን' : 'Requested Amount'}</span>
                  <span className="font-bold text-gray-900">ETB {selectedAmount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{isAmharic ? 'ታክስ' : 'Tax'} ({taxPercent}%)</span>
                  <span className="font-bold text-red-500">- ETB {taxAmount}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <span className="font-bold text-gray-900">{isAmharic ? 'የሚቀበሉት' : 'You Will Receive'}</span>
                  {/* ✅ Updated final receive amount to deep blue */}
                  <span className="font-black text-[#1E4E79] text-lg">ETB {receiveAmount}</span>
                </div>
              </div>
            )}

            {/* ✅ Updated submit button to deep blue */}
            <button 
              onClick={handleRequest}
              disabled={!selectedAmount || submitting || !isTimeAllowed || parseFloat(userData?.user?.walletBalance || '0') < selectedAmount}
              className={`w-full p-4 rounded-2xl font-bold transition-all ${
                !isTimeAllowed 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-[#1E4E79] text-white hover:bg-[#15608D] hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none'
              }`}
            >
              {submitting 
                ? (isAmharic ? 'በሂደት ላይ...' : 'Processing...') 
                : !isTimeAllowed 
                  ? (isAmharic ? 'ማውጣት ተዘግቷል' : 'Withdrawals Closed') 
                  : (isAmharic ? 'ማውጣት ጠይቅ' : 'Request Withdrawal')}
            </button>
          </div>

          {/* History */}
          <div className="bg-white/90 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              {isAmharic ? 'የእኔ ገንዘብ ማውጣቶች' : 'My Withdrawals'}
            </h2>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {myRequests.length === 0 && (
                <div className="text-center py-8 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-sm text-gray-400">{isAmharic ? 'እስካሁን ምንም የማውጣት ጥያቄ የለም።' : 'No withdrawal requests yet.'}</p>
                </div>
              )}
              {myRequests.map((req: any) => (
                <div key={req.id} className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 flex justify-between items-center hover:shadow-sm transition-all">
                  <div>
                    <p className="font-bold text-gray-900">ETB {req.amountRequested}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(req.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-3 py-1.5 rounded-md uppercase tracking-wider ${
                    req.status === 'pending' ? 'bg-orange-100 text-orange-700' : req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {req.status === 'pending' ? (isAmharic ? 'በመጠባበቅ ላይ' : 'Pending') : req.status === 'approved' ? (isAmharic ? 'ተፈቅዷል' : 'Approved') : (isAmharic ? 'ተቀባይነት አላገኘም' : 'Rejected')}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}