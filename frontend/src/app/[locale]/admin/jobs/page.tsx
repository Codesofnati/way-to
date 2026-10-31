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

  // Daily video state
  const [newVideo, setNewVideo] = useState({ title: '', youtubeUrl: '', fakeLikes: '0', scheduledDate: '' });
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
      setNewVideo({ title: '', youtubeUrl: '', fakeLikes: '0', scheduledDate: '' });
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

  if (loading) return <div className="p-8 text-center text-gray-400">Loading...</div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <h1 className="text-4xl font-extrabold tracking-tight text-white">Job Management</h1>

      {/* ✅ YouTube Channel Link Settings */}
      <div className="bg-[#131825] p-6 rounded-3xl shadow-none border border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-red-400 flex items-center gap-2">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
            YouTube Subscribe Link
          </h2>
          <p className="text-sm text-gray-400">Users must click this link to subscribe before completing tasks.</p>
        </div>

        {isEditingYt ? (
          <form onSubmit={handleSaveYoutube} className="flex-1 flex gap-2 w-full max-w-md">
            <input 
              type="url" 
              value={tempYtUrl} 
              onChange={e => setTempYtUrl(e.target.value)} 
              placeholder="https://youtube.com/@yourchannel"
              className="flex-1 p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-[#B519FF]" 
              required 
            />
            <button type="submit" className="bg-[#B519FF] text-white px-4 py-2 rounded-xl font-bold">Save</button>
            <button type="button" onClick={() => setIsEditingYt(false)} className="bg-gray-800 px-4 py-2 rounded-xl font-bold">Cancel</button>
          </form>
        ) : (
          <div className="flex items-center gap-3 w-full md:w-auto">
            {youtubeUrl ? (
              <>
                <a href={youtubeUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline truncate max-w-[200px]">
                  {youtubeUrl}
                </a>
                <button onClick={() => { setTempYtUrl(youtubeUrl); setIsEditingYt(true); }} className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-lg text-xs font-bold">Edit</button>
                <button onClick={handleDeleteYoutube} className="bg-red-500/10 text-red-400 px-3 py-1 rounded-lg text-xs font-bold">Delete</button>
              </>
            ) : (
              <button onClick={() => { setTempYtUrl(''); setIsEditingYt(true); }} className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-sm">
                + Add YouTube Link
              </button>
            )}
          </div>
        )}
      </div>

      {/* ✅ GLOBAL DAILY VIDEOS */}
      <div className="bg-[#131825] p-8 rounded-3xl shadow-none border border-gray-800">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#B519FF]">📺 Daily Videos (All Jobs)</h2>
            <p className="text-sm text-gray-400">
              These videos are shown to every user who holds a job. Each user earns their job's <strong> reward per task</strong> for each video.
            </p>
          </div>
          <button
            onClick={() => setShowBulk(!showBulk)}
            className="bg-[#B519FF]/10 text-[#B519FF] px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#B519FF]/20"
          >
            {showBulk ? 'Single Entry' : '⚡ Bulk Paste URLs'}
          </button>
        </div>

        {!showBulk ? (
          <form onSubmit={handleAddVideo} className="flex flex-col md:flex-row gap-2 mb-6">
            <input type="text" placeholder="Video Title" value={newVideo.title} onChange={e => setNewVideo({ ...newVideo, title: e.target.value })} className="flex-1 p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-[#B519FF]" required />
            <input type="url" placeholder="YouTube URL" value={newVideo.youtubeUrl} onChange={e => setNewVideo({ ...newVideo, youtubeUrl: e.target.value })} className="flex-1 p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-[#B519FF]" required />
            <input type="number" placeholder="Fake Likes" value={newVideo.fakeLikes} onChange={e => setNewVideo({ ...newVideo, fakeLikes: e.target.value })} className="w-full md:w-32 p-3 bg-[#0B0F19] border border-gray-700 rounded-xl" />
            <input type="date" value={newVideo.scheduledDate} onChange={e => setNewVideo({ ...newVideo, scheduledDate: e.target.value })} className="w-full md:w-44 p-3 bg-[#0B0F19] border border-gray-700 rounded-xl" />
            <button type="submit" className="bg-[#B519FF] text-white px-6 py-3 rounded-xl font-bold">+ Add Video</button>
          </form>
        ) : (
          <form onSubmit={handleBulkAdd} className="space-y-3 mb-6 p-4 bg-[#0B0F19] rounded-2xl border border-gray-800">
            <p className="text-xs font-bold text-[#B519FF]">Paste one YouTube URL per line (3 videos = 3 lines):</p>
            <textarea value={bulkUrls} onChange={e => setBulkUrls(e.target.value)} placeholder={'https://youtube.com/watch?v=abc123\nhttps://youtube.com/watch?v=def456\nhttps://youtube.com/watch?v=ghi789'} className="w-full p-3 bg-[#131825] border border-gray-700 rounded-xl font-mono text-sm h-32" required />
            <div className="flex gap-2">
              <input type="date" value={bulkDate} onChange={e => setBulkDate(e.target.value)} className="flex-1 p-3 bg-[#131825] border border-gray-700 rounded-xl" />
              <button type="submit" className="bg-[#B519FF] text-white px-6 py-3 rounded-xl font-bold whitespace-nowrap">⚡ Add All URLs</button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {dailyVideos.length === 0 && <p className="text-center text-gray-400 py-6">No videos uploaded yet.</p>}
          {dailyVideos.map((v: any) => (
            <div key={v.id} className="flex items-center gap-4 p-3 bg-[#0B0F19] rounded-xl border">
              {v.thumbnailUrl ? <img src={v.thumbnailUrl} className="w-20 h-12 object-cover rounded-md" alt={v.title} /> : <div className="w-20 h-12 bg-gray-800 rounded-md" />}
              <div className="flex-1">
                <p className="font-bold text-sm">{v.title}</p>
                <p className="text-xs text-gray-400">📅 {v.scheduledDate} • ❤️ {v.fakeLikes || 0} likes • <a href={v.youtubeUrl} target="_blank" rel="noreferrer" className="text-blue-500 underline">Open</a></p>
              </div>
              <button onClick={() => handleDeleteVideo(v.id)} className="bg-red-500/10 text-red-400 px-3 py-1 rounded-lg text-xs font-bold">Delete</button>
            </div>
          ))}
        </div>
      </div>

      {/* Active User Jobs Section */}
      <div className="bg-[#131825] p-8 rounded-3xl shadow-none border border-gray-800">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#B519FF]">Active User Jobs</h2>
            <p className="text-sm text-gray-400">Terminate a job to allow the user to buy a new one.</p>
          </div>
          <input type="text" placeholder="Search by Name or Phone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full md:w-64 p-3 bg-[#0B0F19] border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-[#B519FF]" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-[#0B0F19] text-xs uppercase font-bold text-gray-400">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Active Job</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentActiveJobs.map((aj: any) => (
                <tr key={aj.id} className="hover:bg-[#0B0F19]">
                  <td className="px-4 py-3">
                    <p className="font-bold text-white">{aj.userName}</p>
                    <p className="text-xs text-gray-400">{aj.userPhone}</p>
                  </td>
                  <td className="px-4 py-3 font-medium text-[#B519FF]">{aj.jobName}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleTerminate(aj.id, aj.userName)} className="bg-red-500/10 text-red-400 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-500/10 transition">Terminate Job</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredActiveJobs.length === 0 && <p className="text-center py-6 text-gray-400">No active jobs found.</p>}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4 pt-4 border-t border-gray-800">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className="px-4 py-2 bg-[#0B0F19] rounded-xl text-sm font-bold disabled:opacity-50">Prev</button>
            <span className="text-sm font-bold text-gray-400">Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} className="px-4 py-2 bg-[#0B0F19] rounded-xl text-sm font-bold disabled:opacity-50">Next</button>
          </div>
        )}
      </div>

      {/* Create Job */}
      <div className="bg-[#131825] p-8 rounded-3xl shadow-none border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-6">Create New Job</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <input type="text" placeholder="Job Name" value={newJob.name} onChange={e => setNewJob({ ...newJob, name: e.target.value })} className="w-full p-4 bg-[#0B0F19] border border-gray-700 rounded-2xl" required />
          <textarea placeholder="Description" value={newJob.description} onChange={e => setNewJob({ ...newJob, description: e.target.value })} className="w-full p-4 bg-[#0B0F19] border border-gray-700 rounded-2xl" required />
          <div className="grid grid-cols-3 gap-4">
            <input type="number" placeholder="Price (ETB)" value={newJob.price} onChange={e => setNewJob({ ...newJob, price: e.target.value })} className="w-full p-4 bg-[#0B0F19] border border-gray-700 rounded-2xl" required />
            <input type="number" placeholder="Total Tasks" value={newJob.taskCount} onChange={e => setNewJob({ ...newJob, taskCount: e.target.value })} className="w-full p-4 bg-[#0B0F19] border border-gray-700 rounded-2xl" required />
            <input type="number" placeholder="Reward/Task" value={newJob.rewardPerTask} onChange={e => setNewJob({ ...newJob, rewardPerTask: e.target.value })} className="w-full p-4 bg-[#0B0F19] border border-gray-700 rounded-2xl" required />
          </div>
          <button type="submit" className="w-full bg-black text-white p-4 rounded-2xl font-bold">Create Job</button>
        </form>
      </div>

      {/* List Jobs */}
      <div className="space-y-6">
        {jobs.map((job: any) => (
          <div key={job.id} className="bg-[#131825] rounded-3xl shadow-none border border-gray-800 overflow-hidden">
            {editingJob?.id === job.id ? (
              <form onSubmit={handleEdit} className="p-6 bg-[#0B0F19] space-y-4">
                <input type="text" value={editingJob.name} onChange={e => setEditingJob({ ...editingJob, name: e.target.value })} className="w-full p-3 border border-gray-700 rounded-xl" required />
                <input type="text" value={editingJob.description} onChange={e => setEditingJob({ ...editingJob, description: e.target.value })} className="w-full p-3 border border-gray-700 rounded-xl" required />
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" value={editingJob.price} onChange={e => setEditingJob({ ...editingJob, price: e.target.value })} className="p-3 border border-gray-700 rounded-xl" required />
                  <input type="number" value={editingJob.taskCount} onChange={e => setEditingJob({ ...editingJob, taskCount: e.target.value })} className="p-3 border border-gray-700 rounded-xl" required />
                  <input type="number" value={editingJob.rewardPerTask} onChange={e => setEditingJob({ ...editingJob, rewardPerTask: e.target.value })} className="p-3 border border-gray-700 rounded-xl" required />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="bg-[#B519FF] text-white px-4 py-2 rounded-xl font-bold">Save</button>
                  <button type="button" onClick={() => setEditingJob(null)} className="bg-gray-800 px-4 py-2 rounded-xl font-bold">Cancel</button>
                </div>
              </form>
            ) : (
              <div className="p-6 bg-[#0B0F19] flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">{job.name}</h3>
                  <p className="text-sm text-gray-400">Price: ETB {job.price} • Reward: ETB {job.rewardPerTask}/task</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingJob(job)} className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-lg text-xs font-bold">Edit</button>
                  <button onClick={() => handleDelete(job.id)} className="bg-red-500/10 text-red-400 px-3 py-1 rounded-lg text-xs font-bold">Delete</button>
                  <button onClick={() => setAddingTaskTo(job.id)} className="bg-[#B519FF] text-white px-3 py-1 rounded-lg text-xs font-bold">+ Legacy Task</button>
                </div>
              </div>
            )}

            {addingTaskTo === job.id && (
              <div className="p-4 bg-[#0B0F19]">
                <p className="text-xs text-[#B519FF] mb-2 font-bold">⚠️ Legacy: Adds task only to this specific job. Use "Daily Videos" for global videos.</p>
                <form onSubmit={(e) => handleAddTask(e, job.id)} className="flex flex-col md:flex-row gap-2">
                  <input type="text" placeholder="Video Title" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} className="flex-1 p-2 border border-gray-700 rounded-lg" required />
                  <input type="url" placeholder="YouTube Link" value={newTask.youtubeUrl} onChange={e => setNewTask({ ...newTask, youtubeUrl: e.target.value })} className="flex-1 p-2 border border-gray-700 rounded-lg" required />
                  <input type="number" placeholder="Fake Likes" value={newTask.fakeLikes} onChange={e => setNewTask({ ...newTask, fakeLikes: e.target.value })} className="w-full md:w-32 p-2 border border-gray-700 rounded-lg" />
                  <button type="submit" className="bg-[#B519FF] text-white px-4 py-2 rounded-lg font-bold">Save</button>
                </form>
              </div>
            )}

            <div className="p-6 space-y-2">
              {job.tasks.map((task: any) => (
                <div key={task.id} className="flex gap-4 p-2 bg-[#0B0F19] border border-gray-700 rounded-xl items-center">
                  {task.thumbnailUrl && <img src={task.thumbnailUrl} className="w-24 h-14 object-cover rounded-md" alt={task.title} />}
                  <div className="flex flex-col justify-center">
                    <span className="font-bold text-sm">{task.title}</span>
                    <a href={task.youtubeUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500">View on YouTube</a>
                  </div>
                  <div className="ml-auto text-xs font-bold text-gray-400 bg-[#131825] px-3 py-1 rounded-md border">❤️ {task.fakeLikes || 0} Likes</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}