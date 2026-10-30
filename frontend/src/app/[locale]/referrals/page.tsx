'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function UserReferrals({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  const isAmharic = locale === 'am';

  useEffect(() => {
    if (!user.id) {
      router.push(`/${locale}/auth`);
      return;
    }

    fetch(`${apiUrl}/api/user/${user.id}/dashboard`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setUserData(data);
      })
      .finally(() => setLoading(false));
  }, [router, locale, user.id, apiUrl]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B519FF]"></div>
    </div>
  );
  if (!userData) return <div className="p-8 text-center text-red-600">{isAmharic ? 'ውሂብ መጫን አልተቻለም።' : 'Failed to load data.'}</div>;

  const referralLink = `${window.location.origin}/${locale}/auth?ref=${user.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-24 relative overflow-hidden">
      
      {/* Decorative Background Blur */}
      <div className="absolute top-0 right-[-20%] w-64 h-64 bg-[#B519FF]/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-[-20%] w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="relative z-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
          {isAmharic ? 'የሪፈራል ኔትወርክ' : 'Referral Network'}
        </h1>
        <p className="text-gray-500 font-medium">
          {isAmharic ? 'ጓደኞችዎን ይጋብዙ እና ኔትወርክዎን ያሳድጉ።' : 'Invite friends and grow your network.'}
        </p>
      </div>

      {/* Referral Link Box */}
      <div className="bg-gradient-to-br from-[#B519FF] to-purple-700 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden group z-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-500"></div>
        
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
            {isAmharic ? 'የእርስዎ የጋበዣ ሊንክ' : 'Your Invite Link'}
          </h2>
          <p className="text-purple-100 text-sm mb-6">
            {isAmharic ? 'ይህን ሊንክ ለጓደኞችዎ ያጋሩ እና ወደ ኔትወርክዎ ያክሏቸው።' : 'Share this link with friends to add them to your network.'}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text" 
              readOnly 
              value={referralLink} 
              className="w-full p-4 bg-black/20 text-white border border-white/20 rounded-2xl text-sm font-mono outline-none focus:ring-2 focus:ring-white/50 placeholder-white/50" 
            />
            <button 
              onClick={handleCopy} 
              className={`px-8 py-4 rounded-2xl font-bold text-sm transition-all shadow-lg whitespace-nowrap flex items-center justify-center gap-2 ${
                copied ? 'bg-emerald-400 text-white' : 'bg-white text-[#B519FF] hover:bg-gray-100'
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  {isAmharic ? 'ተቀድቷል!' : 'Copied!'}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                  {isAmharic ? 'ቅዳ' : 'Copy'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        
        {/* Level 1 Tree */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:border-[#B519FF]/30 hover:shadow-md transition-all duration-300">
          <h3 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wider flex justify-between items-center">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#B519FF]"></span>
              {isAmharic ? 'የደረጃ 1 ኔትወርክ' : 'Level 1 Network'}
            </span>
            <span className="text-[#B519FF] bg-purple-50 px-3 py-1 rounded-lg text-xs">
              {userData.referrals.level1.length} {isAmharic ? 'ተጠቃሚዎች' : 'Users'}
            </span>
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {userData.referrals.level1.length === 0 ? (
              <div className="text-center py-8 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-sm text-gray-400">{isAmharic ? 'እስካሁን ቀጥተኛ ግብዣ የለም።' : 'No direct invites yet.'}</p>
              </div>
            ) : (
              userData.referrals.level1.map((ref: any) => (
                <div key={ref.id} className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 flex justify-between items-center text-sm hover:shadow-sm hover:border-gray-200 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#B519FF] to-purple-400 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      {ref.name ? ref.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{ref.name}</p>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">{ref.phone}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Level 2 Tree */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:border-emerald-500/30 hover:shadow-md transition-all duration-300">
          <h3 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wider flex justify-between items-center">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {isAmharic ? 'የደረጃ 2 ኔትወርክ' : 'Level 2 Network'}
            </span>
            <span className="text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg text-xs">
              {userData.referrals.level2.length} {isAmharic ? 'ተጠቃሚዎች' : 'Users'}
            </span>
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {userData.referrals.level2.length === 0 ? (
              <div className="text-center py-8 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-sm text-gray-400">{isAmharic ? 'እስካሁን የልጅ ልጅ ግብዣ የለም።' : 'No grandchild invites yet.'}</p>
              </div>
            ) : (
              userData.referrals.level2.map((ref: any) => (
                <div key={ref.id} className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 flex justify-between items-center text-sm hover:shadow-sm hover:border-gray-200 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      {ref.name ? ref.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{ref.name}</p>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">{ref.phone}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}