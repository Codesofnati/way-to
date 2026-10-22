'use client';

import { useState, useEffect, use, Suspense } from 'react';

function NotificationsContent({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = use(params);
  const locale = resolvedParams.locale;
  const isAmharic = locale === 'am';

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      window.location.href = `/${locale}/auth`;
      return;
    }

    const user = JSON.parse(storedUser);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

    fetch(`${apiUrl}/api/user/${user.id}/dashboard`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setNotifications(data.notifications);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [locale]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border">
          <h1 className="text-xl font-bold text-gray-800">{isAmharic ? 'ማስታወቂያዎች' : 'Notifications'}</h1>
          <a href={`/${locale}/dashboard`} className="text-sm text-indigo-600 hover:underline">
            {isAmharic ? '← ወደ ዳሽቦርድ ተመለስ' : '← Back to Dashboard'}
          </a>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          {notifications.length === 0 ? (
            <p className="text-gray-500 text-sm">{isAmharic ? 'ምንም ማስታወቂያ የለም' : 'No notifications yet.'}</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif: any) => (
                <div key={notif.id} className="p-4 bg-gray-50 rounded-xl border text-sm text-gray-700">
                  {notif.message}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}

export default function NotificationsPage({ params }: { params: Promise<{ locale: string }> }) {
  return <Suspense fallback={<div>Loading...</div>}><NotificationsContent params={params} /></Suspense>;
}