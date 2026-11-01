'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminJobs({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();

  const [jobs, setJobs] = useState<any[]>([]);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [dailyVideos, setDailyVideos] = useState<any[]>([]);

  const [newJob, setNewJob] = useState({ name: '', description: '', price: '', taskCount: '', rewardPerTask: '' });
  const [editingJob, setEditingJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [addingTaskTo, setAddingTaskTo] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({ title: '', youtubeUrl: '', fakeLikes: '0' });

  // Daily video state - ✅ Added requiresSubscription
  const [newVideo, setNewVideo] = useState({ 
    title: '', 
    youtubeUrl: '', 
    fakeLikes: '0', 
    scheduledDate: '', 
    requiresSubscription: false 
  });
  
  const [bulkUrls, setBulkUrls] = useState('');
  const [bulkDate, setBulkDate] = useState('');
  const [showBulk, setShowBulk] = useState(false);

  // YouTube System Settings State
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isEditingYt, setIsEditingYt] = useState(false);
  const [tempYtUrl, setTempYtUrl] = useState('');

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  useEffect(() => {
    if (user.role !== 'super_admin') return router.push(`/${locale}/auth`);
    fetchData();
  }, [router, locale]);

  const fetchData = async () => {
    try {
      const [jobsRes, activeRes, videosRes, settingsRes] = await Promise.all([
        fetch(`${apiUrl}/api/super-admin/jobs`).then(res => res.json()),
        fetch(`${apiUrl}/api/super-admin/active-jobs`).then(res => res.json()),
        fetch(`${apiUrl}/api/super-admin/daily-videos`).then(res => res.json()),
        fetch(`${apiUrl}/api/system-settings`).then(res => res.json()),
      ]);
      if (jobsRes.success) setJobs(jobsRes.jobs);
      if (activeRes.success) setActiveJobs(activeRes.activeJobs);
      if (videosRes.success) setDailyVideos(videosRes.videos);
      if (settingsRes.success) setYoutubeUrl(settingsRes.settings.youtubeChannelUrl || '');
    } finally { setLoading(false); }
  };

  // ---------- YOUTUBE SETTINGS ----------
  const handleSaveYoutube = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/system-settings`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtubeChannelUrl: tempYtUrl }),
      });
      if (res.ok) {
        setYoutubeUrl(tempYtUrl);
        setIsEditingYt(false);
      }
    } catch (err: any) { alert(err.message); }
  };

  const handleDeleteYoutube = async () => {
    if (!confirm('Are you sure you want to remove the YouTube channel link?')) return;
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/system-settings/youtube`, { method: 'DELETE' });
      if (res.ok) setYoutubeUrl('');
    } catch (err: any) { alert(err.message); }
  };

  // ---------- JOB CRUD ----------
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/jobs`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newJob,
          price: parseFloat(newJob.price),
          taskCount: parseInt(newJob.taskCount),
          rewardPerTask: parseFloat(newJob.rewardPerTask),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewJob({ name: '', description: '', price: '', taskCount: '', rewardPerTask: '' });
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/jobs/${editingJob.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingJob,
          price: parseFloat(editingJob.price),
          taskCount: parseInt(editingJob.taskCount),
          rewardPerTask: parseFloat(editingJob.rewardPerTask),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEditingJob(null);
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this job?')) return;
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/jobs/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  // Legacy: per-job task add
  const handleAddTask = async (e: React.FormEvent, jobId: string) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/jobs/${jobId}/tasks`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTask.title,
          youtubeUrl: newTask.youtubeUrl,
          fakeLikes: parseInt(newTask.fakeLikes) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewTask({ title: '', youtubeUrl: '', fakeLikes: '0' });
      setAddingTaskTo(null);
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  // ---------- ACTIVE JOBS ----------
  const handleTerminate = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to terminate the active job for "${name}"?`)) return;
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/active-jobs/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  // ---------- DAILY VIDEOS ----------
  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/daily-videos`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVideo),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // ✅ Reset including requiresSubscription
      setNewVideo({ title: '', youtubeUrl: '', fakeLikes: '0', scheduledDate: '', requiresSubscription: false });
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const urls = bulkUrls.split('\n').map(u => u.trim()).filter(Boolean);
    if (urls.length === 0) return alert('Paste at least one URL.');

    let succeeded = 0;
    for (let i = 0; i < urls.length; i++) {
      try {
        const res = await fetch(`${apiUrl}/api/super-admin/daily-videos`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `Video ${i + 1}`,
            youtubeUrl: urls[i],
            fakeLikes: 0,
            scheduledDate: bulkDate || '',
            requiresSubscription: false // Bulk adds default to false
          }),
        });
        if (res.ok) succeeded++;
      } catch { /* skip */ }
    }
    alert(`Added ${succeeded} of ${urls.length} videos.`);
    setBulkUrls('');
    setShowBulk(false);
    fetchData();
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Delete this video?')) return;
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/daily-videos/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  // ---------- FILTERS ----------
  const filteredActiveJobs = activeJobs.filter((aj: any) => {
    const query = searchQuery.toLowerCase();
    return (
      (aj.userName && aj.userName.toLowerCase().includes(query)) ||
      (aj.userPhone && aj.userPhone.includes(query))
    );
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentActiveJobs = filteredActiveJobs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredActiveJobs.length / itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-400">
      <div className="w-10 h-10 border-4 border-[#B519FF] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-bold tracking-widest uppercase text-xs">Loading Jobs...</p>
    </div>
  );
    return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">Job Management</h1>
        <p className="text-gray-400 font-medium">Manage user tasks, video links, and active subscriptions.</p>
      </div>

      {/* ✅ YouTube Channel Link Settings */}
      <div className="bg-[#131825] p-6 md:p-8 rounded-3xl border border-red-500/30 relative overflow-hidden shadow-[0_0_30px_rgba(239,68,68,0.05)]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <h2 className="text-xl font-bold text-red-500 flex items-center gap-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
              YouTube Subscribe Link
            </h2>
            <p className="text-sm text-gray-400 mt-1">Users must click this link before completing tasks.</p>
          </div>

          {isEditingYt ? (
            <form onSubmit={handleSaveYoutube} className="flex-1 flex flex-col sm:flex-row gap-2 w-full max-w-lg">
              <div className="relative flex-1">
                <input 
                  type="url" 
                  value={tempYtUrl} 
                  onChange={e => setTempYtUrl(e.target.value)} 
                  className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-red-500" 
                  required 
                />
                {!tempYtUrl && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">https://youtube.com/@channel</span>}
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 sm:flex-none bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition">Save</button>
                <button type="button" onClick={() => setIsEditingYt(false)} className="flex-1 sm:flex-none bg-gray-800 text-gray-300 px-6 py-3 rounded-xl font-bold hover:bg-gray-700 transition">Cancel</button>
              </div>
            </form>
          ) : (
            <div className="flex items-center gap-3 w-full md:w-auto bg-[#0B0F19] p-2 rounded-xl border border-gray-800">
              {youtubeUrl ? (
                <>
                  <a href={youtubeUrl} target="_blank" rel="noreferrer" className="text-sm text-red-400 underline truncate max-w-[200px] flex-1 px-2">
                    {youtubeUrl}
                  </a>
                  <button onClick={() => { setTempYtUrl(youtubeUrl); setIsEditingYt(true); }} className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-500/20 transition">Edit</button>
                  <button onClick={handleDeleteYoutube} className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-500/20 transition">Delete</button>
                </>
              ) : (
                <button onClick={() => { setTempYtUrl(''); setIsEditingYt(true); }} className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm w-full hover:bg-red-600 transition">
                  + Add YouTube Link
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ✅ GLOBAL DAILY VIDEOS */}
      <div className="bg-[#131825] p-6 md:p-8 rounded-3xl border border-[#B519FF]/30 relative overflow-hidden shadow-[0_0_30px_rgba(181,25,255,0.05)]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#B519FF]/10 rounded-full blur-3xl"></div>
        
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 relative z-10">
          <div>
            <h2 className="text-xl font-bold text-[#B519FF] flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"></path></svg>
              Daily Videos (All Jobs)
            </h2>
            <p className="text-sm text-gray-400 mt-1">These videos apply to every user with a job.</p>
          </div>
          <button
            onClick={() => setShowBulk(!showBulk)}
            className="bg-[#B519FF]/10 text-[#B519FF] border border-[#B519FF]/20 px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#B519FF]/20 transition"
          >
            {showBulk ? 'Single Entry' : '⚡ Bulk Paste URLs'}
          </button>
        </div>

        {!showBulk ? (
          <form onSubmit={handleAddVideo} className="flex flex-col lg:flex-row gap-3 mb-6 relative z-10">
            <div className="relative flex-1">
              <input type="text" value={newVideo.title} onChange={e => setNewVideo({ ...newVideo, title: e.target.value })} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-[#B519FF]" required />
              {!newVideo.title && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">Video Title</span>}
            </div>
            <div className="relative flex-1">
              <input type="url" value={newVideo.youtubeUrl} onChange={e => setNewVideo({ ...newVideo, youtubeUrl: e.target.value })} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-[#B519FF]" required />
              {!newVideo.youtubeUrl && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">YouTube URL</span>}
            </div>
            <div className="relative w-full lg:w-32">
              <input type="number" value={newVideo.fakeLikes} onChange={e => setNewVideo({ ...newVideo, fakeLikes: e.target.value })} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-[#B519FF]" />
              {!newVideo.fakeLikes && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">Likes</span>}
            </div>
            <input type="date" value={newVideo.scheduledDate} onChange={e => setNewVideo({ ...newVideo, scheduledDate: e.target.value })} className="w-full lg:w-44 p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-[#B519FF] color-scheme-dark" />
            
            {/* ✅ NEW: Require Subscribe Checkbox */}
            <div className="flex items-center gap-2 bg-[#0B0F19] px-4 py-3 border border-gray-700 rounded-xl">
              <input 
                type="checkbox" 
                checked={newVideo.requiresSubscription} 
                onChange={e => setNewVideo({ ...newVideo, requiresSubscription: e.target.checked })} 
                className="w-5 h-5 accent-[#B519FF] cursor-pointer" 
              />
              <span className="text-xs font-bold text-gray-300 whitespace-nowrap">Require Subscribe</span>
            </div>

            <button type="submit" className="bg-[#B519FF] text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-600 transition shadow-[0_0_15px_rgba(181,25,255,0.3)] whitespace-nowrap">+ Add Video</button>
          </form>
        ) : (
          <form onSubmit={handleBulkAdd} className="space-y-3 mb-6 p-5 bg-[#0B0F19] rounded-2xl border border-gray-800 relative z-10">
            <p className="text-xs font-bold text-[#B519FF] uppercase tracking-widest">Paste one YouTube URL per line</p>
            <div className="relative">
              <textarea value={bulkUrls} onChange={e => setBulkUrls(e.target.value)} className="w-full p-3 bg-[#131825] border border-gray-700 rounded-xl font-mono text-sm text-white h-32 outline-none focus:border-[#B519FF]" required />
              {!bulkUrls && <span className="absolute text-sm text-gray-500 pointer-events-none" style={{ top: '12px', left: '12px' }}>https://youtube.com/watch?v=...\nhttps://youtube.com/watch?v=...</span>}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input type="date" value={bulkDate} onChange={e => setBulkDate(e.target.value)} className="flex-1 p-3 bg-[#131825] border border-gray-700 rounded-xl text-sm text-white outline-none color-scheme-dark" />
              <button type="submit" className="bg-[#B519FF] text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-600 transition shadow-[0_0_15px_rgba(181,25,255,0.3)] whitespace-nowrap">⚡ Add All URLs</button>
            </div>
          </form>
        )}

        <div className="space-y-3 relative z-10">
          {dailyVideos.length === 0 && (
            <div className="text-center py-8 bg-[#0B0F19] rounded-xl border border-gray-800 border-dashed">
              <p className="text-gray-500 text-sm">No videos uploaded yet.</p>
            </div>
          )}
          {dailyVideos.map((v: any) => (
            <div key={v.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 bg-[#0B0F19] rounded-xl border border-gray-800 hover:border-gray-600 transition">
              {v.thumbnailUrl ? <img src={v.thumbnailUrl} className="w-full sm:w-24 h-32 sm:h-14 object-cover rounded-lg" alt={v.title} /> : <div className="w-full sm:w-24 h-32 sm:h-14 bg-gray-800 rounded-lg" />}
              <div className="flex-1">
                <p className="font-bold text-white text-base">{v.title}</p>
                <p className="text-xs text-gray-400 mt-1 flex flex-wrap items-center gap-2">
                  <span>📅 {v.scheduledDate}</span>
                  <span>•</span>
                  <span>❤️ {v.fakeLikes || 0} likes</span>
                  <span>•</span>
                  <a href={v.youtubeUrl} target="_blank" rel="noreferrer" className="text-[#B519FF] underline">Open Link</a>
                  
                  {/* ✅ NEW: Sub Required Badge */}
                  {v.requiresSubscription && (
                    <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-[10px] uppercase font-bold border border-red-500/30">
                      Sub Required
                    </span>
                  )}
                </p>
              </div>
              <button onClick={() => handleDeleteVideo(v.id)} className="w-full sm:w-auto bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-500/20 transition">Delete</button>
            </div>
          ))}
        </div>
      </div>

      {/* Active User Jobs Section */}
      <div className="bg-[#131825] p-6 md:p-8 rounded-3xl border border-orange-500/30 relative overflow-hidden shadow-[0_0_30px_rgba(249,115,22,0.05)]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl"></div>
        
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 relative z-10">
          <div>
            <h2 className="text-xl font-bold text-orange-500 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
              Active User Jobs
            </h2>
            <p className="text-sm text-gray-400 mt-1">Terminate a job to allow the user to buy a new one.</p>
          </div>
          <div className="relative w-full md:w-72">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full p-3 pl-10 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-orange-500" />
            {!searchQuery && <span className="absolute left-10 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">Search Name or Phone...</span>}
            <svg className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar relative z-10">
          <table className="w-full text-left text-sm text-gray-300 min-w-[600px]">
            <thead className="bg-[#0B0F19] text-[10px] uppercase font-bold text-gray-500">
              <tr>
                <th className="px-4 py-4 rounded-l-xl">User</th>
                <th className="px-4 py-4">Active Job</th>
                <th className="px-4 py-4 text-right rounded-r-xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {currentActiveJobs.map((aj: any) => (
                <tr key={aj.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-4">
                    <p className="font-bold text-white">{aj.userName}</p>
                    <p className="text-xs text-gray-400">{aj.userPhone}</p>
                  </td>
                  <td className="px-4 py-4 font-bold text-orange-400">{aj.jobName}</td>
                  <td className="px-4 py-4 text-right">
                    <button onClick={() => handleTerminate(aj.id, aj.userName)} className="bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-500/20 transition">Terminate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredActiveJobs.length === 0 && <p className="text-center py-6 text-gray-500">No active jobs found.</p>}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4 pt-4 border-t border-gray-800 relative z-10">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className="px-4 py-2 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm font-bold text-white disabled:opacity-50 hover:bg-gray-800 transition">Prev</button>
            <span className="text-sm font-bold text-gray-500">Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} className="px-4 py-2 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm font-bold text-white disabled:opacity-50 hover:bg-gray-800 transition">Next</button>
          </div>
        )}
      </div>

      {/* Create Job */}
      <div className="bg-[#131825] p-6 md:p-8 rounded-3xl border border-gray-800 relative overflow-hidden">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
          <svg className="w-5 h-5 text-[#B519FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Create New Job
        </h2>
        <form onSubmit={handleCreate} className="space-y-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <input type="text" value={newJob.name} onChange={e => setNewJob({ ...newJob, name: e.target.value })} className="w-full p-4 bg-[#0B0F19] border border-gray-700 rounded-2xl text-sm text-white outline-none focus:border-[#B519FF]" required />
              {!newJob.name && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">Job Name</span>}
            </div>
            <div className="relative">
              <input type="text" value={newJob.description} onChange={e => setNewJob({ ...newJob, description: e.target.value })} className="w-full p-4 bg-[#0B0F19] border border-gray-700 rounded-2xl text-sm text-white outline-none focus:border-[#B519FF]" required />
              {!newJob.description && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">Description</span>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <input type="number" value={newJob.price} onChange={e => setNewJob({ ...newJob, price: e.target.value })} className="w-full p-4 bg-[#0B0F19] border border-gray-700 rounded-2xl text-sm text-white outline-none focus:border-[#B519FF]" required />
              {!newJob.price && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">Price (ETB)</span>}
            </div>
            <div className="relative">
              <input type="number" value={newJob.taskCount} onChange={e => setNewJob({ ...newJob, taskCount: e.target.value })} className="w-full p-4 bg-[#0B0F19] border border-gray-700 rounded-2xl text-sm text-white outline-none focus:border-[#B519FF]" required />
              {!newJob.taskCount && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">Total Tasks</span>}
            </div>
            <div className="relative">
              <input type="number" value={newJob.rewardPerTask} onChange={e => setNewJob({ ...newJob, rewardPerTask: e.target.value })} className="w-full p-4 bg-[#0B0F19] border border-gray-700 rounded-2xl text-sm text-white outline-none focus:border-[#B519FF]" required />
              {!newJob.rewardPerTask && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">Reward/Task</span>}
            </div>
          </div>
          <button type="submit" className="w-full bg-[#B519FF] text-white p-4 rounded-2xl font-bold hover:bg-purple-600 transition shadow-[0_0_15px_rgba(181,25,255,0.3)] mt-2">Create Job</button>
        </form>
      </div>

      {/* List Jobs */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white mb-2">All Jobs</h2>
        {jobs.map((job: any) => (
          <div key={job.id} className="bg-[#131825] rounded-3xl border border-gray-800 overflow-hidden hover:border-[#B519FF]/30 transition-colors">
            {editingJob?.id === job.id ? (
              <form onSubmit={handleEdit} className="p-6 bg-[#0B0F19] space-y-4 border-b border-gray-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input type="text" value={editingJob.name} onChange={e => setEditingJob({ ...editingJob, name: e.target.value })} className="w-full p-3 bg-[#131825] border border-gray-700 rounded-xl text-sm text-white outline-none" required />
                  <input type="text" value={editingJob.description} onChange={e => setEditingJob({ ...editingJob, description: e.target.value })} className="w-full p-3 bg-[#131825] border border-gray-700 rounded-xl text-sm text-white outline-none" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input type="number" value={editingJob.price} onChange={e => setEditingJob({ ...editingJob, price: e.target.value })} className="p-3 bg-[#131825] border border-gray-700 rounded-xl text-sm text-white outline-none" required />
                  <input type="number" value={editingJob.taskCount} onChange={e => setEditingJob({ ...editingJob, taskCount: e.target.value })} className="p-3 bg-[#131825] border border-gray-700 rounded-xl text-sm text-white outline-none" required />
                  <input type="number" value={editingJob.rewardPerTask} onChange={e => setEditingJob({ ...editingJob, rewardPerTask: e.target.value })} className="p-3 bg-[#131825] border border-gray-700 rounded-xl text-sm text-white outline-none" required />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition">Save Changes</button>
                  <button type="button" onClick={() => setEditingJob(null)} className="bg-gray-800 text-gray-300 px-6 py-2 rounded-xl text-sm font-bold hover:bg-gray-700 transition">Cancel</button>
                </div>
              </form>
            ) : (
              <div className="p-6 bg-[#0B0F19] flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-gray-800">
                <div>
                  <h3 className="text-xl font-bold text-white">{job.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">Price: <span className="text-emerald-400 font-bold">ETB {job.price}</span> • Reward: <span className="text-[#B519FF] font-bold">ETB {job.rewardPerTask}</span>/task</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setEditingJob(job)} className="flex-1 md:flex-none bg-blue-500/10 text-blue-400 border border-blue-500/20 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-500/20 transition">Edit</button>
                  <button onClick={() => handleDelete(job.id)} className="flex-1 md:flex-none bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-500/20 transition">Delete</button>
                  <button onClick={() => setAddingTaskTo(job.id)} className="flex-1 md:flex-none bg-[#B519FF] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-purple-600 transition shadow-[0_0_10px_rgba(181,25,255,0.2)]">+ Legacy Task</button>
                </div>
              </div>
            )}

            {addingTaskTo === job.id && (
              <div className="p-5 bg-[#B519FF]/5 border-b border-[#B519FF]/10">
                <p className="text-[10px] text-[#B519FF] mb-3 font-bold uppercase tracking-widest">⚠️ Legacy: Adds task only to this specific job. Use "Daily Videos" for global videos.</p>
                <form onSubmit={(e) => handleAddTask(e, job.id)} className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <input type="text" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} className="w-full p-2.5 bg-[#0B0F19] border border-gray-700 rounded-lg text-sm text-white outline-none focus:border-[#B519FF]" required />
                    {!newTask.title && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">Video Title</span>}
                  </div>
                  <div className="relative flex-1">
                    <input type="url" value={newTask.youtubeUrl} onChange={e => setNewTask({ ...newTask, youtubeUrl: e.target.value })} className="w-full p-2.5 bg-[#0B0F19] border border-gray-700 rounded-lg text-sm text-white outline-none focus:border-[#B519FF]" required />
                    {!newTask.youtubeUrl && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">YouTube Link</span>}
                  </div>
                  <div className="relative w-full md:w-32">
                    <input type="number" value={newTask.fakeLikes} onChange={e => setNewTask({ ...newTask, fakeLikes: e.target.value })} className="w-full p-2.5 bg-[#0B0F19] border border-gray-700 rounded-lg text-sm text-white outline-none focus:border-[#B519FF]" />
                    {!newTask.fakeLikes && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">Likes</span>}
                  </div>
                  <button type="submit" className="bg-[#B519FF] text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-purple-600 transition">Save</button>
                </form>
              </div>
            )}

            <div className="p-6 space-y-3">
              {job.tasks.length === 0 && (
                <p className="text-sm text-gray-500 italic text-center py-4">No legacy tasks added to this job.</p>
              )}
              {job.tasks.map((task: any) => (
                <div key={task.id} className="flex flex-col sm:flex-row gap-4 p-3 bg-[#0B0F19] border border-gray-800 rounded-xl items-start sm:items-center hover:border-gray-600 transition">
                  {task.thumbnailUrl ? (
                    <img src={task.thumbnailUrl} className="w-full sm:w-24 h-32 sm:h-14 object-cover rounded-lg" alt={task.title} />
                  ) : (
                    <div className="w-full sm:w-24 h-32 sm:h-14 bg-gray-800 rounded-lg" />
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-white text-sm">{task.title}</p>
                    <a href={task.youtubeUrl} target="_blank" rel="noreferrer" className="text-xs text-[#B519FF] hover:underline mt-1 inline-block">View on YouTube ↗</a>
                  </div>
                  <div className="w-full sm:w-auto text-xs font-bold text-gray-400 bg-[#131825] px-3 py-1.5 rounded-lg border border-gray-800 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path></svg>
                    {task.fakeLikes || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {jobs.length === 0 && (
          <div className="text-center py-12 bg-[#131825] rounded-2xl border border-gray-800 border-dashed">
            <p className="text-gray-500 text-sm">No jobs created yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}