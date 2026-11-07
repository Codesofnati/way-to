'use client';
import { useState, useEffect, use } from 'react';

export default function UserHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const isAmharic = locale === 'am';
  
  const [stories, setStories] = useState<any[]>([]);
  const [activeNotifs, setActiveNotifs] = useState<any[]>([]);
  const [currentNotifIndex, setCurrentNotifIndex] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // App Settings (Profit & VIP images)
  const [appSettings, setAppSettings] = useState<{
    profitImages: string[], 
    vipImages: string[] 
  }>({ 
    profitImages: [], 
    vipImages: [] 
  });

  // ✅ NEW: Top Banner State
  const [topBanner, setTopBanner] = useState<any>(null);

  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [activeImageModal, setActiveImageModal] = useState<'profit' | 'vip' | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  useEffect(() => {
    Promise.all([
      fetch(`${apiUrl}/api/stories`).then(r => r.json()),
      fetch(`${apiUrl}/api/active-notification`).then(r => r.json()),
      fetch(`${apiUrl}/api/app-settings`).then(r => r.json()),
      fetch(`${apiUrl}/api/top-banner`).then(r => r.json()) // ✅ Fetch Top Banner
    ]).then(([storiesRes, notifRes, settingsRes, bannerRes]) => {
      if (storiesRes.success) setStories(storiesRes.stories);
      
      if (settingsRes.success) {
        setAppSettings({
          profitImages: settingsRes.settings.profitImages || [],
          vipImages: settingsRes.settings.vipImages || []
        });
      }

      // ✅ Set Top Banner if it exists
      if (bannerRes.success && bannerRes.banner) {
        setTopBanner(bannerRes.banner);
      }

      if (notifRes.success && notifRes.notifications && notifRes.notifications.length > 0) {
        setActiveNotifs(notifRes.notifications);
        setShowNotif(true); 
      }
    }).finally(() => setLoading(false));
  }, [apiUrl]);

  const dismissNotif = () => {
    if (currentNotifIndex < activeNotifs.length - 1) {
      setCurrentNotifIndex(prev => prev + 1);
    } else {
      setShowNotif(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#1E4E79] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-500 font-bold tracking-widest text-xs uppercase">Loading...</p>
    </div>
  );

  const currentNotif = activeNotifs[currentNotifIndex];

  return (
    <div className="max-w-2xl mx-auto pb-24 pt-4 px-4 relative bg-[#F8F9FA] min-h-screen">
      
      {/* ✅ NEW: Top Banner Section (Above About Us) */}
      {topBanner && (
        <div className="mb-3 rounded-xl overflow-hidden shadow-lg relative min-h-[200px] flex items-end ">
          {topBanner.imageUrl && (
            <img 
              src={topBanner.imageUrl} 
              alt="Banner" 
              className="absolute inset-0 w-full h-full object-cover opacity-80" 
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
          
          {(topBanner.title || topBanner.subtitle) && (
            <div className="relative z-10 p-6 w-full text-left">
              {topBanner.title && (
                <h1 className="text-2xl font-black text-white leading-tight drop-shadow-md mb-1">
                  {topBanner.title}
                </h1>
              )}
              {topBanner.subtitle && (
                <p className="text-sm font-medium text-white/90 drop-shadow-sm">
                  {topBanner.subtitle}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 1. About Us Section */}
      <div className="mb-6 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
        <button 
          onClick={() => setIsAboutExpanded(!isAboutExpanded)}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#1E4E79] shadow-inner">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">
                {isAmharic ? 'ስለ እኛ (About Us)' : 'About Us'}
              </h2>
              <p className="text-xs text-gray-500 font-medium mt-0.5">{isAmharic ? 'የኩባንያችን ታሪክ' : 'Our Story & Mission'}</p>
            </div>
          </div>
          <div className={`w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center transition-transform duration-300 ${isAboutExpanded ? 'rotate-180' : ''}`}>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </button>

        <div className="px-6 pb-6 text-sm text-gray-600 leading-relaxed space-y-4">
          {isAmharic ? (
            <div className='space-y-4'>
              <p className="font-bold text-gray-900 text-base leading-snug">ጉዟችን በካናዳ የተጀመረው በአንድ ቀላል ግን ጥልቅ እውነት ነበር፦ ችሎታና ተሰጥኦ በሁሉም ቦታ ቢኖርም፣ ዕድል ግን ለሁሉም እኩል አይዳረስም።</p>
              <p>በዓለም ላይ እጅግ ከተሳሰሩ የዲጂታል ምጣኔ-ሀብት ማዕከላት በአንዱ ውስጥ ስንኖር፣ የርቀት (የኦንላይን) ሥራ የሰዎችን ኑሮ እንዴት እንደሚቀይር፣ የጊዜ ነፃነትና የገንዘብ ራስን መቻልን እንዴት እንደሚያጎናፅፍ በአካል ተመልክተናል። በሌላ በኩል ደግሞ፣ በመላው ዓለም የሚገኙ በርካታ ብቁ እና ታታሪ ግለሰቦች በመልክዓ-ምድራዊ እና በኢኮኖሚ መሰናክሎች ብቻ ወደኋላ ሲቀሩ አይተናል። ክብር ያለው እና አስተማማኝ ገቢ የማግኘት ዕድል ሰው በተወለደበት የፖስታ ኮድ ወይም አካባቢ መወሰን የለበትም።</p>
            </div>
          ) : (
            <div className='space-y-4'>
            <p className="font-bold text-gray-900 text-base leading-snug">Our journey began in Canada with a simple realization: while talent is universal, opportunity is not.</p>
               <p>Living in one of the most connected digital economies in the world, we saw how remote work transformed lives, offering flexibility and financial independence. At the same time, we saw billions of capable, hardworking individuals around the world held back solely by geographic and economic barriers. Access to dignified, reliable income shouldn’t depend on the postal code you were born in.</p>
            </div>
          )}
          
          <div className={`space-y-4 transition-all duration-500 ${isAboutExpanded ? 'block' : 'hidden'}`}>
            {isAmharic ? (
              <>
                <p>ቴክኖሎጂ ሰዎችን የሚያራርቅ ሳይሆን ክፍተቶችን የሚያጠብ የእኩልነት ድልድይ መሆን አለበት በሚል ጽኑ እምነት ይህንን ተቋም መሠረትን። ዝቅተኛ ገቢ ያላቸው ታታሪ ዜጎችን ከዓለም አቀፉ የዲጂታል ኢኮኖሚ ጋር እናገናኛለን—ይህም ጊዜያዊ ሥራዎችን በማመቻቸት ብቻ ሳይሆን፣ ዘላቂ የገቢ ምንጭ እንዲፈጥሩ የሚያስችሉ ተግባራዊ ሥልጠናዎችን፣ የዲጂታል መሠረተ-ልማቶችን እና አስተማማኝ የክፍያ ሥርዓቶችን በማቅረብ ነው።</p>
                <p>በካናዳ የተጀመረው ይህ ጥረት ዛሬ ድንበር የለሽ ማህበረሰብ ፈጥሯል፤ ይህም ሰዎች ተገቢውን ዕድል እና መሣሪያ ሲያገኙ ራሳቸውን መመገብ ብቻ ሳይሆን፣ ቤተሰቦቻቸውን እና ማህበረሰባቸውን ከፍ እንደሚያደርጉ በተግባር ያሳያል።</p>
                <div className="bg-[#F8F9FA] p-5 rounded-2xl border border-gray-100 mt-4">
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#1E4E79]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    ተልዕኮ (Mission)
                  </h4>
                  <p className="text-gray-600 mb-4 text-xs leading-relaxed">ዝቅተኛ ገቢ ላላቸው ወገኖች አስፈላጊውን የዲጂታል ክህሎት በማስታጠቅ እና ቀጥታ ተገቢ ክፍያ ካላቸው ዘላቂ የኦንላይን ሥራዎች ጋር በማገናኘት የኢኮኖሚ እንቅፋቶችን ማስወገድ።</p>
                  
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#1E4E79]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                    ዋና ዋና እሴቶቻችን
                  </h4>
                  <ul className="space-y-2 text-xs text-gray-600">
                    <li className="flex items-start gap-2"><span className="text-[#1E4E79] mt-0.5">•</span> <span><strong className="text-gray-900">ተደራሽነት:</strong> ግለሰቦች ከዚህ ቀደም የቴክኖሎጂ ልምድ ይኑራቸው አይኑራቸው፣ ለእያንዳንዱ ሰው በቀላሉ የሚገቡ ሥልጠናዎችንና መሣሪያዎችን ማዘጋጀት።</span></li>
                    <li className="flex items-start gap-2"><span className="text-[#1E4E79] mt-0.5">•</span> <span><strong className="text-gray-900">ዘላቂ አቅም ግንባታ:</strong> ከመረዳዳት ባለፈ በተግባራዊ ክህሎት እና በገበያ ትስስር ራስን በራስ ማስተዳደር ላይ ማተኮር።</span></li>
                    <li className="flex items-start gap-2"><span className="text-[#1E4E79] mt-0.5">•</span> <span><strong className="text-gray-900">ዓለም አቀፍ ትስስር:</strong> በዓለም አቀፉ የሥራ ፍላጎት እና በአካባቢው ባሉ ብቁ ታታሪ ኃይሎች መካከል እውነተኛ ድልድይ መፍጠር።</span></li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <p>Driven by the belief that technology should be an equalizer rather than a divider, we set out to build a platform that bridges the gap. We connect determined individuals from low-income communities with the global digital economy—providing not just gig opportunities, but the practical training, digital infrastructure, and reliable payment systems needed to build lasting livelihoods.</p>
                <p>What started as a Canadian initiative has grown into a borderless community, proving that when people are given the tools to participate, they don’t just earn a living—they lift up their families and transform their communities.</p>
               <div className="bg-[#F8F9FA] p-5 rounded-2xl border border-gray-100 mt-4">
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#1E4E79]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    Mission Statement
                  </h4>
                  <p className="text-gray-600 mb-4 text-xs leading-relaxed">To dismantle systemic economic barriers by equipping low-income individuals with digital skills and connecting them directly to sustainable, fair-paying online work.</p>
                  
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#1E4E79]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                    Core Values
                  </h4>
                  <ul className="space-y-2 text-xs text-gray-600">
                    <li className="flex items-start gap-2"><span className="text-[#1E4E79] mt-0.5">•</span> <span><strong className="text-gray-900">Radical Accessibility:</strong> Designing tools, training, and onboarding that meet people where they are, regardless of prior technical experience.</span></li>
                    <li className="flex items-start gap-2"><span className="text-[#1E4E79] mt-0.5">•</span> <span><strong className="text-gray-900">Sustainable Empowerment:</strong> Moving beyond charity toward self-sufficiency through practical skill-building and market integration.</span></li>
                    <li className="flex items-start gap-2"><span className="text-[#1E4E79] mt-0.5">•</span> <span><strong className="text-gray-900">Global Community:</strong> Building authentic connections between global demand and resilient local talent.</span></li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Image Banners (Profit & VIP) */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        
        {/* Profit Banner */}
        <button 
          onClick={() => setActiveImageModal('profit')}
          className="aspect-[4/5] rounded-[1.5rem] overflow-hidden relative group shadow-md hover:shadow-lg transition-all duration-300 bg-gray-900 w-full"
        >
          {appSettings.profitImages.length > 0 ? (
            <img 
              src={appSettings.profitImages[0]} 
              alt="Profit" 
              className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-700" 
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1E4E79] to-[#15608D]"></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col items-start">
            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mb-2">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h3 className="text-white font-bold text-lg leading-tight drop-shadow-sm">Profit</h3>
            <p className="text-white/70 text-[10px] font-medium uppercase tracking-widest mt-1">View Tables</p>
          </div>
        </button>

        {/* VIP Banner */}
        <button 
          onClick={() => setActiveImageModal('vip')}
          className="aspect-[4/5] rounded-[1.5rem] overflow-hidden relative group shadow-md hover:shadow-lg transition-all duration-300 bg-gray-900 w-full"
        >
          {appSettings.vipImages.length > 0 ? (
             <img 
               src={appSettings.vipImages[0]} 
               alt="VIP" 
               className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-700" 
             />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1E4E79] to-[#15608D]"></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col items-start">
            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mb-2">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
            </div>
            <h3 className="text-white font-bold text-lg leading-tight drop-shadow-sm">Become VIP</h3>
            <p className="text-white/70 text-[10px] font-medium uppercase tracking-widest mt-1">Exclusive</p>
          </div>
        </button>
      </div>

      {/* 3. Stories Feed */}
      {stories.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4 px-2">
             <div className="w-1.5 h-4 bg-[#1E4E79] rounded-full"></div>
             <h2 className="font-bold text-gray-900 text-sm uppercase tracking-widest">Notice to Welynto Users</h2>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {stories.map((story, index) => (
              <button 
                key={story.id} 
                onClick={() => setSelectedStory(story)}
                className={`w-full text-left flex items-center justify-between p-5 hover:bg-gray-50 transition-all duration-200 group ${
                  index !== stories.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  {story.imageUrl ? (
                    <div className="w-16 h-16 flex-shrink-0 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                      <img src={story.imageUrl} alt="Story" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 flex-shrink-0 rounded-full bg-blue-50 flex items-center justify-center text-[#1E4E79]">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
                    </div>
                  )}
                  <div className="flex-1 pr-4">
                    <h3 className="font-bold text-gray-900 text-base mb-1 group-hover:text-[#1E4E79] transition-colors line-clamp-1">
                      {(isAmharic ? story.titleAm : story.titleEn) || (isAmharic ? 'አዲስ ማስታወቂያ' : 'New Notice')}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                      {(isAmharic ? story.contentAm : story.contentEn) || (isAmharic ? 'ለማንበብ ይጫኑ' : 'Click to view story')}
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#1E4E79] transition-colors flex-shrink-0">
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ✅ HARDCODED WELYNT0 ADVANTAGES SECTION */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4 px-2">
          <div className="w-1.5 h-4 bg-[#1E4E79] rounded-full"></div>
          <h2 className="font-bold text-gray-900 text-sm uppercase tracking-widest">
            {isAmharic ? 'የዌሊንቶ ጥቅሞች' : 'Welynto Advantages'}
          </h2>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden p-6 space-y-6">
          
          {/* Item 1 */}
          <div className="flex gap-4">
            <div className="w-10 h-10 flex-shrink-0 rounded-full bg-blue-50 text-[#1E4E79] flex items-center justify-center font-bold font-mono">
              01
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">{isAmharic ? 'ዕለታዊ ተግባራት' : 'Daily Tasks'}</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {isAmharic 
                  ? 'ዕለታዊ ተግባራትን ይቀበሉ እና የYouTube ቪዲዮ ተግባራትን በማጠናቀቅ ኮሚሽን ያግኙ።' 
                  : 'Receive daily tasks and earn commissions by completing YouTube video tasks.'}
              </p>
            </div>
          </div>

          {/* Item 2 */}
          <div className="flex gap-4">
            <div className="w-10 h-10 flex-shrink-0 rounded-full bg-blue-50 text-[#1E4E79] flex items-center justify-center font-bold font-mono">
              02
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">{isAmharic ? 'ጋብዝ እና ተጠቀም' : 'Invite & Earn'}</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {isAmharic 
                  ? 'ሌሎችን የመጋበዝ መብት አለዎት፣ ይህም ተጨማሪ የሥራ ዕድሎችን ይፈጥራል። ሪፈራል ሽልማቶችን ይቀበሉ።' 
                  : 'Invite others to join, which creates more job opportunities. Receive referral rewards.'}
              </p>
            </div>
          </div>

          {/* Item 3 */}
          <div className="flex gap-4">
            <div className="w-10 h-10 flex-shrink-0 rounded-full bg-blue-50 text-[#1E4E79] flex items-center justify-center font-bold font-mono">
              03
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">{isAmharic ? 'የድጋፍ ቡድን' : 'Support Team'}</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {isAmharic 
                  ? 'ቡድን ከፈጠሩ በኋላ በWelynto የበይነመረብ ቡድን ቦታዎች ላይ በመመዝገብ ቋሚ ወርሃዊ ደመወዝ ያግኙ።' 
                  : 'Apply for online team positions with Welynto and receive a fixed monthly salary.'}
              </p>
            </div>
          </div>

          {/* Item 4 */}
          <div className="flex gap-4">
            <div className="w-10 h-10 flex-shrink-0 rounded-full bg-blue-50 text-[#1E4E79] flex items-center justify-center font-bold font-mono">
              04
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">{isAmharic ? 'የፈንድ ምርቶች' : 'Fund Products'}</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {isAmharic 
                  ? 'በWelynto የውስጥ ፋይናንሺያል ፈንድ ውስጥ ይሳተፉ እና ተጨማሪ የፋይናንስ ትርፍ ያግኙ።' 
                  : "Participate in Welynto's internal financial management fund and enjoy additional returns."}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* ✅ NEW: FOOTER SECTION */}
      <footer className="mt-12 pt-8 pb-4 border-t border-gray-200 flex flex-col items-center text-center">
        {/* Brand Logo / Name */}
        <div className="text-2xl font-black text-[#1E4E79] tracking-widest uppercase mb-4">
          Welynto
        </div>

        {/* Quick Links (Optional - you can point these to actual pages later) */}
        <div className="flex gap-4 mb-6 text-sm font-semibold text-gray-500">
         
          <a href={`/${locale}/contact`} className="hover:text-[#1E4E79] transition-colors">
            {isAmharic ? 'ድጋፍ' : 'Support'}
          </a>
        </div>

        {/* Copyright */}
        <p className="text-xs text-gray-400 font-medium">
          © {new Date().getFullYear()} Welynto. {isAmharic ? 'መብቱ በህግ የተጠበቀ ነው።' : 'All rights reserved.'}
        </p>
      </footer>
      {/* ✅ END OF FOOTER */}

      {/* 4. Full Story Modal */}
      {selectedStory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-300">
            
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-white shrink-0">
              <h2 className="font-bold text-gray-900 text-lg line-clamp-1">
                {(isAmharic ? selectedStory.titleAm : selectedStory.titleEn) || (isAmharic ? 'ማስታወቂያ' : 'Notice')}
              </h2>
              <button onClick={() => setSelectedStory(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition font-bold shrink-0">&times;</button>
            </div>
            
            <div className="overflow-y-auto custom-scrollbar flex-1 bg-gray-50">
              {selectedStory.imageUrl && (
                <img src={selectedStory.imageUrl} alt="Story" className="w-full h-auto object-contain bg-white" />
              )}
              
              {(selectedStory.contentAm || selectedStory.contentEn) && (
                <div className="p-6 text-gray-700 whitespace-pre-wrap leading-relaxed text-sm bg-white mt-2 border-t border-gray-100">
                  {isAmharic ? selectedStory.contentAm : selectedStory.contentEn}
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-gray-100 shrink-0">
              <button onClick={() => setSelectedStory(null)} className="w-full bg-[#1E4E79] text-white py-3 rounded-2xl font-bold hover:bg-[#153a5b] transition shadow-md">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Profit / VIP Image Modals */}
      {activeImageModal && (
        <div className="fixed inset-0 bg-white backdrop-blur-lg z-[100] flex flex-col animate-in fade-in duration-200">
          <div className="p-4 flex justify-between items-center bg-[#1E4E79]">
            <h2 className="font-bold text-white text-lg capitalize">{activeImageModal} Details</h2>
            <button onClick={() => setActiveImageModal(null)} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-8 flex flex-col items-center gap-6 custom-scrollbar">
            
            {activeImageModal === 'profit' && (
              appSettings.profitImages.length > 0 ? (
                appSettings.profitImages.map((url, i) => (
                  <img key={i} src={url} alt={`Profit Table ${i}`} className="w-full max-w-lg rounded-2xl object-contain shadow-2xl" />
                ))
              ) : (
                <div className="text-gray-400 text-center mt-10">No Profit images uploaded yet.</div>
              )
            )}

            {activeImageModal === 'vip' && (
              appSettings.vipImages.length > 0 ? (
                appSettings.vipImages.map((url, i) => (
                  <img key={i} src={url} alt={`VIP Poster ${i}`} className="w-full max-w-lg rounded-2xl object-contain shadow-2xl" />
                ))
              ) : (
                <div className="text-gray-400 text-center mt-10">No VIP Poster uploaded yet.</div>
              )
            )}

          </div>
        </div>
      )}

      {/* 6. Popup Notification Modal */}
      {showNotif && currentNotif && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="absolute top-4 left-4 z-20 bg-[#1E4E79] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
              {currentNotifIndex + 1} / {activeNotifs.length}
            </div>
            <button onClick={() => setShowNotif(false)} className="absolute top-4 right-4 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center z-20 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

            {currentNotif.imageUrl && (
              <div className="w-full bg-[#F8F9FA] flex items-center justify-center min-h-[200px] overflow-hidden">
                <img 
                  src={currentNotif.imageUrl} 
                  alt="Notification Banner" 
                  className="w-full h-auto max-h-[50vh] object-contain" 
                />
              </div>
            )}

            {(currentNotif.titleEn || currentNotif.contentEn || currentNotif.titleAm || currentNotif.contentAm) && (
              <div className="p-6 text-center overflow-y-auto custom-scrollbar">
                {(currentNotif.titleEn || currentNotif.titleAm) && (
                  <h3 className="text-xl font-black text-gray-900 mb-2 leading-tight">
                    {isAmharic ? currentNotif.titleAm : currentNotif.titleEn}
                  </h3>
                )}
                {(currentNotif.contentEn || currentNotif.contentAm) && (
                  <p className="text-sm text-gray-600 mb-6 whitespace-pre-wrap leading-relaxed">
                    {isAmharic ? currentNotif.contentAm : currentNotif.contentEn}
                  </p>
                )}
                
                <button onClick={dismissNotif} className="w-full bg-gradient-to-br from-[#1E4E79] to-[#15608D] text-white py-3.5 rounded-xl font-bold hover:opacity-95 transition shadow-lg active:scale-95">
                  {currentNotifIndex < activeNotifs.length - 1 
                    ? (isAmharic ? 'ቀጣይ' : 'Next Notice') 
                    : (isAmharic ? 'ዝጋ' : 'Close')}
                </button>
              </div>
            )}

            {!(currentNotif.titleEn || currentNotif.contentEn || currentNotif.titleAm || currentNotif.contentAm) && (
              <div className="p-4 bg-white">
                <button onClick={dismissNotif} className="w-full bg-gradient-to-br from-[#1E4E79] to-[#15608D] text-white py-3.5 rounded-xl font-bold hover:opacity-95 transition shadow-lg active:scale-95">
                  {currentNotifIndex < activeNotifs.length - 1 
                    ? (isAmharic ? 'ቀጣይ' : 'Next Notice') 
                    : (isAmharic ? 'ዝጋ' : 'Close')}
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}