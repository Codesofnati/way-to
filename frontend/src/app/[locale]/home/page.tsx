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
  const [appSettings, setAppSettings] = useState<{profitImages: string[], vipImage: string}>({ 
    profitImages: [], 
    vipImage: '' 
  });

  // States for expandable and modals
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [activeImageModal, setActiveImageModal] = useState<'profit' | 'vip' | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  useEffect(() => {
    Promise.all([
      fetch(`${apiUrl}/api/stories`).then(r => r.json()),
      fetch(`${apiUrl}/api/active-notification`).then(r => r.json()),
      fetch(`${apiUrl}/api/app-settings`).then(r => r.json())
    ]).then(([storiesRes, notifRes, settingsRes]) => {
      if (storiesRes.success) setStories(storiesRes.stories);
      
      if (settingsRes.success) {
        setAppSettings({
          profitImages: settingsRes.settings.profitImages || [],
          vipImage: settingsRes.settings.vipImage || ''
        });
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

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  const currentNotif = activeNotifs[currentNotifIndex];

  return (
    <div className="max-w-2xl mx-auto pb-24 pt-1 px-1 relative bg-white min-h-screen">
      
      {/* 1. About Us (Expandable) */}
      <div className="mb-3 bg-white  border border-gray-100 overflow-hidden transition-all duration-300">
        <button 
          onClick={() => setIsAboutExpanded(!isAboutExpanded)}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-[#B519FF] rounded-full"></div>
            <h2 className="font-bold text-gray-900 text-base">
              {isAmharic ? 'ስለ እኛ (About Us)' : 'About Us (Our Story)'}
            </h2>
          </div>
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isAboutExpanded ? 'rotate-180' : ''}`} 
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>

        <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed space-y-4">
          {isAmharic ? (
            <p className="font-bold text-gray-900 text-base">ጉዟችን በካናዳ የተጀመረው በአንድ ቀላል ግን ጥልቅ እውነት ነበር፦ ችሎታና ተሰጥኦ በሁሉም ቦታ ቢኖርም፣ ዕድል ግን ለሁሉም እኩል አይዳረስም።</p>
          ) : (
            <p className="font-bold text-gray-900 text-base">Our journey began in Canada with a simple realization: while talent is universal, opportunity is not.</p>
          )}
          
          <div className={`space-y-4 transition-all duration-500 ${isAboutExpanded ? 'block' : 'hidden'}`}>
            {isAmharic ? (
              <>
                <p>በዓለም ላይ እጅግ ከተሳሰሩ የዲጂታል ምጣኔ-ሀብት ማዕከላት በአንዱ ውስጥ ስንኖር፣ የርቀት (የኦንላይን) ሥራ የሰዎችን ኑሮ እንዴት እንደሚቀይር፣ የጊዜ ነፃነትና የገንዘብ ራስን መቻልን እንዴት እንደሚያጎናፅፍ በአካል ተመልክተናል። በሌላ በኩል ደግሞ፣ በመላው ዓለም የሚገኙ በርካታ ብቁ እና ታታሪ ግለሰቦች በመልክዓ-ምድራዊ እና በኢኮኖሚ መሰናክሎች ብቻ ወደኋላ ሲቀሩ አይተናል። ክብር ያለው እና አስተማማኝ ገቢ የማግኘት ዕድል ሰው በተወለደበት የፖስታ ኮድ ወይም አካባቢ መወሰን የለበትም።</p>
                <p>ቴክኖሎጂ ሰዎችን የሚያራርቅ ሳይሆን ክፍተቶችን የሚያጠብ የእኩልነት ድልድይ መሆን አለበት በሚል ጽኑ እምነት ይህንን ተቋም መሠረትን። ዝቅተኛ ገቢ ያላቸው ታታሪ ዜጎችን ከዓለም አቀፉ የዲጂታል ኢኮኖሚ ጋር እናገናኛለን—ይህም ጊዜያዊ ሥራዎችን በማመቻቸት ብቻ ሳይሆን፣ ዘላቂ የገቢ ምንጭ እንዲፈጥሩ የሚያስችሉ ተግባራዊ ሥልጠናዎችን፣ የዲጂታል መሠረተ-ልማቶችን እና አስተማማኝ የክፍያ ሥርዓቶችን በማቅረብ ነው።</p>
                <p>በካናዳ የተጀመረው ይህ ጥረት ዛሬ ድንበር የለሽ ማህበረሰብ ፈጥሯል፤ ይህም ሰዎች ተገቢውን ዕድል እና መሣሪያ ሲያገኙ ራሳቸውን መመገብ ብቻ ሳይሆን፣ ቤተሰቦቻቸውን እና ማህበረሰባቸውን ከፍ እንደሚያደርጉ በተግባር ያሳያል።</p>
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 mt-4">
                  <h4 className="font-bold text-[#B519FF] mb-2">ተልዕኮ (Mission)</h4>
                  <p className="text-gray-700 mb-3">ዝቅተኛ ገቢ ላላቸው ወገኖች አስፈላጊውን የዲጂታል ክህሎት በማስታጠቅ እና ቀጥታ ተገቢ ክፍያ ካላቸው ዘላቂ የኦንላይን ሥራዎች ጋር በማገናኘት የኢኮኖሚ እንቅፋቶችን ማስወገድ።</p>
                  
                  <h4 className="font-bold text-[#B519FF] mb-2">ዋና ዋና እሴቶቻችን (Core Values)</h4>
                  <ul className="list-disc pl-4 space-y-1 text-gray-700">
                    <li><strong>ተደራሽነት (Radical Accessibility):</strong> ግለሰቦች ከዚህ ቀደም የቴክኖሎጂ ልምድ ይኑራቸው አይኑራቸው፣ ለእያንዳንዱ ሰው በቀላሉ የሚገቡ ሥልጠናዎችንና መሣሪያዎችን ማዘጋጀት።</li>
                    <li><strong>ዘላቂ አቅም ግንባታ (Sustainable Empowerment):</strong> ከመረዳዳት ባለፈ በተግባራዊ ክህሎት እና በገበያ ትስስር ራስን በራስ ማስተዳደር ላይ ማተኮር።</li>
                    <li><strong>ዓለም አቀፍ ትስስር (Global Community):</strong> በዓለም አቀፉ የሥራ ፍላጎት እና በአካባቢው ባሉ ብቁ ታታሪ ኃይሎች መካከል እውነተኛ ድልድይ መፍጠር።</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <p>Living in one of the most connected digital economies in the world, we saw how remote work transformed lives, offering flexibility and financial independence. At the same time, we saw billions of capable, hardworking individuals around the world held back solely by geographic and economic barriers. Access to dignified, reliable income shouldn’t depend on the postal code you were born in.</p>
                <p>Driven by the belief that technology should be an equalizer rather than a divider, we set out to build a platform that bridges the gap. We connect determined individuals from low-income communities with the global digital economy—providing not just gig opportunities, but the practical training, digital infrastructure, and reliable payment systems needed to build lasting livelihoods.</p>
                <p>What started as a Canadian initiative has grown into a borderless community, proving that when people are given the tools to participate, they don’t just earn a living—they lift up their families and transform their communities.</p>
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 mt-4">
                  <h4 className="font-bold text-[#B519FF] mb-2">Mission Statement</h4>
                  <p className="text-gray-700 mb-3">To dismantle systemic economic barriers by equipping low-income individuals with digital skills and connecting them directly to sustainable, fair-paying online work.</p>
                  
                  <h4 className="font-bold text-[#B519FF] mb-2">Core Values</h4>
                  <ul className="list-disc pl-4 space-y-1 text-gray-700">
                    <li><strong>Radical Accessibility:</strong> Designing tools, training, and onboarding that meet people where they are, regardless of prior technical experience.</li>
                    <li><strong>Sustainable Empowerment:</strong> Moving beyond charity toward self-sufficiency through practical skill-building and market integration.</li>
                    <li><strong>Global Community:</strong> Building authentic connections between global demand and resilient local talent.</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Image Banners (Profit & VIP) - 2 Column Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        
        {/* Profit Banner */}
        <button 
          onClick={() => setActiveImageModal('profit')}
          className="aspect-square rounded-2xl overflow-hidden relative group shadow-sm hover:shadow-md transition bg-gray-900 w-full"
        >
          {appSettings.profitImages.length > 0 && (
            <img 
              src={appSettings.profitImages[0]} 
              alt="Profit" 
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" 
            />
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-2 z-10">
            <h3 className="text-white font-bold text-lg md:text-xl text-center tracking-wide drop-shadow-md leading-tight">
              Profit
            </h3>
          </div>
        </button>

        {/* VIP Banner */}
        <button 
          onClick={() => setActiveImageModal('vip')}
          className="aspect-square rounded-2xl overflow-hidden relative group shadow-sm hover:shadow-md transition bg-gray-900 w-full"
        >
          {appSettings.vipImage && (
             <img 
               src={appSettings.vipImage} 
               alt="VIP" 
               className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" 
             />
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-2 z-10">
            <h3 className="text-white font-bold text-lg md:text-xl text-center tracking-wide drop-shadow-md leading-tight">
              Become<br/>Our VIP
            </h3>
          </div>
        </button>
      </div>

      {/* 3. Stories Feed (Clickable) */}
      {stories.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4 px-1">
             <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
             <h2 className="font-bold text-gray-800 text-sm">Notice to Wayto Users</h2>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {stories.map((story, index) => (
              <button 
                key={story.id} 
                onClick={() => setSelectedStory(story)}
                className={`w-full text-left flex items-center justify-between p-5 hover:bg-gray-50 transition ${
                  index !== stories.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="flex-1 pr-4">
                  <h3 className="font-bold text-gray-900 text-base mb-1">
                    {isAmharic ? story.titleAm : story.titleEn}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                    {isAmharic ? story.contentAm : story.contentEn}
                  </p>
                </div>
                {story.imageUrl && (
                  <div className="w-24 h-20 flex-shrink-0 rounded-xl overflow-hidden border border-gray-100">
                    <img src={story.imageUrl} alt="Story" className="w-full h-full object-cover" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. Full Story Modal */}
      {selectedStory && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <h2 className="font-bold text-gray-900 line-clamp-1">{isAmharic ? selectedStory.titleAm : selectedStory.titleEn}</h2>
              <button onClick={() => setSelectedStory(null)} className="text-gray-400 hover:text-gray-900 text-xl font-bold">&times;</button>
            </div>
            <div className="overflow-y-auto">
              {selectedStory.imageUrl && (
                <img src={selectedStory.imageUrl} alt="Story" className="w-full h-56 object-cover" />
              )}
              <div className="p-5 text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">
                {isAmharic ? selectedStory.contentAm : selectedStory.contentEn}
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <button onClick={() => setSelectedStory(null)} className="w-full bg-gray-900 text-white py-2.5 rounded-xl font-bold">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Profit / VIP Image Modals */}
      {activeImageModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex flex-col">
          <div className="p-4 flex justify-end">
            <button onClick={() => setActiveImageModal(null)} className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-10 flex flex-col items-center gap-4">
            
            {activeImageModal === 'profit' && (
              appSettings.profitImages.length > 0 ? (
                appSettings.profitImages.map((url, i) => (
                  <img key={i} src={url} alt={`Profit Table ${i}`} className="w-full max-w-lg rounded-xl object-contain" />
                ))
              ) : (
                <div className="text-white text-center mt-10">No Profit images uploaded yet.</div>
              )
            )}

            {activeImageModal === 'vip' && (
              appSettings.vipImage ? (
                <img src={appSettings.vipImage} alt="VIP Poster" className="w-full max-w-lg rounded-xl object-contain" />
              ) : (
                <div className="text-white text-center mt-10">No VIP Poster uploaded yet.</div>
              )
            )}

          </div>
        </div>
      )}

      {/* 6. Popup Notification Modal (Carousel) */}
      {showNotif && currentNotif && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="absolute top-3 left-3 z-10 bg-black/50 text-white text-[10px] font-bold px-2 py-1 rounded-md">
              {currentNotifIndex + 1} / {activeNotifs.length}
            </div>
            <button onClick={() => setShowNotif(false)} className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center z-10 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

            {currentNotif.imageUrl && (
              <div className="w-full bg-[#B519FF]/10 flex items-center justify-center min-h-[200px] overflow-hidden">
                <img 
                  src={currentNotif.imageUrl} 
                  alt="Notification Banner" 
                  className="w-full h-auto max-h-[50vh] object-contain" 
                />
              </div>
            )}

            {(currentNotif.titleEn || currentNotif.contentEn || currentNotif.titleAm || currentNotif.contentAm) && (
              <div className="p-5 text-center overflow-y-auto">
                {(currentNotif.titleEn || currentNotif.titleAm) && (
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {isAmharic ? currentNotif.titleAm : currentNotif.titleEn}
                  </h3>
                )}
                {(currentNotif.contentEn || currentNotif.contentAm) && (
                  <p className="text-sm text-gray-600 mb-4 whitespace-pre-wrap">
                    {isAmharic ? currentNotif.contentAm : currentNotif.contentEn}
                  </p>
                )}
                
                <button onClick={dismissNotif} className="w-full bg-[#1A1A1A] text-white py-3 rounded-lg font-bold hover:bg-black transition mt-2">
                  {currentNotifIndex < activeNotifs.length - 1 
                    ? (isAmharic ? 'ቀጣይ' : 'Next') 
                    : (isAmharic ? 'ዝጋ' : 'Close')}
                </button>
              </div>
            )}

            {!(currentNotif.titleEn || currentNotif.contentEn || currentNotif.titleAm || currentNotif.contentAm) && (
              <div className="p-4 bg-white">
                <button onClick={dismissNotif} className="w-full bg-[#1A1A1A] text-white py-3 rounded-lg font-bold hover:bg-black transition">
                  {currentNotifIndex < activeNotifs.length - 1 
                    ? (isAmharic ? 'ቀጣይ' : 'Next') 
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