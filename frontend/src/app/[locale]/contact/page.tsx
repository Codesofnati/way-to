'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function UserContact({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  const isAmharic = locale === 'am';

  useEffect(() => {
    if (!user.id) return router.push(`/${locale}/auth`);
    
    fetch(`${apiUrl}/api/contact-methods`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setMethods(data.methods);
      })
      .finally(() => setLoading(false));
  }, [router, locale, user.id, apiUrl]);

  // ✅ Helper function to generate the correct link dynamically
  const getSocialLink = (baseUrl: string, username: string) => {
    if (!baseUrl) return '#';
    const cleanUsername = username.replace('@', '').trim();
    // Ensure baseUrl ends with a slash before appending username
    const formattedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    return `${formattedBase}${cleanUsername}`;
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B519FF]"></div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-24 relative overflow-hidden">
      
      {/* Decorative Background Blur */}
      <div className="absolute top-0 right-[-20%] w-64 h-64 bg-[#B519FF]/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-[-20%] w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center justify-center pt-6">
        <div className="relative">
          <div className="absolute inset-0 bg-[#B519FF] blur-xl opacity-40 rounded-[1.5rem]"></div>
          <div className="w-20 h-20 bg-gradient-to-tr from-[#B519FF] to-purple-400 rounded-[1.5rem] flex items-center justify-center shadow-lg border-2 border-white relative z-10 mb-3 transform transition hover:scale-105 duration-300">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
          </div>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight text-center">
          {isAmharic ? 'አግኙን' : 'Contact Us'}
        </h1>
        <p className="text-sm font-medium text-gray-500 mt-1 text-center max-w-md mx-auto">
          {isAmharic ? 'እርዳታ ይፈልጋሉ? ከእነዚህ መድረኮች በአንዱ ላይ ያግኙን።' : 'Need help? Reach out to us on any of these platforms.'}
        </p>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-2 gap-3 md:gap-6 relative z-10">
        
        {methods.length === 0 && (
          <div className="col-span-2 text-center p-8 bg-white/80 backdrop-blur-md rounded-[2rem] border border-gray-100">
            <p className="text-gray-500">
              {isAmharic ? 'በአሁኑ ጊዜ ምንም የእውቂያ ዘዴዎች የሉም።' : 'No contact methods available at the moment.'}
            </p>
          </div>
        )}
        
        {methods.map((method: any) => (
          <div key={method.id} className="bg-white/90 backdrop-blur-md p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center text-center hover:border-[#B519FF]/30 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
            
            {/* Avatar (uses platform logo) */}
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-[#B519FF] blur-md opacity-20 rounded-full group-hover:opacity-40 transition-opacity"></div>
              <img 
                src={method.logoUrl} 
                alt={method.name} 
                className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover shadow-md border-2 border-white relative z-10 bg-white"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png'; }} 
              />
            </div>

            {/* Text Info */}
            <h3 className="text-sm md:text-lg font-bold text-gray-900 leading-tight mb-1 group-hover:text-[#B519FF] transition-colors">{method.name}</h3>
            <p className="text-[10px] md:text-sm text-gray-500 mb-4 truncate w-full px-2">{method.username}</p>
            
            {/* ✅ Dynamic Button Link */}
            <a 
              href={getSocialLink(method.baseUrl, method.username)} 
              target="_blank" 
              rel="noreferrer"
              className="w-full bg-black text-white py-2 md:py-3 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold hover:bg-[#B519FF] transition-all mt-auto flex items-center justify-center gap-1.5"
            >
              <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
              {isAmharic ? `መልእክት ይላኩ` : `Message`}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}