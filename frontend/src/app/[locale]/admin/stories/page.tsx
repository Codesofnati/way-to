'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminStories({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();

  const [stories, setStories] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Story Form State
  const [newStory, setNewStory] = useState({ titleAm: '', titleEn: '', contentAm: '', contentEn: '' });
  const [storyFile, setStoryFile] = useState<File | null>(null);
  const [submittingStory, setSubmittingStory] = useState(false);
  
  // Notification Form State
  const [newNotif, setNewNotif] = useState({ titleAm: '', titleEn: '', contentAm: '', contentEn: '', expiresAt: '' });
  const [notifFile, setNotifFile] = useState<File | null>(null);
  const [submittingNotif, setSubmittingNotif] = useState(false);

  // MODAL STATES
  const [viewingStory, setViewingStory] = useState<any>(null); 
  const [editingStory, setEditingStory] = useState<any>(null); 
  const [editForm, setEditForm] = useState({ titleAm: '', titleEn: '', contentAm: '', contentEn: '', imageUrl: '' });
  const [editFile, setEditFile] = useState<File | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  useEffect(() => {
    if (user.role !== 'super_admin') return router.push(`/${locale}/auth`);
    fetchData();
  }, [router, locale]);

  const fetchData = async () => {
    try {
      const [storiesRes, notifsRes] = await Promise.all([
        fetch(`${apiUrl}/api/stories`).then(r => r.json()),
        fetch(`${apiUrl}/api/super-admin/notifications`).then(r => r.json())
      ]);
      if (storiesRes.success) setStories(storiesRes.stories);
      if (notifsRes.success) setNotifications(notifsRes.notifications);
    } finally { setLoading(false); }
  };

  const uploadImage = async (file: File) => {
    const fileName = `img-${Date.now()}.${file.name.split('.').pop()}`;
    const { data, error } = await supabase.storage.from('screenshots').upload(fileName, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('screenshots').getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  // --- CREATE STORY ---
  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingStory(true);
    try {
      let imageUrl = '';
      if (storyFile) imageUrl = await uploadImage(storyFile);

      const res = await fetch(`${apiUrl}/api/super-admin/stories`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newStory, imageUrl })
      });
      if (!res.ok) throw new Error('Failed to create story');
      
      alert('Story posted!');
      setNewStory({ titleAm: '', titleEn: '', contentAm: '', contentEn: '' });
      setStoryFile(null);
      fetchData();
    } catch (err: any) { alert(err.message); }
    finally { setSubmittingStory(false); }
  };

  // --- CREATE NOTIFICATION ---
  const handleCreateNotif = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingNotif(true);
    try {
      let imageUrl = '';
      if (notifFile) imageUrl = await uploadImage(notifFile);

      const res = await fetch(`${apiUrl}/api/super-admin/notifications`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newNotif, imageUrl })
      });
      if (!res.ok) throw new Error('Failed to create notification');
      
      alert('Notification sent!');
      setNewNotif({ titleAm: '', titleEn: '', contentAm: '', contentEn: '', expiresAt: '' });
      setNotifFile(null);
      fetchData(); 
    } catch (err: any) { alert(err.message); }
    finally { setSubmittingNotif(false); }
  };

  // --- DELETE STORY ---
  const handleDeleteStory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this story?')) return;
    try {
      await fetch(`${apiUrl}/api/super-admin/stories/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  // --- DELETE NOTIFICATION ---
  const handleDeleteNotif = async (id: string) => {
    if (!confirm('Are you sure you want to delete this popup notification?')) return;
    try {
      await fetch(`${apiUrl}/api/super-admin/notifications/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  // --- EDIT STORY ---
  const openEditModal = (story: any) => {
    setEditingStory(story);
    setEditForm({
      titleAm: story.titleAm,
      titleEn: story.titleEn,
      contentAm: story.contentAm,
      contentEn: story.contentEn,
      imageUrl: story.imageUrl || ''
    });
    setEditFile(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      let finalImageUrl = editForm.imageUrl;
      if (editFile) finalImageUrl = await uploadImage(editFile);

      const res = await fetch(`${apiUrl}/api/super-admin/stories/${editingStory.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, imageUrl: finalImageUrl })
      });
      if (!res.ok) throw new Error('Failed to update story');
      
      alert('Story updated!');
      setEditingStory(null);
      fetchData();
    } catch (err: any) { alert(err.message); }
    finally { setSavingEdit(false); }
  };

  if (loading) return <div className="text-white p-10 text-center">Loading...</div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      
      {/* FORM SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* CREATE STORY */}
        <div className="bg-[#131825] p-6 rounded-3xl border border-gray-800 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#B519FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
            Post New Story
          </h2>
          <form onSubmit={handleCreateStory} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Title (Am)" value={newStory.titleAm} onChange={e => setNewStory({...newStory, titleAm: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-white text-sm outline-none focus:border-[#B519FF]" required />
              <input type="text" placeholder="Title (En)" value={newStory.titleEn} onChange={e => setNewStory({...newStory, titleEn: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-white text-sm outline-none focus:border-[#B519FF]" required />
            </div>
            <textarea placeholder="Content (Am)" value={newStory.contentAm} onChange={e => setNewStory({...newStory, contentAm: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-white text-sm h-24 outline-none focus:border-[#B519FF]" required />
            <textarea placeholder="Content (En)" value={newStory.contentEn} onChange={e => setNewStory({...newStory, contentEn: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-white text-sm h-24 outline-none focus:border-[#B519FF]" required />
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Story Image</label>
              <input type="file" accept="image/*" onChange={e => setStoryFile(e.target.files?.[0] || null)} className="w-full p-2 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#B519FF]/10 file:text-[#B519FF]" />
            </div>
            <button type="submit" disabled={submittingStory} className="w-full bg-[#B519FF] text-white p-3 rounded-xl font-bold hover:bg-purple-600 transition disabled:opacity-50">
              {submittingStory ? 'Posting...' : 'Post Story'}
            </button>
          </form>
        </div>

        {/* CREATE NOTIFICATION */}
        <div className="bg-[#131825] p-6 rounded-3xl border border-[#B519FF]/30 shadow-[0_0_30px_rgba(181,25,255,0.05)]">
          <h2 className="text-xl font-bold text-[#B519FF] mb-6 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            Send Popup Modal
          </h2>
          <form onSubmit={handleCreateNotif} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Title (Am)" value={newNotif.titleAm} onChange={e => setNewNotif({...newNotif, titleAm: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-white text-sm outline-none focus:border-[#B519FF]" />
              <input type="text" placeholder="Title (En)" value={newNotif.titleEn} onChange={e => setNewNotif({...newNotif, titleEn: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-white text-sm outline-none focus:border-[#B519FF]" />
            </div>
            <textarea placeholder="Content (Am)" value={newNotif.contentAm} onChange={e => setNewNotif({...newNotif, contentAm: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-white text-sm h-20 outline-none focus:border-[#B519FF]" />
            <textarea placeholder="Content (En)" value={newNotif.contentEn} onChange={e => setNewNotif({...newNotif, contentEn: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-white text-sm h-20 outline-none focus:border-[#B519FF]" />
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Modal Image</label>
              <input type="file" accept="image/*" onChange={e => setNotifFile(e.target.files?.[0] || null)} className="w-full p-2 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#B519FF]/10 file:text-[#B519FF]" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Expiry Date</label>
              <input type="date" value={newNotif.expiresAt} onChange={e => setNewNotif({...newNotif, expiresAt: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-white text-sm outline-none focus:border-[#B519FF] color-scheme-dark" required />
            </div>
            <button type="submit" disabled={submittingNotif} className="w-full bg-[#B519FF] text-white p-3 rounded-xl font-bold hover:bg-purple-600 transition disabled:opacity-50">
              {submittingNotif ? 'Sending...' : 'Send Modal'}
            </button>
          </form>
        </div>
      </div>

      {/* RECENT STORIES LIST */}
      <div className="bg-[#131825] p-6 rounded-3xl border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-6">Recent Stories</h2>
        
        {stories.length === 0 ? (
          <p className="text-gray-500">No stories posted yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stories.map(story => (
              <div key={story.id} className="bg-[#0B0F19] rounded-2xl p-4 border border-gray-800 flex flex-col group">
                {story.imageUrl && (
                  <div className="h-32 w-full rounded-xl overflow-hidden mb-3 border border-gray-800">
                    <img src={story.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" alt="Story" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-bold text-white text-sm line-clamp-1">{story.titleEn}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{story.titleAm}</p>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{story.contentEn}</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <button 
                    onClick={() => setViewingStory(story)} 
                    className="flex-1 bg-gray-800 text-gray-300 border border-gray-700 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-700 transition"
                  >
                    View
                  </button>
                  <button 
                    onClick={() => openEditModal(story)} 
                    className="flex-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-500/20 transition"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteStory(story.id)} 
                    className="flex-1 bg-red-500/10 text-red-400 border border-red-500/20 py-1.5 rounded-lg text-xs font-bold hover:bg-red-500/20 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RECENT NOTIFICATIONS */}
      <div className="bg-[#131825] p-6 rounded-3xl border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-6">Sent Popup Notifications</h2>
        
        {notifications.length === 0 ? (
          <p className="text-gray-500">No popup notifications sent yet.</p>
        ) : (
          <div className="space-y-3">
            {notifications.map(notif => (
              <div key={notif.id} className="bg-[#0B0F19] rounded-xl p-4 border border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex gap-4 items-center">
                  {notif.imageUrl && (
                    <img src={notif.imageUrl} className="w-16 h-16 rounded-lg object-cover border border-gray-700" />
                  )}
                  <div>
                    <p className="font-bold text-white text-sm">{notif.titleEn || 'No Title'}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{notif.titleAm}</p>
                    <p className="text-xs text-gray-500 line-clamp-1 mt-1">{notif.contentEn}</p>
                    <p className="text-[10px] text-orange-400 font-bold mt-1">
                      Expires: {new Date(notif.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button onClick={() => handleDeleteNotif(notif.id)} className="bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-500/20 transition shrink-0">
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VIEW STORY MODAL */}
      {viewingStory && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#131825] rounded-3xl border border-gray-700 shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#0B0F19]">
              <h2 className="text-lg font-bold text-white">View Story</h2>
              <button onClick={() => setViewingStory(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:text-white transition text-xl font-bold">&times;</button>
            </div>
            <div className="overflow-y-auto custom-scrollbar">
              {viewingStory.imageUrl && (
                <img src={viewingStory.imageUrl} className="w-full h-56 object-cover" />
              )}
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{viewingStory.titleEn}</h3>
                  <h4 className="text-sm font-bold text-gray-400 mt-1">{viewingStory.titleAm}</h4>
                </div>
                <div className="bg-[#0B0F19] p-4 rounded-xl border border-gray-800 space-y-4">
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">English Content</p>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{viewingStory.contentEn}</p>
                  </div>
                  <div className="border-t border-gray-800 pt-4">
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Amharic Content</p>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{viewingStory.contentAm}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT STORY MODAL */}
      {editingStory && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#131825] rounded-3xl border border-orange-500/50 shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#0B0F19]">
              <h2 className="text-lg font-bold text-orange-400">Edit Story</h2>
              <button onClick={() => setEditingStory(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:text-white transition text-xl font-bold">&times;</button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="overflow-y-auto custom-scrollbar flex-1">
              <div className="p-6 space-y-4">
                {editForm.imageUrl && !editFile && (
                  <img src={editForm.imageUrl} className="w-full h-32 object-cover rounded-xl border border-gray-700" />
                )}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Change Image (Optional)</label>
                  <input type="file" accept="image/*" onChange={e => setEditFile(e.target.files?.[0] || null)} className="w-full p-2 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-orange-500/10 file:text-orange-400" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Title (En)</label>
                    <input type="text" value={editForm.titleEn} onChange={e => setEditForm({...editForm, titleEn: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-white text-sm" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Title (Am)</label>
                    <input type="text" value={editForm.titleAm} onChange={e => setEditForm({...editForm, titleAm: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-white text-sm" required />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Content (En)</label>
                  <textarea value={editForm.contentEn} onChange={e => setEditForm({...editForm, contentEn: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-white text-sm h-24" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Content (Am)</label>
                  <textarea value={editForm.contentAm} onChange={e => setEditForm({...editForm, contentAm: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-white text-sm h-24" required />
                </div>
              </div>
              
              <div className="p-4 bg-[#0B0F19] border-t border-gray-800">
                <button type="submit" disabled={savingEdit} className="w-full bg-orange-500 text-white p-3 rounded-xl font-bold hover:bg-orange-600 transition disabled:opacity-50">
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}