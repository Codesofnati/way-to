'use client';
import { useState, useEffect, use } from 'react';

export default function UserHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const isAmharic = locale === 'am';
  
  const [stories, setStories] = useState<any[]>([]);
  const [activeNotif, setActiveNotif] = useState<any>(null);
  const [showNotif, setShowNotif] = useState(false);
  const [loading, setLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  useEffect(() => {
    // Fetch Stories and Notifications simultaneously
    Promise.all([
      fetch(`${apiUrl}/api/stories`).then(r => r.json()),
      fetch(`${apiUrl}/api/active-notification`).then(r => r.json())
    ]).then(([storiesRes, notifRes]) => {
      if (storiesRes.success) setStories(storiesRes.stories);
      
      // ✅ Check if there is an active notification
      if (notifRes.success && notifRes.notification) {
        setActiveNotif(notifRes.notification);
        
        // Check if the user already dismissed this specific notification today
        const lastSeen = localStorage.getItem('lastNotifSeen');
        if (lastSeen !== notifRes.notification.id) {
          setShowNotif(true);
        }
      }
    }).finally(() => setLoading(false));
  }, [apiUrl]);

  const dismissNotif = () => {
    setShowNotif(false);
    // Save that they saw it so it doesn't pop up again
    if (activeNotif) localStorage.setItem('lastNotifSeen', activeNotif.id);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading stories...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 pt-4 px-4">
      
      {/* Stories Feed */}
      {stories.map(story => (
        <div key={story.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {story.imageUrl && (
            <img src={story.imageUrl} alt="Story" className="w-full h-64 object-cover" />
          )}
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isAmharic ? story.titleAm : story.titleEn}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {isAmharic ? story.contentAm : story.contentEn}
            </p>
            <p className="text-xs text-gray-400 mt-4">
              {new Date(story.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}

      {/* ✅ Popup Notification Modal */}
      {showNotif && activeNotif && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-[#B519FF]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#B519FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            </div>
            
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
              {isAmharic ? activeNotif.titleAm : activeNotif.titleEn}
            </h3>
            <p className="text-center text-gray-600 mb-6">
              {isAmharic ? activeNotif.contentAm : activeNotif.contentEn}
            </p>
            
            <button 
              onClick={dismissNotif}
              className="w-full bg-[#B519FF] text-white py-3 rounded-xl font-bold"
            >
              {isAmharic ? 'ገባኝ' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}