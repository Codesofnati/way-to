'use client';
import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function UserTasks({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Time state based on PC time
  const [timeState, setTimeState] = useState<'OPEN' | 'CLOSED'>('CLOSED');

  const [activeTask, setActiveTask] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [subscribed, setSubscribed] = useState(false);
  const [liked, setLiked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  // ✅ NEW: Custom Message State
  const [message, setMessage] = useState({ text: '', type: '' });

  // ✅ YouTube Player States
  const [playerReady, setPlayerReady] = useState(false);
  const [watchTime, setWatchTime] = useState(0);
  const [videoWatched, setVideoWatched] = useState(false);
  const playerRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
  const isAmharic = locale === 'am';

  useEffect(() => {
    if (!user.id) return router.push(`/${locale}/auth`);
    fetchData();
    checkTime();
    
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, [router, locale, user.id, apiUrl]);

  // ✅ Load YouTube API script
  useEffect(() => {
    if (showVideo) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      (window as any).onYouTubeIframeAPIReady = () => {
        setPlayerReady(true);
      };
    }
  }, [showVideo]);

  // ✅ Initialize Player when modal opens
  useEffect(() => {
    if (showVideo && playerReady && activeTask) {
      const ytId = getYouTubeId(activeTask.youtubeUrl);
      if (!ytId) return;

      // Clear previous player
      if (playerRef.current) {
        playerRef.current.destroy();
      }

      playerRef.current = new (window as any).YT.Player('youtube-player', {
        videoId: ytId,
        playerVars: { autoplay: 1, rel: 0 },
        events: {
          'onStateChange': (event: any) => {
            // If playing, start 30s timer
            if (event.data === (window as any).YT.PlayerState.PLAYING) {
              if (!timerRef.current && !videoWatched) {
                timerRef.current = setInterval(() => {
                  setWatchTime((prev) => {
                    if (prev >= 29) {
                      clearInterval(timerRef.current);
                      setVideoWatched(true);
                      return 30;
                    }
                    return prev + 1;
                  });
                }, 1000);
              }
            }
            // If paused, stop the timer
            if (event.data === (window as any).YT.PlayerState.PAUSED) {
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
            }
          }
        }
      });
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [showVideo, playerReady, activeTask]);

  // Reset video tracking when task changes or modal closes
  useEffect(() => {
    if (!activeTask || !showVideo) {
      setWatchTime(0);
      setVideoWatched(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [activeTask, showVideo]);

  const checkTime = () => {
    const now = new Date();
    const currentHour = now.getHours(); 

    if (currentHour >= 8 && currentHour < 16) {
      setTimeState('OPEN');
    } else {
      setTimeState('CLOSED');
    }
  };

  const fetchData = async () => {
    try {
      const [myJobsRes, userRes, settingsRes] = await Promise.all([
        fetch(`${apiUrl}/api/user/${user.id}/my-jobs`).then(res => res.json()),
        fetch(`${apiUrl}/api/user/${user.id}/dashboard`).then(res => res.json()),
        fetch(`${apiUrl}/api/system-settings`).then(res => res.json())
      ]);
      if (myJobsRes.success) setMyJobs(myJobsRes.myJobs);
      if (userRes.success) setUserData(userRes);
      if (settingsRes.success) setSystemSettings(settingsRes.settings);
    } finally { setLoading(false); }
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (!videoWatched) {
      return setMessage({ 
        text: isAmharic ? 'እባክዎ ቪዲዮውን ለ 30 ሰከንድ ይመልከቱ።' : 'Please watch the video for at least 30 seconds.', 
        type: 'error' 
      });
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/user/${user.id}/submit-task`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: activeTask.id, jobId: activeTask.jobId, rating, subscribed, liked })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setMessage({ text: data.message, type: 'success' });
      
      // Delay closing the modal slightly so they can see the success message
      setTimeout(() => {
        setActiveTask(null);
        setShowVideo(false);
        setRating(5); setSubscribed(false); setLiked(false);
        fetchData();
      }, 2000);

    } catch (err: any) { 
      setMessage({ text: err.message, type: 'error' }); 
    }
    finally { setSubmitting(false); }
  };

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E4E79]"></div>
    </div>
  );

  const totalTasksToday = myJobs.reduce((acc, job) => acc + job.tasks.length, 0);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-24 relative overflow-hidden">
      
      <div className="absolute top-0 right-[-20%] w-64 h-64 bg-[#1E4E79]/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-[-20%] w-64 h-64 bg-[#15608D]/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
            {isAmharic ? 'የተግባር ማዕከል' : 'Task Center'}
          </h1>
          <p className="text-gray-500 font-medium">
            {isAmharic ? 'ቪዲዮዎችን ይመልከቱ እና ገቢ ያግኙ።' : 'Watch the videos and complete requirements to earn.'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-[#1E4E79] to-[#15608D] text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden group w-full md:w-auto">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10">
            <p className="text-xs text-blue-100 uppercase font-bold tracking-wider mb-1">
              {isAmharic ? 'ያለዎት ቀሪ ሂሳብ' : 'Available Balance'}
            </p>
            <p className="text-3xl font-black tracking-tight">ETB {userData?.user?.walletBalance || '0.00'}</p>
          </div>
        </div>
      </div>

      <div className={`relative z-10 p-4 rounded-2xl border font-bold text-sm flex items-center justify-between shadow-sm backdrop-blur-md ${
        timeState === 'OPEN' 
          ? 'bg-blue-50/80 border-blue-200 text-[#1E4E79]' 
          : 'bg-red-50/80 border-red-200 text-red-800'
      }`}>
        {timeState === 'OPEN' 
          ? (isAmharic ? '✅ ተግባሮች ክፍት ናቸው። እስከ ምሽቱ 10:00 ሰዓት ድረስ መስራት ይችላሉ።' : '✅ Tasks are OPEN. You can complete tasks until 4:00 PM.') 
          : (isAmharic ? '⚠️ ተግባሮች ተዘግተዋል። ከጠዋቱ 2:00 እስከ ምሽቱ 10:00 ሰዓት ብቻ ነው።' : '⚠️ Tasks are CLOSED. Tasks can only be claimed between 8:00 AM and 4:00 PM.')}
      </div>

      {myJobs.length === 0 ? (
        <div className="relative z-10 bg-white/95 backdrop-blur-md p-12 rounded-[2rem] text-center border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Job</h3>
          <p className="text-gray-500 mb-6">{isAmharic ? 'እባክዎ መጀመሪያ ስራ ይግዙ።' : 'You have not registered for any job yet.'}</p>
          <a href={`/${locale}/jobs`} className="inline-block bg-[#1E4E79] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#15608D] transition-colors shadow-md">
            {isAmharic ? 'ስራዎችን ይመልከቱ' : 'Browse Jobs'}
          </a>
        </div>
      ) : totalTasksToday === 0 ? (
        <div className="relative z-10 bg-white/95 backdrop-blur-md p-12 rounded-[2rem] text-center border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#1E4E79]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{isAmharic ? 'ዛሬ አዲስ ቪዲዮ የለም' : 'No new videos today'}</h3>
          <p className="text-gray-500">{isAmharic ? 'አስተዳዳሪው ለዛሬ አዲስ ቪዲዮ አላስገባም።' : 'The Super Admin has not uploaded videos for today yet. Check back later.'}</p>
        </div>
      ) : (
        <div className="relative z-10 space-y-8">
          
          {/* ✅ NEW: Global message display for the main page (e.g. if they try to click a task when closed) */}
          {message.text && !activeTask && (
            <div className={`p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${
              message.type === 'error' 
                ? 'bg-red-50 border border-red-200 text-red-700' 
                : 'bg-green-50 border border-green-200 text-green-700'
            }`}>
              {message.type === 'error' ? (
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              ) : (
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              )}
              <div className="flex-1 text-sm font-medium">
                {message.text}
              </div>
              <button type="button" onClick={() => setMessage({ text: '', type: '' })} className="opacity-50 hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
          )}

          {myJobs.map((myJob: any) => (
            <div key={myJob.id} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-[#1E4E79] rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-900">{myJob.jobName} Tasks</h2>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {myJob.tasks.map((task: any) => (
                  <div key={task.id} className="bg-white/95 backdrop-blur-md rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-gray-100 hover:border-[#1E4E79]/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col overflow-hidden">
                    
                    <div className="relative aspect-video bg-gray-200 overflow-hidden">
                      {task.thumbnailUrl ? (
                        <img src={task.thumbnailUrl} alt={task.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 bg-gray-100">No Thumbnail</div>
                      )}
                      
                      <div className="absolute top-2 right-2 md:top-3 md:right-3 bg-black/70 backdrop-blur-sm text-white text-[10px] md:text-xs font-bold px-2 py-1 md:px-3 md:py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
                        {task.fakeLikes || 0}
                      </div>

                      {task.isCompleted && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                          <span className="text-white font-bold text-sm md:text-lg border-2 border-white px-3 py-1 md:px-4 md:py-2 rounded-xl flex items-center gap-2">
                            ✅ {isAmharic ? 'ተጠናቋል' : 'Completed'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 md:p-5 flex-1 flex flex-col justify-between">
                      <h3 className="font-bold text-gray-900 text-sm md:text-base mb-4 line-clamp-2 leading-snug group-hover:text-[#1E4E79] transition-colors">{task.title}</h3>
                      
                      <button 
                        onClick={() => { 
                          setMessage({ text: '', type: '' }); // Clear global message
                          if (timeState !== 'OPEN') {
                            return setMessage({ 
                              text: isAmharic ? 'ተግባሮች ተዘግተዋል። ከጠዋቱ 2:00 እስከ ምሽቱ 10:00 ሰዓት ብቻ ነው።' : 'Tasks are closed. Please check back between 8:00 AM and 4:00 PM.', 
                              type: 'error' 
                            });
                          }
                          setActiveTask({...task, jobId: myJob.jobId}); 
                          
                          if (task.requiresSubscription) {
                            setShowVideo(false); 
                          } else {
                            setShowVideo(true); 
                          }
                        }}
                        disabled={task.isCompleted || timeState !== 'OPEN'}
                        className={`w-full py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-all shadow-sm ${
                          (task.isCompleted || timeState !== 'OPEN') 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-[#1E4E79] text-white hover:bg-[#15608D] hover:shadow-md'
                        }`}
                      >
                        {task.isCompleted 
                          ? (isAmharic ? 'ተከፍሏል' : 'Already Paid') 
                          : (timeState !== 'OPEN' 
                              ? (isAmharic ? 'ተዘግቷል' : 'Closed') 
                              : (isAmharic ? 'ይመልከቱ እና ያግኙ' : 'Watch & Earn'))}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Modal */}
      {activeTask && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur-md z-10">
              <h2 className="text-lg font-bold text-gray-900 pr-8 line-clamp-1">{activeTask.title}</h2>
              <button onClick={() => { setActiveTask(null); setMessage({ text: '', type: '' }); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors text-2xl font-bold">&times;</button>
            </div>

            {!showVideo ? (
              <div className="p-8 text-center space-y-6">
                
                {/* ✅ NEW: Message Display inside Subscribe view */}
                {message.text && (
                  <div className={`p-4 rounded-2xl text-left flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${
                    message.type === 'error' 
                      ? 'bg-red-50 border border-red-200 text-red-700' 
                      : 'bg-green-50 border border-green-200 text-green-700'
                  }`}>
                    {message.type === 'error' ? (
                      <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    ) : (
                      <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    )}
                    <div className="flex-1 text-sm font-medium">
                      {message.text}
                    </div>
                  </div>
                )}

                <div className="w-24 h-24 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-red-100">
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {isAmharic ? 'ቻናላችንን ይመዝገቡ' : 'Subscribe to Our Channel'}
                </h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                  {isAmharic 
                    ? 'ሽልማትዎን ከመጠየቅዎ በፊት የYouTube ቻናላችንን መመዝገብ አለብዎት።' 
                    : 'You must subscribe to our YouTube channel before you can watch the video and claim your reward.'}
                </p>
                
                <a 
                  href={systemSettings?.youtubeChannelUrl || '#'} 
                  target="_blank" 
                  rel="noreferrer"
                  className={`inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all shadow-md ${
                    systemSettings?.youtubeChannelUrl 
                      ? 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:-translate-y-0.5' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  onClick={(e) => {
                    if (!systemSettings?.youtubeChannelUrl) {
                      e.preventDefault();
                      setMessage({ 
                        text: isAmharic ? 'የYouTube ሊንኩ በአስተዳዳሪው ገና አልተዘጋጀም።' : 'The YouTube subscribe link has not been set by the admin yet.', 
                        type: 'error' 
                      });
                      return;
                    }
                    setShowVideo(true);
                  }}
                >
                  {isAmharic ? 'ወደ YouTube ቻናል ይሂዱ' : 'Go to YouTube Channel'} ↗
                </a>
              </div>
            ) : (
              <>
                <div className="aspect-video bg-black relative">
                  <div id="youtube-player" className="absolute inset-0 w-full h-full"></div>
                </div>
                <form onSubmit={handleSubmitTask} className="p-6 md:p-8 space-y-6">
                  
                  {/* ✅ NEW: Message Display inside Video view */}
                  {message.text && (
                    <div className={`p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${
                      message.type === 'error' 
                        ? 'bg-red-50 border border-red-200 text-red-700' 
                        : 'bg-green-50 border border-green-200 text-green-700'
                    }`}>
                      {message.type === 'error' ? (
                        <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      ) : (
                        <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      )}
                      <div className="flex-1 text-sm font-medium">
                        {message.text}
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                    <p className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-3">
                      {isAmharic ? 'እነዚህን መስፈርቶች ያሟሉ:' : 'Complete these requirements:'}
                    </p>
                    
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={subscribed} 
                          onChange={(e) => setSubscribed(e.target.checked)} 
                          className="peer appearance-none w-6 h-6 border-2 border-gray-300 rounded-md checked:bg-[#1E4E79] checked:border-[#1E4E79] transition-colors cursor-pointer" 
                        />
                        <svg className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      <span className="text-sm text-gray-700 font-medium group-hover:text-gray-900 transition-colors">
                        {isAmharic ? 'የYouTube ቻናሉን ተመዝግቤያለሁ' : 'I subscribed to the YouTube channel'}
                      </span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={liked} 
                          onChange={(e) => setLiked(e.target.checked)} 
                          className="peer appearance-none w-6 h-6 border-2 border-gray-300 rounded-md checked:bg-[#1E4E79] checked:border-[#1E4E79] transition-colors cursor-pointer" 
                        />
                        <svg className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      <span className="text-sm text-gray-700 font-medium group-hover:text-gray-900 transition-colors">
                        {isAmharic ? 'ቪዲዮውን ወድጄዋለሁ' : 'I liked the video'}
                      </span>
                    </label>

                    <div className="pt-2">
                      <p className="text-sm text-gray-700 font-medium mb-3">
                        {isAmharic ? 'ይህን ቪዲዮ ደረጃ ይስጡት (5 ኮከቦች ያስፈልጋሉ)' : 'Rate this video (Must be 5 stars)'}
                      </p>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button 
                            key={star} 
                            type="button" 
                            onClick={() => setRating(star)} 
                            className={`text-4xl transition-transform hover:scale-110 ${rating >= star ? 'text-yellow-400 drop-shadow-md' : 'text-gray-200'}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={submitting || rating < 5 || !subscribed || !liked || !videoWatched} 
                    className="w-full bg-[#1E4E79] text-white p-4 rounded-xl font-bold text-lg hover:bg-[#15608D] transition-all shadow-md disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        {isAmharic ? 'በሂደት ላይ...' : 'Processing...'}
                      </span>
                    ) : !videoWatched ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        {isAmharic ? `ቪዲዮ በመመልከት ላይ... (${30 - watchTime} ሰ)` : `Watching video... (${30 - watchTime}s)`}
                      </span>
                    ) : (
                      isAmharic ? 'ሽልማት ይጠይቁ' : 'Claim Reward'
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}