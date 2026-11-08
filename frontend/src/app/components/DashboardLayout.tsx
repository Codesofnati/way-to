'use client';
import { useSessionTimeout } from '@/hooks/useSessionTimeout'; 

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string>('user');
  const [userName, setUserName] = useState<string>('');
  
  // ✅ NEW: State for custom logout confirmation
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // 5-Minute Session Timer
  const { formattedTime } = useSessionTimeout(5); 

  const pathname = usePathname();
  const router = useRouter();

  const currentLocale = pathname.split('/')[1] || 'en';
  const isAmharic = currentLocale === 'am' && userRole === 'user';

  // Close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const isLoginPage = pathname.includes('/auth') || pathname.includes('/login');

    if (storedUser && !isLoginPage) {
      const user = JSON.parse(storedUser);
      setIsLoggedIn(true);
      setUserRole(user.role || 'user');
      setUserName(user.name || user.phone || 'User');
    } else {
      setIsLoggedIn(false);
    }
  }, [pathname]);

  const executeLogout = () => {
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setShowLogoutConfirm(false);
    
    if (userRole === 'admin' || userRole === 'super_admin') {
      router.push(`/${currentLocale}/admin/login`);
    } else {
      router.push(`/${currentLocale}/auth`);
    }
  };

  const toggleLanguage = () => {
    const newLocale = isAmharic ? 'en' : 'am';
    const newPath = pathname.replace(`/${currentLocale}/`, `/${newLocale}/`);
    router.push(newPath);
  };

  const isLoginPage = pathname.includes('/auth') || pathname.includes('/login');
  
  if (isLoginPage || !isLoggedIn) {
    return <>{children}</>;
  }

  // SVG Icons for the Sidebar
  const icons = {
    dashboard: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>,
    users: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>,
    money: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>,
    settings: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>,
    job: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>,
    bank: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
  };

  // Define nav items for Admins only
  let adminNavItems: { name: string, path: string, icon: React.ReactNode }[] = [];  
  if (userRole === 'super_admin') {
    adminNavItems = [
      { name: 'Overview Analytics', path: `/${currentLocale}/admin/super-dashboard`, icon: icons.dashboard },
      { name: 'App Images', path: `/${currentLocale}/admin/app-settings`, icon: icons.settings },
      { name: 'Home stories', path: `/${currentLocale}/admin/stories`, icon: icons.settings },
      { name: 'Manage Admins', path: `/${currentLocale}/admin/manage-admins`, icon: icons.users },
      { name: 'User Moderation', path: `/${currentLocale}/admin/user-moderation`, icon: icons.users },
      { name: 'Payment Approvals', path: `/${currentLocale}/admin/payments`, icon: icons.money },
      { name: 'Payment Settings', path: `/${currentLocale}/admin/settings`, icon: icons.settings },
      { name: 'Referral Analytics', path: `/${currentLocale}/admin/referrals`, icon: icons.users },
      { name: 'Personal Information', path: `/${currentLocale}/admin/profile`, icon: icons.users },
      { name: 'Security', path: `/${currentLocale}/admin/security`, icon: icons.settings },
      { name: 'Fund Analytics', path: `/${currentLocale}/admin/fund-analytics`, icon: icons.money },
      { name: 'Fund Plans', path: `/${currentLocale}/admin/funds`, icon: icons.money },
      { name: 'Job Management', path: `/${currentLocale}/admin/jobs`, icon: icons.job },
      { name: 'Contact Settings', path: `/${currentLocale}/admin/contact`, icon: icons.settings },
      { name: 'Bank Management', path: `/${currentLocale}/admin/banks`, icon: icons.bank },
      { name: 'User Bank Info', path: `/${currentLocale}/admin/user-banks`, icon: icons.bank },
      { name: 'Withdraw Settings', path: `/${currentLocale}/admin/withdraw-settings`, icon: icons.settings },
      { name: 'Withdraw Requests', path: `/${currentLocale}/admin/withdrawals`, icon: icons.money },
      { name: 'Referral Settings', path: `/${currentLocale}/admin/referral-settings`, icon: icons.settings },
    ];
  } else if (userRole === 'admin') {
    adminNavItems = [
      { name: 'Admin Dashboard', path: `/${currentLocale}/admin/dashboard`, icon: icons.dashboard },
      { name: 'Payment Approvals', path: `/${currentLocale}/admin/payments`, icon: icons.money },
      { name: 'Withdraw Requests', path: `/${currentLocale}/admin/withdrawals`, icon: icons.money },
      { name: 'My Profile', path: `/${currentLocale}/admin/my-profile`, icon: icons.users },
      { name: 'Security', path: `/${currentLocale}/admin/security`, icon: icons.settings },
      { name: 'Report User', path: `/${currentLocale}/admin/report`, icon: icons.users }, 
    ];
  }

  const isAdminRoute = pathname.includes('/admin');
  const isAdmin = (userRole === 'admin' || userRole === 'super_admin') && isAdminRoute;
  const isAdminUser = userRole === 'admin' || userRole === 'super_admin';

  return (
    <div className={`min-h-screen font-sans relative ${isAdmin ? 'flex bg-[#0B0F19]' : 'flex flex-col pb-20 bg-[#FAFAFA]'}`}>
      
      {/* ✅ MOBILE OVERLAY (Dark blur behind the mobile sidebar) */}
      {isAdmin && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ✅ ADMIN SIDEBAR (Admin colors untouched) */}
      {isAdmin && (
        <aside className={`fixed top-0 left-0 z-50 w-[280px] h-screen bg-[#0B0F19] border-r border-gray-800 flex flex-col transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
          
          {/* Logo Area */}
          <div className="flex items-center gap-3 p-6 md:p-8 pb-6">
            <div className="bg-gradient-to-tr from-[#B519FF] to-purple-400 text-white p-2 rounded-xl font-black text-lg shadow-[0_0_20px_rgba(181,25,255,0.4)]">
              W
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">
              Wely<span className="text-[#B519FF]">nto</span>
            </span>
            <span className="ml-auto text-[10px] uppercase font-bold text-purple-400 bg-purple-400/10 px-2 py-1 rounded-md border border-purple-400/20">
              Admin
            </span>
            
            {/* Mobile Close Button */}
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden ml-auto text-gray-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar pb-4">
            {adminNavItems.map((item) => {
              const isActive = pathname.includes(item.path);
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive 
                      ? 'bg-[#B519FF]/10 text-[#B519FF] border border-[#B519FF]/20 shadow-[inset_0_0_15px_rgba(181,25,255,0.1)]' 
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-[#B519FF]' : 'text-gray-500 group-hover:text-gray-300'}`}>
                    {item.icon}
                  </div>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Profile Footer */}
          <div className="p-4 border-t border-gray-800/50 m-4 bg-[#131825] rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-white font-bold border border-gray-600">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{userName}</p>
                <p className="text-[11px] text-[#B519FF] font-bold uppercase tracking-wider">
                  {userRole.replace('_', ' ')}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowLogoutConfirm(true)} 
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-400 text-sm font-bold rounded-xl hover:bg-red-500/20 transition-colors border border-red-500/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              Sign Out
            </button>
          </div>
        </aside>
      )}

      {/* ✅ MAIN CONTENT */}
      <main className={`flex-1 transition-all duration-300 ${
        isAdmin 
          ? 'md:ml-[280px] min-h-screen bg-[#0B0F19] text-white p-4 md:p-10' 
          : 'p-4 pt-20 md:px-12 lg:px-24'
      }`}>
        
        {/* Admin Top Header */}
        {isAdmin && (
          <header className="flex justify-between items-center mb-8 md:mb-10 sticky top-0 bg-[#0B0F19]/90 backdrop-blur-md z-30 py-2 -mx-2 px-2 md:mx-0 md:px-0">
            <div className="flex items-center gap-3">
              {/* Hamburger Menu (Mobile Only) */}
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="md:hidden p-2 bg-[#131825] rounded-lg border border-gray-800 text-gray-300 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
              </button>

              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">
                  {adminNavItems.find(item => pathname.includes(item.path))?.name || 'Dashboard'}
                </h1>
                <p className="hidden md:block text-gray-400 text-sm mt-1">Manage your platform and monitor activity.</p>
              </div>
            </div>

            {/* Timer for Admin */}
            <div className="flex items-center gap-4">
              {isAdminUser && (
                <div className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl border ${
                  parseInt(formattedTime.split(':')[0]) === 0 && parseInt(formattedTime.split(':')[1]) < 30 
                    ? 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse' 
                    : 'bg-[#131825] text-gray-300 border-gray-800'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <span className="text-sm font-bold font-mono">{formattedTime}</span>
                </div>
              )}
            </div>
          </header>
        )}

        {/* Page Content */}
        <div className={isAdmin ? 'max-w-7xl mx-auto' : 'max-w-6xl mx-auto'}>
          {children}
        </div>
      </main>

      {/* ✅ USER TOP BAR (Updated to Deep Blue) */}
      {!isAdmin && (
        <>
          <div className="fixed top-4 right-4 z-50 flex items-center gap-1.5 bg-white shadow-sm border border-gray-100 rounded-2xl px-4 py-2">
            <span className="text-sm font-extrabold tracking-tighter text-gray-900">
              Wely<span className="text-[#1E4E79]">nto</span>
            </span>
          </div>

          {userRole === 'user' && (
            <button 
              onClick={toggleLanguage} 
              className="fixed top-4 left-4 z-50 bg-blue-50 text-[#1E4E79] px-4 py-2 rounded-xl text-xs font-bold shadow-sm border border-blue-100"
            >
              {isAmharic ? 'English' : 'አማርኛ'}
            </button>
          )}
        </>
      )}

      {/* ✅ USER BOTTOM NAV BAR (Updated to Deep Blue) */}
      {userRole === 'user' && !isAdminRoute && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 flex justify-around items-center py-3 pb-safe z-50 rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
         <Link href={`/${currentLocale}/home`} className={`flex flex-col items-center gap-1 w-16 ${pathname.includes('/home') ? 'text-[#1E4E79]' : 'text-gray-400'}`}>
           <svg className={`w-6 h-6 ${pathname.includes('/home') ? 'fill-[#1E4E79]' : 'fill-transparent'}`} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
           <span className="text-[10px] font-bold">{isAmharic ? 'መነሻ' : 'Home'}</span>
         </Link> 
          
          <Link href={`/${currentLocale}/funds`} className={`flex flex-col items-center gap-1 w-16 ${pathname.includes('/funds') ? 'text-[#1E4E79]' : 'text-gray-400'}`}>
            <svg className={`w-6 h-6 ${pathname.includes('/funds') ? 'fill-[#1E4E79]' : 'fill-transparent'}`} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span className="text-[10px] font-bold">{isAmharic ? 'ፈንድ' : 'Fund'}</span>
          </Link>
          
          <Link href={`/${currentLocale}/deposit`} className={`flex flex-col items-center gap-1 w-16 ${pathname.includes('/deposit') ? 'text-[#1E4E79]' : 'text-gray-400'}`}>
            <svg className={`w-6 h-6 ${pathname.includes('/deposit') ? 'fill-[#1E4E79]' : 'fill-transparent'}`} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
            <span className="text-[10px] font-bold">{isAmharic ? 'ማስገቢያ' : 'Deposit'}</span>
          </Link>
          
          <Link href={`/${currentLocale}/tasks`} className={`flex flex-col items-center gap-1 w-16 ${pathname.includes('/tasks') ? 'text-[#1E4E79]' : 'text-gray-400'}`}>
            <svg className={`w-6 h-6 ${pathname.includes('/tasks') ? 'fill-[#1E4E79]' : 'fill-transparent'}`} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
            <span className="text-[10px] font-bold">{isAmharic ? 'ተግባር' : 'Task'}</span>
          </Link>
          
          <Link href={`/${currentLocale}/dashboard`} className={`flex flex-col items-center gap-1 w-16 ${pathname.includes('/dashboard') ? 'text-[#1E4E79]' : 'text-gray-400'}`}>
             <div className={`p-1 rounded-full ${pathname.includes('/dashboard') ? 'bg-blue-100' : ''}`}>
                <svg className={`w-6 h-6 ${pathname.includes('/dashboard') ? 'fill-[#1E4E79]' : 'fill-transparent'}`} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
             </div>
            <span className="text-[10px] font-bold">{isAmharic ? 'የእኔ' : 'Mine'}</span>
          </Link>
        </div>
      )}

      {/* ✅ NEW: Custom Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              {isAmharic ? 'ውጣት' : 'Sign Out'}
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              {isAmharic 
                ? 'እርግጠኛ ነዎት መውጣት ይፈልጋሉ?' 
                : 'Are you sure you want to sign out?'}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition"
              >
                {isAmharic ? 'ሰርዝ' : 'Cancel'}
              </button>
              <button 
                onClick={executeLogout}
                className="flex-1 py-3 px-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition shadow-lg"
              >
                {isAmharic ? 'አዎ ውጣ' : 'Yes, Sign Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}