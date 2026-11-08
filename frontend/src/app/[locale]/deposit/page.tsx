'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase'; 

export default function UserDeposit({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [userData, setUserData] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Deposit State
  const [depositData, setDepositData] = useState({ amount: '', methodId: '', ft: '' });
  const [file, setFile] = useState<File | null>(null); 
  const [submitting, setSubmitting] = useState(false);

  // Custom Message State
  const [message, setMessage] = useState({ text: '', type: '' });

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  const isAmharic = locale === 'am';

  useEffect(() => {
    if (!user.id) {
      router.push(`/${locale}/auth`);
      return;
    }

    const loadData = async () => {
      try {
        const [userRes, methodsRes] = await Promise.all([
          fetch(`${apiUrl}/api/user/${user.id}/dashboard`),
          fetch(`${apiUrl}/api/payment-methods`),
        ]);

        if (!userRes.ok) throw new Error(`Dashboard failed: ${userRes.status}`);
        if (!methodsRes.ok) throw new Error(`Methods failed: ${methodsRes.status}`);

        const userData = await userRes.json();
        const methodsData = await methodsRes.json();

        if (userData.success) setUserData(userData);
        if (methodsData.success && methodsData.methods.length > 0) {
          setPaymentMethods(methodsData.methods);
        }
      } catch (err: any) {
        console.error('❌ Fetch Error:', err.message);
        setMessage({ text: 'Connection error: ' + err.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router, locale, user.id, apiUrl]);

  // Strict Input Handlers
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/\D/g, '');
    if (numericValue.length <= 5) { // Max 5 digits (99,999)
      setDepositData({...depositData, amount: numericValue});
      if (message.text) setMessage({ text: '', type: '' }); 
    }
  };

  const handleFtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const alphanumericValue = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
    if (alphanumericValue.length <= 15) { // Max 15 characters
      setDepositData({...depositData, ft: alphanumericValue});
      if (message.text) setMessage({ text: '', type: '' }); 
    }
  };

  const uploadImage = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('screenshots')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('screenshots')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (err: any) {
      setMessage({ text: 'Image upload failed: ' + err.message, type: 'error' });
      return null;
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    // ✅ UPDATED CLIENT-SIDE VALIDATION
    if (!depositData.methodId) {
      return setMessage({ text: isAmharic ? 'እባክዎ የክፍያ ዘዴ ይምረጡ' : 'Please select a payment method.', type: 'error' });
    }
    
    const amountNum = parseInt(depositData.amount);
    if (!depositData.amount || amountNum <= 99) {
      return setMessage({ 
        text: isAmharic ? 'የማስገቢያ መጠን ከ 99 ብር በላይ መሆን አለበት።' : 'The deposit amount must be more than 99 ETB.', 
        type: 'error' 
      });
    }

    if (!depositData.ft || depositData.ft.length < 5) {
      return setMessage({ 
        text: isAmharic ? 'የግብይት ቁጥር (FT) ቢያንስ 5 ፊደሎች/ቁጥሮች መሆን አለበት።' : 'The FT Number must be at least 5 characters long.', 
        type: 'error' 
      });
    }

    if (!file) {
      return setMessage({ text: isAmharic ? 'እባክዎ የክፍያ ማረጋገጫ ስክሪንሾት ይምረጡ' : 'Please upload a screenshot.', type: 'error' });
    }
    
    setSubmitting(true);
    
    const screenshotUrl = await uploadImage(file);
    if (!screenshotUrl) {
      setSubmitting(false);
      return;
    }

    const selectedMethod = paymentMethods.find(m => m.id === depositData.methodId);
    
    try {
      const res = await fetch(`${apiUrl}/api/user/${user.id}/payment`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: depositData.amount, 
          paymentMethod: selectedMethod?.name || 'Unknown', 
          ftNumber: depositData.ft, 
          screenshotUrl: screenshotUrl, 
          assignedTo: selectedMethod?.accountName 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setMessage({ text: isAmharic ? 'የገንዘብ ማስገቢያ ጥያቄው በተሳካ ሁኔታ ተልኳል! የአድሚን ማረጋገጫ በመጠበቅ ላይ።' : 'Deposit request submitted successfully! Waiting for admin approval.', type: 'success' });
      
      setDepositData({ amount: '', methodId: '', ft: '' });
      setFile(null); 
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
  
  if (!userData) return <div className="p-8 text-center text-red-600">{isAmharic ? 'ውሂብ መጫን አልተቻለም።' : 'Failed to load data.'}</div>;

  const selectedMethod = paymentMethods.find(m => m.id === depositData.methodId);

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-24 relative overflow-hidden">
      
      <div className="absolute top-0 right-[-20%] w-64 h-64 bg-[#1E4E79]/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-[-20%] w-64 h-64 bg-[#15608D]/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="relative z-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
          {isAmharic ? 'ገንዘብ ማስገባት' : 'Deposit Money'}
        </h1>
        <p className="text-gray-500 font-medium">
          {isAmharic ? 'ወደ ኪስ ቦርሳዎ ገንዘብ ያክሉ።' : 'Add money to your wallet securely.'}
        </p>
      </div>

      <div className="bg-gradient-to-br from-[#1E4E79] to-[#15608D] text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden group z-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-500"></div>
        
        <div className="relative z-10">
          <p className="text-xs text-blue-100 uppercase font-bold tracking-wider mb-1">
            {isAmharic ? 'የአሁኑ ቀሪ ሂሳብ' : 'Current Balance'}
          </p>
          <h2 className="text-5xl font-black tracking-tight">ETB {userData.user.walletBalance}</h2>
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur-md p-8 rounded-[2rem] shadow-sm border border-gray-100 relative z-10">
        
        {/* Custom Message Display */}
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

        <form onSubmit={handleDeposit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
              {isAmharic ? 'የክፍያ ዘዴ' : 'Payment Method'}
            </label>
            <select 
              value={depositData.methodId} 
              onChange={e => {
                setDepositData({...depositData, methodId: e.target.value});
                if (message.text) setMessage({ text: '', type: '' });
              }} 
              className="w-full p-4 bg-white border border-gray-300 rounded-2xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1E4E79] transition-all" 
              required
            >
              <option value="" disabled className="text-gray-400">{isAmharic ? 'የክፍያ ዘዴ ይምረጡ...' : 'Select a payment method...'}</option>
              {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          {selectedMethod && (
            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-xs text-[#1E4E79] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {isAmharic ? 'ክፍያ ይላኩለት:' : 'Send Payment To:'}
              </p>
              <div className="flex justify-between items-center border-b border-blue-200/50 pb-2">
                 <p className="text-sm font-medium text-gray-600">{isAmharic ? 'የሂሳብ ስም' : 'Account Name'}</p>
                 <p className="text-sm font-bold text-gray-900">{selectedMethod.accountName}</p>
              </div>
              <div className="flex justify-between items-center pt-1">
                 <p className="text-sm font-medium text-gray-600">{isAmharic ? 'የሂሳብ ቁጥር' : 'Account Number'}</p>
                 <p className="text-lg font-mono font-bold text-[#1E4E79] tracking-wide">{selectedMethod.accountNumber}</p>
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
              {isAmharic ? 'መጠን (ETB)' : 'Amount (ETB)'}
            </label>
            <input 
              type="text" 
              inputMode="numeric"
              placeholder={isAmharic ? 'ለምሳሌ 100' : 'e.g. 100'} 
              value={depositData.amount} 
              onChange={handleAmountChange} 
              maxLength={5} 
              className="w-full p-4 bg-white border border-gray-300 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E4E79] transition-all" 
              required 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
              {isAmharic ? 'የግብይት ቁጥር (FT)' : 'FT Number (Transaction ID)'}
            </label>
            <input 
              type="text" 
              placeholder={isAmharic ? 'ለምሳሌ FT12345' : 'e.g. FT12345'} 
              value={depositData.ft} 
              onChange={handleFtChange} 
              maxLength={15} 
              className="w-full p-4 bg-white border border-gray-300 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E4E79] transition-all" 
              required 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
              {isAmharic ? 'የክፍያ ማረጋገጫ (ስክሪንሾት)' : 'Payment Screenshot'}
            </label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={e => {
                setFile(e.target.files?.[0] || null);
                if (message.text) setMessage({ text: '', type: '' });
              }} 
              className="w-full p-3 bg-white border border-gray-300 rounded-2xl text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#1E4E79]/10 file:text-[#1E4E79] hover:file:bg-[#1E4E79]/20 focus:outline-none focus:ring-2 focus:ring-[#1E4E79]" 
              required 
            />
          </div>

          <button type="submit" disabled={submitting || !depositData.methodId || !file} className="w-full bg-gradient-to-br from-[#1E4E79] to-[#15608D] text-white p-4 rounded-2xl font-bold hover:opacity-95 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none mt-4">
            {submitting ? (isAmharic ? 'በመላክ ላይ...' : 'Uploading & Submitting...') : (isAmharic ? 'ማስገቢያ አስገባ' : 'Submit Deposit')}
          </button>
        </form>
      </div>
    </div>
  );
}