'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function UserNotifications({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all');

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  const isAmharic = locale === 'am';

  useEffect(() => {
    if (!user.id) return router.push(`/${locale}/auth`);
    fetchNotifications();
  }, [router, locale, user.id, apiUrl]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/user/${user.id}/notifications`);
      const data = await res.json();
      if (data.success) setNotifications(data.notifications);
    } finally { setLoading(false); }
  };

  const markAsRead = async (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    await fetch(`${apiUrl}/api/user/${user.id}/notifications/${id}/read`, { method: 'PUT' });
  };

  const markAllAsRead = async () => {
    // Optimistic update
    const unread = notifications.filter(n => !n.isRead);
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    
    // Send to backend (We will add this route below)
    await fetch(`${apiUrl}/api/user/${user.id}/notifications/read-all`, { method: 'PUT' });
  };

  // ✅ 1. Relative Time Helper
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return isAmharic ? 'አሁን በቅርቡ' : 'Just now';
    if (diffMins < 60) return isAmharic ? `ከ${diffMins} ደቂቃዎች በፊት` : `${diffMins} mins ago`;
    if (diffHours < 24) return isAmharic ? `ከ${diffHours} ሰዓታት በፊት` : `${diffHours} hours ago`;
    if (diffDays < 7) return isAmharic ? `ከ${diffDays} ቀናት በፊት` : `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // ✅ 2. Category Icon Helper
  const getNotificationIcon = (message: string) => {
    const msg = message.toLowerCase();
    if (msg.includes('job')) return { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>, color: 'text-blue-600 bg-blue-50' };
    if (msg.includes('fund') || msg.includes('invest')) return { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>, color: 'text-emerald-600 bg-emerald-50' };
    if (msg.includes('payment') || msg.includes('wallet')) return { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>, color: 'text-[#B519FF] bg-purple-50' };
    if (msg.includes('bonus') || msg.includes('earned')) return { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path></svg>, color: 'text-yellow-600 bg-yellow-50' };
    return { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>, color: 'text-gray-600 bg-gray-100' };
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B519FF]"></div>
    </div>
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'read') return n.isRead;
    return true;
  });

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-24 relative overflow-hidden">
      
      <div className="absolute top-0 right-[-20%] w-64 h-64 bg-[#B519FF]/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-[-20%] w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center justify-center pt-6">
        <div className="relative">
          <div className="absolute inset-0 bg-[#B519FF] blur-xl opacity-40 rounded-[1.5rem]"></div>
          <div className="w-20 h-20 bg-gradient-to-tr from-[#B519FF] to-purple-400 rounded-[1.5rem] flex items-center justify-center shadow-lg border-2 border-white relative z-10 mb-3 transform transition hover:scale-105 duration-300">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
          </div>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight text-center">
          {isAmharic ? 'ማሳወቂያዎች' : 'Notifications'}
        </h1>
        <p className="text-sm font-medium text-gray-500 mt-1 text-center">
          {isAmharic ? (
            <>ያልተነበቡ <span className="font-bold text-[#B519FF]">{unreadCount}</span> ማሳወቂያዎች አሉዎት።</>
          ) : (
            <>You have <span className="font-bold text-[#B519FF]">{unreadCount}</span> unread notifications.</>
          )}
        </p>
      </div>

      {/* ✅ Tabs & Mark All as Read */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
        <div className="bg-white/60 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-gray-100 flex gap-1 w-full sm:w-auto">
          {['all', 'unread', 'read'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-sm font-bold capitalize transition-all ${
                activeTab === tab ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {isAmharic ? (tab === 'all' ? 'ሁሉም' : tab === 'unread' ? 'ያልተነበቡ' : 'የተነበቡ') : tab}
            </button>
          ))}
        </div>

        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="text-xs font-bold text-[#B519FF] hover:underline flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {isAmharic ? 'ሁሉንም እንደተነበበ ምልክት አድርግ' : 'Mark all as read'}
          </button>
        )}
      </div>

      <div className="space-y-4 relative z-10">
        {filteredNotifications.length === 0 && (
          <div className="text-center p-12 bg-white/80 backdrop-blur-md rounded-[2rem] border border-dashed border-gray-200 flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
            </div>
            <p className="text-gray-500 font-medium">
              {isAmharic ? 'ምንም ማሳወቂያ አልተገኘም።' : 'No notifications found.'}
            </p>
          </div>
        )}

        {filteredNotifications.map((notif: any) => {
          const { icon, color } = getNotificationIcon(notif.message);
          return (
            <div 
              key={notif.id} 
              onClick={() => !notif.isRead && markAsRead(notif.id)}
              className={`p-5 rounded-[1.5rem] shadow-sm border transition-all cursor-pointer flex gap-4 ${
                notif.isRead 
                  ? 'bg-white/60 backdrop-blur-md border-gray-100 opacity-70' 
                  : 'bg-white/95 backdrop-blur-md border-[#B519FF]/30 ring-1 ring-[#B519FF]/20 hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              {/* ✅ Category Icon */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${notif.isRead ? 'bg-gray-100 text-gray-400' : color}`}>
                {icon}
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start gap-4">
                  <p className={`text-sm leading-relaxed ${notif.isRead ? 'text-gray-600' : 'text-gray-900 font-bold'}`}>
                    {notif.message}
                  </p>
                  {!notif.isRead && (
                    <span className="w-2.5 h-2.5 bg-[#B519FF] rounded-full shrink-0 mt-1 shadow-[0_0_10px_rgba(181,25,255,0.5)]"></span>
                  )}
                </div>
                {/* ✅ Relative Time */}
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-2">
                  {getRelativeTime(notif.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}