'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminStories({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();

  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Story State
  const [newStory, setNewStory] = useState({ titleAm: '', titleEn: '', contentAm: '', contentEn: '' });
  const [storyFile, setStoryFile] = useState<File | null>(null);
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null); // ✅ Track editing
  const [existingImageUrl, setExistingImageUrl] = useState(''); // ✅ Track current image
  
  // Notification State
  const [newNotif, setNewNotif] = useState({ titleAm: '', titleEn: '', contentAm: '', contentEn: '', expiresAt: '' });
  const [notifFile, setNotifFile] = useState<File | null>(null);

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  useEffect(() => {
    if (user.role !== 'super_admin') return router.push(`/${locale}/auth`);
    fetchStories();
  }, [router, locale]);

  const fetchStories = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/stories`);
      const data = await res.json();
      if (data.success) setStories(data.stories);
    } finally { setLoading(false); }
  };

  const uploadImage = async (file: File) => {
    const fileName = `img-${Date.now()}.${file.name.split('.').pop()}`;
    const { data, error } = await supabase.storage.from('screenshots').upload(fileName, file);
    if (error) throw error;
    const { data: urlData } = await supabase.storage.from('screenshots').getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const handleCreateOrUpdateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let imageUrl = existingImageUrl;
      if (storyFile) imageUrl = await uploadImage(storyFile);

      const method = editingStoryId ? 'PUT' : 'POST';
      const url = editingStoryId 
        ? `${apiUrl}/api/super-admin/stories/${editingStoryId}` 
        : `${apiUrl}/api/super-admin/stories`;

      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newStory, imageUrl })
      });
      if (!res.ok) throw new Error('Failed to save story');
      
      alert(editingStoryId ? 'Story updated!' : 'Story posted!');
      resetStoryForm();
      fetchStories();
    } catch (err: any) { alert(err.message); }
  };

  const handleEditClick = (story: any) => {
    setNewStory({
      titleAm: story.titleAm,
      titleEn: story.titleEn,
      contentAm: story.contentAm,
      contentEn: story.contentEn
    });
    setEditingStoryId(story.id);
    setExistingImageUrl(story.imageUrl || '');
    setStoryFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetStoryForm = () => {
    setNewStory({ titleAm: '', titleEn: '', contentAm: '', contentEn: '' });
    setStoryFile(null);
    setEditingStoryId(null);
    setExistingImageUrl('');
  };

  const handleDeleteStory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this story?')) return;
    await fetch(`${apiUrl}/api/super-admin/stories/${id}`, { method: 'DELETE' });
    fetchStories();
  };

  const handleCreateNotif = async (e: React.FormEvent) => {
    e.preventDefault();
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
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div className="text-white p-10 text-center">Loading...</div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ✅ CREATE / EDIT STORY */}
        <div className={`bg-[#131825] p-6 rounded-3xl border transition-colors ${editingStoryId ? 'border-orange-500' : 'border-gray-800'} shadow-lg`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">
              {editingStoryId ? 'Edit Story' : 'Post New Story'}
            </h2>
            {editingStoryId && (
              <button onClick={resetStoryForm} className="text-xs text-gray-400 hover:text-white underline">Cancel Edit</button>
            )}
          </div>
          
          <form onSubmit={handleCreateOrUpdateStory} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Title (Am)" value={newStory.titleAm} onChange={e => setNewStory({...newStory, titleAm: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-white text-sm" required />
              <input type="text" placeholder="Title (En)" value={newStory.titleEn} onChange={e => setNewStory({...newStory, titleEn: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-white text-sm" required />
            </div>
            <textarea placeholder="Content (Am)" value={newStory.contentAm} onChange={e => setNewStory({...newStory, contentAm: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-white text-sm h-24" required />
            <textarea placeholder="Content (En)" value={newStory.contentEn} onChange={e => setNewStory({...newStory, contentEn: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-white text-sm h-24" required />
            
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Story Image</label>
              {existingImageUrl && !storyFile && (
                <div className="mb-2">
                  <img src={existingImageUrl} className="h-20 rounded-lg object-cover border border-gray-700" />
                </div>
              )}
              <input type="file" accept="image/*" onChange={e => setStoryFile(e.target.files?.[0] || null)} className="w-full p-2 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#B519FF]/10 file:text-[#B519FF]" />
            </div>
            
            <button type="submit" className={`w-full text-white p-3 rounded-xl font-bold transition ${editingStoryId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-[#B519FF] hover:bg-purple-600'}`}>
              {editingStoryId ? 'Save Changes' : 'Post Story'}
            </button>
          </form>
        </div>

        {/* ✅ CREATE GLOBAL NOTIFICATION */}
        <div className="bg-[#131825] p-6 rounded-3xl border border-[#B519FF]/30 shadow-[0_0_30px_rgba(181,25,255,0.05)]">
          <h2 className="text-xl font-bold text-[#B519FF] mb-6">Send Popup Modal</h2>
          <form onSubmit={handleCreateNotif} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Title (Am)" value={newNotif.titleAm} onChange={e => setNewNotif({...newNotif, titleAm: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-white text-sm" required />
              <input type="text" placeholder="Title (En)" value={newNotif.titleEn} onChange={e => setNewNotif({...newNotif, titleEn: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-white text-sm" required />
            </div>
            <textarea placeholder="Content (Am)" value={newNotif.contentAm} onChange={e => setNewNotif({...newNotif, contentAm: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-white text-sm h-20" required />
            <textarea placeholder="Content (En)" value={newNotif.contentEn} onChange={e => setNewNotif({...newNotif, contentEn: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-white text-sm h-20" required />
            
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Modal Image (Banner)</label>
              <input type="file" accept="image/*" onChange={e => setNotifFile(e.target.files?.[0] || null)} className="w-full p-2 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#B519FF]/10 file:text-[#B519FF]" />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Expiry Date</label>
              <input type="date" value={newNotif.expiresAt} onChange={e => setNewNotif({...newNotif, expiresAt: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-white text-sm" required />
            </div>
            <button type="submit" className="w-full bg-[#B519FF] text-white p-3 rounded-xl font-bold hover:bg-purple-600 transition">Send Modal</button>
          </form>
        </div>
      </div>

      {/* ✅ VIEW & DELETE STORIES */}
      <div className="bg-[#131825] p-6 rounded-3xl border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-6">Recent Stories</h2>
        
        {stories.length === 0 ? (
          <p className="text-gray-500">No stories posted yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stories.map(story => (
              <div key={story.id} className="bg-[#0B0F19] rounded-2xl p-4 border border-gray-800 flex flex-col">
                {story.imageUrl && (
                  <img src={story.imageUrl} className="w-full h-32 object-cover rounded-xl mb-3" alt="Story" />
                )}
                <div className="flex-1">
                  <p className="font-bold text-white text-sm line-clamp-1">{story.titleEn}</p>
                  <p className="font-bold text-gray-400 text-xs mt-0.5 line-clamp-1">{story.titleAm}</p>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{story.contentEn}</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <button 
                    onClick={() => handleEditClick(story)} 
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

    </div>
  );
}