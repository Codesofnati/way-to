'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function UserFunds({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [plans, setPlans] = useState<any[]>([]);
  const [myFunds, setMyFunds] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Tab State
  const [activeTab, setActiveTab] = useState<'available' | 'my_funds' | 'history'>('available');

  // Pagination State for Available Plans
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [investAmount, setInvestAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  const isAmharic = locale === 'am';

  useEffect(() => {
    if (!user.id) return router.push(`/${locale}/auth`);
    fetchData();
  }, [router, locale, user.id, apiUrl]);

  const fetchData = async () => {
    try {
      const [plansRes, fundsRes, userRes] = await Promise.all([
        fetch(`${apiUrl}/api/fund-plans`).then(res => res.json()),
        fetch(`${apiUrl}/api/user/${user.id}/my-funds`).then(res => res.json()),
        fetch(`${apiUrl}/api/user/${user.id}/dashboard`).then(res => res.json())
      ]);
      if (plansRes.success) setPlans(plansRes.plans);
      if (fundsRes.success) setMyFunds(fundsRes.funds);
      if (userRes.success) setUserData(userRes);
    } finally { setLoading(false); }
  };

  const getTimeRemaining = (targetDate: Date) => {
    const now = new Date();
    const diffMs = targetDate.getTime() - now.getTime();
    
    if (diffMs <= 0) return isAmharic ? 'ተጀምሯል' : 'Started';

    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return isAmharic ? `${diffDays} ቀናት ቀርተዋል` : `${diffDays} Days left`;
    if (diffHours > 0) return isAmharic ? `${diffHours} ሰዓታት ቀርተዋል` : `${diffHours} Hours left`;
    return isAmharic ? `${diffMins} ደቂቃዎች ቀርተዋል` : `${diffMins} Mins left`;
  };

  const handleInvest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    if (parseFloat(investAmount) < parseFloat(selectedPlan.minAmount)) {
      alert(isAmharic ? `ዝቅተኛው ኢንቨስትመንት ETB ${selectedPlan.minAmount} ነው` : `Minimum investment is ETB ${selectedPlan.minAmount}`);
      setSubmitting(false); return;
    }
    if (parseFloat(investAmount) > parseFloat(selectedPlan.maxAmount)) {
      alert(isAmharic ? `ከፍተኛው ኢንቨስትመንት ETB ${selectedPlan.maxAmount} ነው` : `Maximum investment is ETB ${selectedPlan.maxAmount}`);
      setSubmitting(false); return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/user/${user.id}/join-fund`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan.id, amount: investAmount })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert(isAmharic ? 'ኢንቨስትመንት ተሳክቷል! ፈንዶች ተቆልፈዋል።' : 'Investment successful! Funds locked.');
      setSelectedPlan(null);
      setInvestAmount('');
      fetchData();
      setActiveTab('my_funds'); // Switch to My Funds tab after investing
    } catch (err: any) { alert(err.message); } 
    finally { setSubmitting(false); }
  };

  // Filter Funds
  const activeMyFunds = myFunds.filter(f => new Date() < new Date(f.endDate));
  const historyFunds = myFunds.filter(f => new Date() >= new Date(f.endDate));

  // Calculate Fund Analytics
  const totalFundBalance = activeMyFunds.reduce((sum, f) => sum + parseFloat(f.amountInvested), 0);
  const totalFundDailyProfit = activeMyFunds.reduce((sum, f) => sum + parseFloat(f.dailyInterestBirr || '0'), 0);
  const totalFundProfit = activeMyFunds.reduce((sum, f) => sum + (parseFloat(f.totalReturn) - parseFloat(f.amountInvested)), 0);

  // Pagination Math
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPlans = plans.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(plans.length / itemsPerPage);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B519FF]"></div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-24 relative overflow-hidden">
      
      {/* Decorative Background Blur */}
      <div className="absolute top-0 right-[-20%] w-64 h-64 bg-[#B519FF]/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-[-20%] w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
            {isAmharic ? 'የኢንቨስትመንት ፈንዶች' : 'Investment Funds'}
          </h1>
          <p className="text-gray-500 font-medium">
            {isAmharic ? 'ገንዘብዎን ያሳድጉ።' : 'Grow your money with our premium plans.'}
          </p>
        </div>

       
      </div>

      {/* Tabs */}
      <div className="bg-white/60 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-gray-100 inline-flex w-full md:w-auto relative z-10">
        <button onClick={() => setActiveTab('available')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'available' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>
          {isAmharic ? 'ያሉ እቅዶች' : 'Available Plans'}
        </button>
        <button onClick={() => setActiveTab('my_funds')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'my_funds' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>
          {isAmharic ? 'የእኔ ኢንቨስትመንቶች' : 'My Funds'}
        </button>
        <button onClick={() => setActiveTab('history')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>
          {isAmharic ? 'ታሪክ' : 'History'}
        </button>
      </div>

      {/* ✅ TAB CONTENT: Available Plans */}
      {activeTab === 'available' && (
        <div className="space-y-4 relative z-10 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentPlans.map((plan: any) => {
              const totalParticipants = plan.currentParticipants + plan.fakeJoinedUsers;
              const percent = (totalParticipants / plan.maxParticipants) * 100;
              const isFull = totalParticipants >= plan.maxParticipants;
              const isClosed = plan.isClosed;
              const start = new Date(plan.startDate);
              const timeRemainingStr = getTimeRemaining(start);

              let barColor = 'bg-emerald-500';
              let textColor = 'text-emerald-600';
              if (percent > 70) { barColor = 'bg-red-500'; textColor = 'text-red-600'; }
              else if (percent >= 40) { barColor = 'bg-yellow-400'; textColor = 'text-yellow-600'; }

              return (
                <div key={plan.id} className="bg-white/95 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:border-[#B519FF]/30 hover:shadow-md transition-all duration-300 group flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#B519FF] transition-colors">{plan.name}</h3>
                        <p className="text-sm text-gray-500">{plan.description}</p>
                      </div>
                      <div className="bg-purple-50 text-[#B519FF] px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                        {plan.interestRate}% {isAmharic ? '/ ቀን' : '/ day'}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm mb-4 bg-gray-50 p-3 rounded-xl">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">{isAmharic ? 'ቆይታ' : 'Duration'}</p>
                        <p className="font-bold text-gray-900">{plan.durationDays} {isAmharic ? 'ቀናት' : 'Days'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">{isAmharic ? 'ገደቦች (ETB)' : 'Limits (ETB)'}</p>
                        <p className="font-bold text-gray-900">{plan.minAmount} - {plan.maxAmount}</p>
                      </div>
                    </div>

                    <div className="flex justify-between text-xs font-bold mb-4">
                      <div>
                        <p className="text-gray-500 uppercase">{isAmharic ? 'የመጀመሪያ ቀን' : 'Start Date'}</p>
                        <p className={isClosed ? 'text-red-500' : 'text-emerald-600'}>{start.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-500 uppercase">{isAmharic ? 'የቀረው ጊዜ' : 'Time Remaining'}</p>
                        <p className={isClosed ? 'text-red-500' : 'text-orange-500'}>{timeRemainingStr}</p>
                      </div>
                    </div>

                    <div className="mb-6 space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-500">{isAmharic ? 'የተሞሉ ቦታዎች' : 'Spots Filled'}</span>
                        <span className={textColor}>{totalParticipants} / {plan.maxParticipants}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${Math.min(percent, 100)}%` }}></div>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedPlan(plan)}
                    disabled={isFull || isClosed}
                    className={`w-full py-3 rounded-xl font-bold transition-all ${
                      (isFull || isClosed) 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-black text-white hover:bg-[#B519FF] hover:shadow-lg hover:-translate-y-0.5'
                    }`}
                  >
                    {isClosed ? (isAmharic ? 'ፈንዱ ተዘግቷል (ተጀምሯል)' : 'Fund Closed (Started)') : isFull ? (isAmharic ? 'ፈንዱ ሙሉ ነው' : 'Fund Full') : (isAmharic ? 'አሁን ኢንቨስት ያድርጉ' : 'Invest Now')}
                  </button>
                </div>
              );
            })}
          </div>
          {plans.length === 0 && <p className="text-center text-gray-500 py-8">{isAmharic ? 'ምንም እቅድ የለም።' : 'No plans available.'}</p>}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-gray-50">{isAmharic ? 'ቀዳሚ' : 'Prev'}</button>
              <span className="text-sm font-bold text-gray-500">{isAmharic ? 'ገጽ' : 'Page'} {currentPage} / {totalPages}</span>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-gray-50">{isAmharic ? 'ቀጣይ' : 'Next'}</button>
            </div>
          )}
        </div>
      )}

      {/* ✅ TAB CONTENT: My Funds with Analytics */}
      {activeTab === 'my_funds' && (
        <div className="space-y-6 relative z-10 animate-in fade-in duration-300">
          
          {/* Fund Analytics Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl shadow-sm border border-gray-100 col-span-2 md:col-span-1">
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">{isAmharic ? 'የፈንድ ቀሪ ሂሳብ' : 'Fund Balance'}</p>
              <h2 className="text-xl font-black text-[#B519FF]">ETB {totalFundBalance.toFixed(2)}</h2>
            </div>
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl shadow-sm border border-gray-100">
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">{isAmharic ? 'የፈንድ የቀን ትርፍ' : 'Fund Daily Profit'}</p>
              <h2 className="text-xl font-black text-emerald-600">ETB {totalFundDailyProfit.toFixed(2)}</h2>
            </div>
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl shadow-sm border border-gray-100">
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">{isAmharic ? 'የፈንድ ጠቅላላ ትርፍ' : 'Fund Total Profit'}</p>
              <h2 className="text-xl font-black text-emerald-600">ETB {totalFundProfit.toFixed(2)}</h2>
            </div>
          </div>

          {/* Active Funds List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeMyFunds.length === 0 && <p className="text-gray-500 bg-white/50 p-6 rounded-2xl border border-dashed border-gray-200 text-center col-span-2">{isAmharic ? 'ምንም ንቁ ኢንቨስትመንት የለዎትም።' : 'You have no active investments.'}</p>}
            
            {activeMyFunds.map((fund: any) => {
              const end = new Date(fund.endDate);
              const timeRemainingStr = getTimeRemaining(end);

              return (
                <div key={fund.id} className="p-6 rounded-[2rem] shadow-sm border bg-white/95 backdrop-blur-md border-gray-100 relative overflow-hidden">
                  <div className="flex justify-between items-center mb-4 relative z-10">
                    <h3 className="font-bold text-gray-900">{fund.planName}</h3>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-100 text-orange-700">
                      {timeRemainingStr}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mt-4 relative z-10">
                    <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                      <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">{isAmharic ? 'የተከፈለ' : 'Invested'}</p>
                      <p className="font-black text-gray-900">ETB {fund.amountInvested}</p>
                    </div>
                    <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100/50">
                      <p className="text-[#B519FF] text-[10px] font-bold uppercase tracking-wider mb-1">{isAmharic ? 'የቀን ወለድ' : 'Daily Interest'}</p>
                      <p className="font-black text-[#B519FF]">ETB {fund.dailyInterestBirr || '0.00'}</p>
                    </div>
                    <div className="col-span-2 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50 flex justify-between items-center">
                      <p className="text-emerald-600 text-xs font-bold uppercase tracking-wider">{isAmharic ? 'ጠቅላላ የሚጠበቅ ተመላሽ' : 'Total Return'}</p>
                      <p className="font-black text-emerald-600 text-xl">ETB {fund.totalReturn}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ✅ TAB CONTENT: History */}
      {activeTab === 'history' && (
        <div className="space-y-4 relative z-10 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {historyFunds.length === 0 && <p className="text-gray-500 bg-white/50 p-6 rounded-2xl border border-dashed border-gray-200 text-center col-span-2">{isAmharic ? 'ምንም የተጠናቀቀ ኢንቨስትመንት የለም።' : 'No completed investments yet.'}</p>}
            
            {historyFunds.map((fund: any) => (
              <div key={fund.id} className="p-6 rounded-[2rem] shadow-sm border bg-emerald-50/40 border-emerald-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
                
                <div className="flex justify-between items-center mb-4 relative z-10">
                  <h3 className="font-bold text-gray-900">{fund.planName}</h3>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-200 text-emerald-800">
                    {isAmharic ? 'ተጠናቅቋል' : 'Completed'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm mt-4 relative z-10">
                  <div className="bg-white/60 p-3 rounded-xl border border-emerald-100/50">
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">{isAmharic ? 'የተከፈለ' : 'Invested'}</p>
                    <p className="font-black text-gray-900">ETB {fund.amountInvested}</p>
                  </div>
                  <div className="bg-white/60 p-3 rounded-xl border border-emerald-100/50">
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">{isAmharic ? 'ትርፍ' : 'Profit'}</p>
                    <p className="font-black text-emerald-600">ETB {(parseFloat(fund.totalReturn) - parseFloat(fund.amountInvested)).toFixed(2)}</p>
                  </div>
                  <div className="col-span-2 bg-white/80 p-4 rounded-xl border border-emerald-100 flex justify-between items-center">
                    <p className="text-gray-900 text-xs font-bold uppercase tracking-wider">{isAmharic ? 'ጠቅላላ የተከፈለ' : 'Total Return'}</p>
                    <p className="font-black text-gray-900 text-xl">ETB {fund.totalReturn}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invest Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {isAmharic ? `በ ${selectedPlan.name} ላይ ኢንቨስት ያድርጉ` : `Invest in ${selectedPlan.name}`}
              </h2>
              <button onClick={() => setSelectedPlan(null)} className="text-gray-400 hover:text-gray-900 font-bold text-xl bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm">&times;</button>
            </div>
            <form onSubmit={handleInvest} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">{isAmharic ? 'የሚያስቀምጡት መጠን (ETB)' : 'Amount to Invest (ETB)'}</label>
                <input 
                  type="number" 
                  placeholder={isAmharic ? `ገደቦች: ${selectedPlan.minAmount} - ${selectedPlan.maxAmount}` : `Limits: ${selectedPlan.minAmount} - ${selectedPlan.maxAmount}`} 
                  value={investAmount} 
                  onChange={e => setInvestAmount(e.target.value)} 
                  className="w-full p-4 bg-white border border-gray-300 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B519FF] transition-all" 
                  required 
                />
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100/50 p-5 rounded-2xl border border-purple-100">
                <p className="text-xs text-[#B519FF] font-bold uppercase mb-1">{isAmharic ? 'የሚጠበቅ ተመላሽ' : 'Projected Return'}</p>
                <p className="text-2xl font-black text-gray-900">
                  ETB {investAmount 
                    ? (parseFloat(investAmount) + (parseFloat(investAmount) * (selectedPlan.interestRate / 100) * selectedPlan.durationDays)).toFixed(2) 
                    : '0.00'}
                </p>
                <p className="text-xs text-gray-600 mt-1 font-medium">{isAmharic ? `ከ ${selectedPlan.durationDays} ቀናት በኋላ` : `After ${selectedPlan.durationDays} days`}</p>
              </div>
              <button type="submit" disabled={submitting} className="w-full bg-[#B519FF] text-white p-4 rounded-2xl font-bold hover:bg-purple-600 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 mt-2">
                {submitting ? (isAmharic ? 'በሂደት ላይ...' : 'Processing...') : (isAmharic ? 'ኢንቨስትመንትን አረጋግጥ' : 'Confirm Investment')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}