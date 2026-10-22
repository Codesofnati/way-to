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

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    
    // Check if the current page is a login page
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
    router.push('/auth');
  };

  // ✅ FIX: If on ANY login page OR not logged in, just show the page (no sidebar)
  const isLoginPage = pathname.includes('/auth') || pathname.includes('/login');
  
  if (isLoginPage || !isLoggedIn) {
    return <>{children}</>;
  }

  // --- Role-Based Navigation ---
  let navItems = [];

 // Inside components/DashboardLayout.tsx

  if (userRole === 'super_admin') {
    navItems = [
      { name: 'Overview Analytics', path: '/en/admin/super-dashboard' },
      { name: 'Manage Admins', path: '/en/admin/manage-admins' },
      { name: 'User Moderation', path: '/en/admin/user-moderation' },
      { name: 'Payment Approvals', path: '/en/admin/payments' },
      { name: 'Referral Analytics', path: '/en/admin/referrals' },
      { name: 'Personal Information', path: '/en/admin/profile' }, // ✅ Added

    ];
  } else if (userRole === 'admin') {
    navItems = [
      { name: 'Admin Dashboard', path: '/en/admin/dashboard' },
      { name: 'Payment Approvals', path: '/en/admin/payments' },
    ];
  } else {
    navItems = [
      { name: 'My Dashboard', path: '/dashboard' },
      { name: 'Deposit', path: '/deposit' },
      { name: 'My Referrals', path: '/referrals' },
    ];
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col md:flex-row font-sans">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-[#B519FF] text-white p-1.5 rounded-lg font-bold text-sm shadow-[0_0_10px_rgba(181,25,255,0.3)]">S</div>
          <span className="font-bold text-xl tracking-tight">shortcut.</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 left-0 z-40 w-64 h-screen bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        <div className="hidden md:flex items-center gap-2 p-6">
          <div className="bg-[#B519FF] text-white p-1.5 rounded-lg font-bold text-sm shadow-[0_0_15px_rgba(181,25,255,0.4)]">S</div>
          <span className="font-bold text-2xl tracking-tight">shortcut.</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto mt-4 md:mt-0">
          {navItems.map((item) => {
            const isActive = pathname.includes(item.path);
            return (
              <Link
                key={item.name}
                href={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`block px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive 
                    ? 'bg-black text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="px-4 py-3 mb-2 bg-gray-50 rounded-xl">
            <p className="text-sm font-bold text-gray-900 truncate">{userName}</p>
            <p className="text-xs text-[#B519FF] font-bold uppercase tracking-wider mt-1">{userRole.replace('_', ' ')}</p>
          </div>
          <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 font-bold hover:bg-red-50 rounded-xl transition-colors">
            Log out
          </button>
        </div>
      </aside>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-30 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      <main className="flex-1 p-4 md:p-8 lg:p-10 overflow-y-auto w-full">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}