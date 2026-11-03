'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase'; // ✅ Make sure this is imported

export default function AdminStories({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();

  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Story State
  const [newStory, setNewStory] = useState({ titleAm: '', titleEn: '', contentAm: '', contentEn: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  // Notification State
  const [newNotif, setNewNotif] = useState({ titleAm: '', titleEn: '', contentAm: '', contentEn: '', expiresAt: '' });

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
    const fileName = `story-${Date.now()}.${file.name.split('.').pop()}`;
    const { data, error } = await supabase.storage.from('screenshots').upload(fileName, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('screenshots').getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let imageUrl = '';
      if (imageFile) imageUrl = await uploadImage(imageFile);

      const res = await fetch(`${apiUrl}/api/super-admin/stories`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newStory, imageUrl })
      });
      if (!res.ok) throw new Error('Failed to create story');
      
      alert('Story posted!');
      setNewStory({ titleAm: '', titleEn: '', contentAm: '', contentEn: '' });
      setImageFile(null);
      fetchStories();
    } catch (err: any) { alert(err.message); }
  };

  const handleCreateNotif = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/notifications`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotif)
      });
      if (!res.ok) throw new Error('Failed to create notification');
      
      alert('Notification sent! It will show to users until the expiry date.');
      setNewNotif({ titleAm: '', titleEn: '', contentAm: '', contentEn: '', expiresAt: '' });
    } catch (err: any) { alert(err.message); }
  };

  const handleDeleteStory = async (id: string) => {
    if (!confirm('Delete this story?')) return;
    await fetch(`${apiUrl}/api/super-admin/stories/${id}`, { method: 'DELETE' });
    fetchStories();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ✅ CREATE STORY */}
        <div className="bg-[#131825] p-6 rounded-3xl border border-gray-800 relative overflow-hidden">
          <h2 className="text-xl font-bold text-white mb-6">Post New Story</h2>
          <form onSubmit={handleCreateStory} className="space-y-4 relative z-10">
            <input type="text" placeholder="Title (Amharic)" value={newStory.titleAm} onChange={e => setNewStory({...newStory, titleAm: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-white" required />
            <input type="text" placeholder="Title (English)" value={newStory.titleEn} onChange={e => setNewStory({...newStory, titleEn: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-white" required />
            <textarea placeholder="Content (Amharic)" value={newStory.contentAm} onChange={e => setNewStory({...newStory, contentAm: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-white h-24" required />
            <textarea placeholder="Content (English)" value={newStory.contentEn} onChange={e => setNewStory({...newStory, contentEn: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-white h-24" required />
            
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2">Upload Image (Optional)</label>
              <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="w-full p-2 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#B519FF]/10 file:text-[#B519FF]" />
            </div>

            <button type="submit" className="w-full bg-[#B519FF] text-white p-3 rounded-xl font-bold">Post Story</button>
          </form>
        </div>

        {/* ✅ CREATE GLOBAL NOTIFICATION */}
        <div className="bg-[#131825] p-6 rounded-3xl border border-[#B519FF]/30 relative overflow-hidden">
          <h2 className="text-xl font-bold text-[#B519FF] mb-6">Send Global Popup Notification</h2>
          <form onSubmit={handleCreateNotif} className="space-y-4 relative z-10">
            <input type="text" placeholder="Title (Amharic)" value={newNotif.titleAm} onChange={e => setNewNotif({...newNotif, titleAm: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-white" required />
            <input type="text" placeholder="Title (English)" value={newNotif.titleEn} onChange={e => setNewNotif({...newNotif, titleEn: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-white" required />
            <textarea placeholder="Content (Amharic)" value={newNotif.contentAm} onChange={e => setNewNotif({...newNotif, contentAm: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-white h-20" required />
            <textarea placeholder="Content (English)" value={newNotif.contentEn} onChange={e => setNewNotif({...newNotif, contentEn: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-white h-20" required />
            
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2">Show Until (Expiry Date)</label>
              <input type="date" value={newNotif.expiresAt} onChange={e => setNewNotif({...newNotif, expiresAt: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-white" required />
            </div>

            <button type="submit" className="w-full bg-[#B519FF] text-white p-3 rounded-xl font-bold">Send Notification</button>
          </form>
        </div>
      </div>

      {/* List Stories */}
      <div className="bg-[#131825] p-6 rounded-3xl border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-6">Recent Stories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stories.map(story => (
            <div key={story.id} className="bg-[#0B0F19] rounded-2xl p-4 border border-gray-800">
              {story.imageUrl && <img src={story.imageUrl} className="w-full h-32 object-cover rounded-xl mb-3" />}
              <p className="font-bold text-white text-sm">{story.titleEn}</p>
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{story.contentEn}</p>
              <button onClick={() => handleDeleteStory(story.id)} className="mt-3 text-xs text-red-400 hover:text-red-300">Delete</button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}