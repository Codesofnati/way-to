'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UserDashboardOverview({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [userData, setUserData] = useState<any>(null);
  const [funds, setFunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
  
  const isAmharic = locale === 'am';

  useEffect(() => {
    if (!user.id) {
      router.push(`/${locale}/auth`);
      return;
    }
    if (user.role === 'admin' || user.role === 'super_admin') {
      router.push(`/${locale}/admin/dashboard`);
      return;
    }

    Promise.all([
      fetch(`${apiUrl}/api/user/${user.id}/dashboard`).then(res => res.json()),
      fetch(`${apiUrl}/api/user/${user.id}/my-funds`).then(res => res.json())
    ]).then(([userRes, fundsRes]) => {
      if (userRes.success) setUserData(userRes);
      if (fundsRes.success) setFunds(fundsRes.funds);
    }).finally(() => setLoading(false));
  }, [router, locale, user.id, user.role, apiUrl]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push(`/${locale}/auth`);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E4E79]"></div>
    </div>
  );
  if (!userData) return <div className="p-8 text-center text-red-600">{isAmharic ? 'ውሂብ መጫን አልተቻለም።' : 'Failed to load data.'}</div>;

  const activeFunds = funds.filter(f => new Date() < new Date(f.endDate));
  const fundBalance = activeFunds.reduce((sum, f) => sum + parseFloat(f.amountInvested), 0);
  const totalFundProfit = activeFunds.reduce((sum, f) => sum + (parseFloat(f.totalReturn) - parseFloat(f.amountInvested)), 0);
  
  // ✅ FIX: Parse the values to ensure they are numbers before calling .toFixed()
  const totalJobProfit = parseFloat(userData.user.totalJobProfit) || 0;
  const dailyJobProfit = parseFloat(userData.user.dailyJobProfit) || 0; 
  const jobPrice = userData.user.jobPrice || '0'; 

  // ✅ Reusable Menu Item Component for larger sizing
  const MenuItem = ({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) => (
    <Link href={href} className="flex flex-col items-center gap-3 group">
      <div className="w-20 h-20 bg-white rounded-[1.5rem] shadow-sm border border-gray-100 flex items-center justify-center group-hover:-translate-y-1.5 group-hover:shadow-xl group-hover:border-[#1E4E79]/50 transition-all duration-300">
        <div className="w-9 h-9 text-gray-700 group-hover:text-[#1E4E79] transition-colors">
          {icon}
        </div>
      </div>
      <span className="text-xs font-bold text-gray-600 text-center uppercase tracking-wide group-hover:text-[#1E4E79] transition-colors">{label}</span>
    </Link>
  );

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-24 relative overflow-hidden pt-4">
      
      {/* Decorative Background Blur - ✅ Updated to deep blue */}
      <div className="absolute top-0 right-[-20%] w-64 h-64 bg-[#1E4E79]/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute top-[40%] left-[-20%] w-64 h-64 bg-[#15608D]/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      {/* ✅ Logout Button (Top Right) */}
      <div className="absolute top-4 right-4 z-20">
        <button 
          onClick={handleLogout}
          className="bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-sm border border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
          title={isAmharic ? 'ውጣ' : 'Logout'}
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
        </button>
      </div>

      {/* Profile & Job Balance Card */}
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden group hover:shadow-lg transition-all duration-300 z-10 mt-2">
        {/* ✅ Updated to deep blue */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#1E4E79]/5 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-500"></div>
        
        <div className="flex items-center gap-5 relative z-10">
          {/* ✅ Changed "W" to Person Icon & updated gradient */}
          <div className="w-16 h-16 bg-gradient-to-tr from-[#1E4E79] to-[#15608D] rounded-[1.25rem] flex items-center justify-center shadow-lg border-2 border-white transform transition hover:scale-105 duration-300">
            <svg className="w-8 h-8 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
          <div>
            <h3 className="font-extrabold text-gray-900 text-2xl leading-tight">{userData.user.name || 'User'}</h3>
            <p className="text-sm text-gray-500 font-medium mt-1 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
              {userData.user.phone}
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right relative z-10 w-full sm:w-auto bg-gray-50/50 sm:bg-transparent p-3 sm:p-0 rounded-2xl sm:rounded-none">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{userData.user.jobLevel !== 'No Job' ? userData.user.jobLevel : 'No Job'}</p>
          <div className="flex items-center sm:justify-end gap-2">
             <span className="text-xs text-gray-500 font-bold uppercase">{isAmharic ? 'ቀሪ ሂሳብ' : 'Balance'}</span>
             {/* ✅ Updated to deep blue */}
             <span className="text-2xl font-black text-[#1E4E79]">{jobPrice}</span> 
          </div>
        </div>
      </div>

      {/* Main Balance - ✅ Updated to deep blue gradient */}
      <div className="bg-gradient-to-br from-[#1E4E79] to-[#15608D] text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-300 z-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-500"></div>
        <p className="text-xs text-blue-100 uppercase font-bold tracking-wider mb-1">{isAmharic ? 'ዋና የኪስ ቦርሳ ቀሪ ሂሳብ' : 'Main Account Balance'}</p>
        <h2 className="text-4xl font-black tracking-tight">ETB {userData.user.walletBalance}</h2>
      </div>

      {/* Balances Overview (Grid) */}
      <div className="grid grid-cols-2 gap-3 relative z-10">
        
        {/* Fund Balance */}
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl shadow-sm border border-gray-100 hover:border-[#1E4E79]/30 hover:shadow-md transition-all duration-300 group">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <svg className="w-4 h-4 text-[#1E4E79]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">{isAmharic ? 'የፈንድ ቀሪ ሂሳብ' : 'Fund Balance'}</p>
          <h2 className="text-xl font-black text-gray-900">ETB {fundBalance.toFixed(2)}</h2>
        </div>

        {/* Job Daily Profit - ✅ Updated to Blue theme */}
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl shadow-sm border border-gray-100 hover:border-[#1E4E79]/30 hover:shadow-md transition-all duration-300 group">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <svg className="w-4 h-4 text-[#1E4E79]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
          </div>
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">{isAmharic ? 'የቀን የስራ ትርፍ' : 'Daily Job Profit'}</p>
          <h2 className="text-xl font-black text-[#1E4E79]">ETB {dailyJobProfit.toFixed(2)}</h2>
        </div>

        {/* Total Job Profit - ✅ Updated to Blue theme */}
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl shadow-sm border border-gray-100 hover:border-[#1E4E79]/30 hover:shadow-md transition-all duration-300 group">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
             <svg className="w-4 h-4 text-[#1E4E79]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
          </div>
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">{isAmharic ? 'የስራ ጠቅላላ ትርፍ' : 'Total Job Profit'}</p>
          <h2 className="text-xl font-black text-[#1E4E79]">ETB {totalJobProfit.toFixed(2)}</h2>
        </div>

        {/* Total Fund Profit - ✅ Updated to Blue theme */}
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl shadow-sm border border-gray-100 hover:border-[#1E4E79]/30 hover:shadow-md transition-all duration-300 group">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
               <svg className="w-4 h-4 text-[#1E4E79]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">{isAmharic ? 'የፈንድ ጠቅላላ ትርፍ' : 'Total Fund Profit'}</p>
          <h2 className="text-xl font-black text-[#1E4E79]">ETB {totalFundProfit.toFixed(2)}</h2>
        </div>

      </div>

      {/* Enlarged Menu Grid (3 Columns) */}
      <div className="grid grid-cols-3 gap-y-8 gap-x-2 px-1 relative z-10 mt-6">
        <MenuItem 
          href={`/${locale}/profile`} 
          label={isAmharic ? 'መረጃ' : 'Profile'}
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>}
        />
        <MenuItem 
          href={`/${locale}/jobs`} 
          label={isAmharic ? 'ስራ' : 'Job'}
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>}
        />
        <MenuItem 
          href={`/${locale}/referrals`} 
          label={isAmharic ? 'ጋብዝ' : 'Invite'}
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>}
        />
        <MenuItem 
          href={`/${locale}/bank-info`} 
          label={isAmharic ? 'ባንክ' : 'Bank'}
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>}
        />
        <MenuItem 
          href={`/${locale}/withdraw`} 
          label={isAmharic ? 'አውጣ' : 'Withdraw'}
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
        />
        <MenuItem 
          href={`/${locale}/contact`} 
          label={isAmharic ? 'እውቂያ' : 'Contact'}
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>}
        />
        <MenuItem 
          href={`/${locale}/notifications`} 
          label={isAmharic ? 'ማሳወቂያ' : 'Alerts'}
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>}
        />
        <MenuItem 
          href={`/${locale}/history`} 
          label={isAmharic ? 'ታሪክ' : 'History'}
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
        />
        <MenuItem 
          href={`/${locale}/security`} 
          label={isAmharic ? 'ደህንነት' : 'Security'}
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>}
        />
      </div>
    </div>
  );
}