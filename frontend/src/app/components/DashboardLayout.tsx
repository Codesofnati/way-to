'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string>('user');
  const [userName, setUserName] = useState<string>('');
  
  const pathname = usePathname();
  const router = useRouter();

  const currentLocale = pathname.split('/')[1] || 'en';
  const isAmharic = currentLocale === 'am' && userRole === 'user';

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

  const handleLogout = () => {
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    router.push(`/${currentLocale}/auth`);
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

  // ✅ Define nav items for Admins only
let adminNavItems: { name: string, path: string }[] = [];  if (userRole === 'super_admin') {
    adminNavItems = [
      { name: 'Overview Analytics', path: `/${currentLocale}/admin/super-dashboard` },
      { name: 'Manage Admins', path: `/${currentLocale}/admin/manage-admins` },
      { name: 'User Moderation', path: `/${currentLocale}/admin/user-moderation` },
      { name: 'Payment Approvals', path: `/${currentLocale}/admin/payments` },
      { name: 'Payment Settings', path: `/${currentLocale}/admin/settings` },
      { name: 'Referral Analytics', path: `/${currentLocale}/admin/referrals` },
      { name: 'Personal Information', path: `/${currentLocale}/admin/profile` },
      { name: 'Security', path: `/${currentLocale}/admin/security` },
      { name: 'Fund Analytics', path: `/${currentLocale}/admin/fund-analytics` },
      { name: 'Fund Plans', path: `/${currentLocale}/admin/funds` },
      { name: 'Job Management', path: `/${currentLocale}/admin/jobs` },
      { name: 'Contact Settings', path: `/${currentLocale}/admin/contact` },
      { name: 'Bank Management', path: `/${currentLocale}/admin/banks` },
      { name: 'User Bank Info', path: `/${currentLocale}/admin/user-banks` },
      { name: 'Withdraw Settings', path: `/${currentLocale}/admin/withdraw-settings` },
      { name: 'Withdraw Requests', path: `/${currentLocale}/admin/withdrawals` },
      { name: 'Referral Settings', path: `/${currentLocale}/admin/referral-settings` },
    ];
  } else if (userRole === 'admin') {
    adminNavItems = [
      { name: 'Admin Dashboard', path: `/${currentLocale}/admin/dashboard` },
      { name: 'Payment Approvals', path: `/${currentLocale}/admin/payments` },
      { name: 'Withdraw Requests', path: `/${currentLocale}/admin/withdrawals` },
      { name: 'My Profile', path: `/${currentLocale}/admin/my-profile` },
      { name: 'Security', path: `/${currentLocale}/admin/security` },
      { name: 'Report User', path: `/${currentLocale}/admin/report` }, 
    ];
  }

  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

  return (
    <div className={`min-h-screen bg-[#FAFAFA] font-sans relative ${isAdmin ? 'flex flex-col md:flex-row' : 'flex flex-col pb-20'}`}>
      
      {/* ✅ Wayto Branding (Top Right) */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-1.5 bg-white shadow-sm border border-gray-100 rounded-2xl px-4 py-2">
        <span className="text-sm font-extrabold tracking-tighter text-gray-900">
          Way<span className="text-[#B519FF]">to</span>
        </span>
      </div>

      {/* Floating Language Switcher (Mobile Only, Users Only) */}
      {userRole === 'user' && (
        <button 
          onClick={toggleLanguage} 
          className="fixed top-4 left-4 z-50 bg-purple-50 text-[#B519FF] px-4 py-2 rounded-xl text-xs font-bold shadow-sm border border-purple-100"
        >
          {isAmharic ? 'English' : 'አማርኛ'}
        </button>
      )}

      {/* ✅ ADMIN ONLY: Desktop Sidebar */}
      {isAdmin && (
        <aside className={`hidden md:flex fixed md:sticky top-0 left-0 z-40 w-64 h-screen bg-white border-r border-gray-100 flex-col transition-transform duration-300 ease-in-out`}>
          <div className="flex items-center gap-2 p-6">
            <div className="bg-[#B519FF] text-white p-1.5 rounded-lg font-bold text-sm shadow-[0_0_15px_rgba(181,25,255,0.4)]">W</div>
            <span className="font-bold text-2xl tracking-tight">wayto</span>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {adminNavItems.map((item) => {
              const isActive = pathname.includes(item.path);
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`block px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive ? 'bg-black text-white shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-100 space-y-2">
            <div className="px-4 py-3 bg-gray-50 rounded-xl">
              <p className="text-sm font-bold text-gray-900 truncate">{userName}</p>
              <p className="text-xs text-[#B519FF] font-bold uppercase tracking-wider mt-1">{userRole.replace('_', ' ')}</p>
            </div>
            <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 font-bold hover:bg-red-50 rounded-xl transition-colors">
              Log out
            </button>
          </div>
        </aside>
      )}

      {/* ✅ Main Content - Padding adjusts based on role */}
      <main className={`flex-1 overflow-y-auto w-full ${isAdmin ? 'p-4 md:p-8 lg:p-10 pt-20 md:pt-0' : 'p-4 pt-20 md:px-12 lg:px-24'}`}>
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* ✅ USER ONLY: Bottom Navigation Bar */}
      {userRole === 'user' && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 flex justify-around items-center py-3 pb-safe z-50 rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
          <Link href={`/${currentLocale}/dashboard`} className={`flex flex-col items-center gap-1 w-16 ${pathname === `/${currentLocale}/dashboard` ? 'text-black' : 'text-gray-400'}`}>
            <svg className={`w-6 h-6 ${pathname === `/${currentLocale}/dashboard` ? 'fill-black' : 'fill-transparent'}`} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            <span className="text-[10px] font-bold">{isAmharic ? 'መነሻ' : 'Home'}</span>
          </Link>
          
          <Link href={`/${currentLocale}/funds`} className={`flex flex-col items-center gap-1 w-16 ${pathname.includes('/funds') ? 'text-black' : 'text-gray-400'}`}>
            <svg className={`w-6 h-6 ${pathname.includes('/funds') ? 'fill-black' : 'fill-transparent'}`} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span className="text-[10px] font-bold">{isAmharic ? 'ፈንድ' : 'Fund'}</span>
          </Link>
          
          <Link href={`/${currentLocale}/deposit`} className={`flex flex-col items-center gap-1 w-16 ${pathname.includes('/deposit') ? 'text-black' : 'text-gray-400'}`}>
            <svg className={`w-6 h-6 ${pathname.includes('/deposit') ? 'fill-black' : 'fill-transparent'}`} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
            <span className="text-[10px] font-bold">{isAmharic ? 'ማስገቢያ' : 'Deposit'}</span>
          </Link>
          
          <Link href={`/${currentLocale}/tasks`} className={`flex flex-col items-center gap-1 w-16 ${pathname.includes('/tasks') ? 'text-black' : 'text-gray-400'}`}>
            <svg className={`w-6 h-6 ${pathname.includes('/tasks') ? 'fill-black' : 'fill-transparent'}`} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
            <span className="text-[10px] font-bold">{isAmharic ? 'ተግባር' : 'Task'}</span>
          </Link>
          
          <Link href={`/${currentLocale}/dashboard`} className={`flex flex-col items-center gap-1 w-16 ${pathname.includes('/dashboard') ? 'text-[#B519FF]' : 'text-gray-400'}`}>
             <div className={`p-1 rounded-full ${pathname.includes('/dashboard') ? 'bg-purple-100' : ''}`}>
                <svg className={`w-6 h-6 ${pathname.includes('/dashboard') ? 'fill-[#B519FF]' : 'fill-transparent'}`} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
             </div>
            <span className="text-[10px] font-bold">{isAmharic ? 'የእኔ' : 'Mine'}</span>
          </Link>
        </div>
      )}
    </div>
  );
}