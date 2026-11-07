'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminAppSettings({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profitImages, setProfitImages] = useState<string[]>([]);
  const [vipImages, setVipImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // ✅ New Top Banner State
  const [banner, setBanner] = useState({ title: '', subtitle: '', imageUrl: '' });
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  useEffect(() => {
    if (user.role !== 'super_admin') return router.push(`/${locale}/auth`);
    fetchSettings();
    fetchBanner();
  }, [router, locale]);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/app-settings`);
      const data = await res.json();
      if (data.success) {
        setProfitImages(data.settings.profitImages || []);
        setVipImages(data.settings.vipImages || []);
      }
    } finally { setLoading(false); }
  };

  // ✅ Fetch current banner
  const fetchBanner = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/top-banner`);
      const data = await res.json();
      if (data.success && data.banner) {
        setBanner({
          title: data.banner.title || '',
          subtitle: data.banner.subtitle || '',
          imageUrl: data.banner.imageUrl || ''
        });
      }
    } catch (err) { console.error(err); }
  };

  const uploadImage = async (file: File) => {
    const fileName = `app-${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
    const { data, error } = await supabase.storage.from('screenshots').upload(fileName, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('screenshots').getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  // ✅ Upload Banner Image
  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setSaving(true);
      const url = await uploadImage(file);
      setBanner({ ...banner, imageUrl: url });
    } catch (err: any) { alert(err.message); } 
    finally { setSaving(false); e.target.value = ''; }
  };

  // ✅ Save Banner
  const handleSaveBanner = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/top-banner`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(banner)
      });
      if (!res.ok) throw new Error('Failed to save banner');
      alert('Banner saved!');
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  // ✅ Delete Banner
  const handleDeleteBanner = async () => {
    if (!confirm('Are you sure you want to remove the top banner?')) return;
    setSaving(true);
    try {
      await fetch(`${apiUrl}/api/super-admin/top-banner`, { method: 'DELETE' });
      setBanner({ title: '', subtitle: '', imageUrl: '' });
      alert('Banner removed!');
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleUploadProfit = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setSaving(true);
      const url = await uploadImage(file);
      setProfitImages([...profitImages, url]);
    } catch (err: any) { alert(err.message); } 
    finally { setSaving(false); e.target.value = ''; }
  };

  const handleUploadVip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setSaving(true);
      const url = await uploadImage(file);
      setVipImages([...vipImages, url]);
    } catch (err: any) { alert(err.message); } 
    finally { setSaving(false); e.target.value = ''; }
  };

  const handleSaveImages = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/app-settings`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profitImages, vipImages })
      });
      if (!res.ok) throw new Error('Failed to save');
      alert('App Images Saved!');
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="text-white p-10 text-center">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-white mb-2">App Settings</h1>
        <p className="text-gray-400">Manage the top banner, Profit, and VIP images.</p>
      </div>

      <div className="bg-[#131825] p-6 md:p-8 rounded-3xl border border-gray-800 space-y-8">
        
        {/* ✅ TOP BANNER SECTION */}
        <div className="border-b border-gray-700 pb-8">
          <h2 className="text-xl font-bold text-white mb-4">Top Banner (Above About Us)</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Title (Optional)</label>
                <input type="text" value={banner.title} onChange={e => setBanner({...banner, title: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-white text-sm" placeholder="Main text..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Subtitle (Optional)</label>
                <input type="text" value={banner.subtitle} onChange={e => setBanner({...banner, subtitle: e.target.value})} className="w-full p-3 bg-[#0B0F19] border border-gray-700 rounded-xl text-white text-sm" placeholder="Smaller text..." />
              </div>
            </div>

            {banner.imageUrl && (
              <div className="relative inline-block mt-2">
                <img src={banner.imageUrl} className="h-32 w-full max-w-md rounded-xl object-cover border border-gray-700" />
                <button onClick={() => setBanner({...banner, imageUrl: ''})} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full font-bold flex items-center justify-center">×</button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <input type="file" accept="image/*" onChange={handleUploadBanner} className="flex-1 p-2 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#B519FF]/10 file:text-[#B519FF]" />
              <button onClick={handleSaveBanner} disabled={saving} className="bg-[#B519FF] text-white px-6 py-2 rounded-xl font-bold hover:bg-purple-600 transition disabled:opacity-50">Save Banner</button>
              {banner.imageUrl && (
                <button onClick={handleDeleteBanner} disabled={saving} className="bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 rounded-xl font-bold hover:bg-red-500/20 transition">Remove</button>
              )}
            </div>
          </div>
        </div>

        {/* VIP Images Section */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">VIP Poster Images</h2>
          <div className="flex flex-wrap gap-4 mb-4">
            {vipImages.map((url, i) => (
              <div key={i} className="relative">
                <img src={url} className="h-48 w-36 rounded-xl object-cover border border-gray-700" />
                <button onClick={() => setVipImages(vipImages.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full font-bold flex items-center justify-center">×</button>
              </div>
            ))}
          </div>
          <input type="file" accept="image/*" onChange={handleUploadVip} className="block w-full p-2 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#B519FF]/10 file:text-[#B519FF]" />
        </div>

        {/* Profit Images Section */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Profit Table Images</h2>
          <div className="flex flex-wrap gap-4 mb-4">
            {profitImages.map((url, i) => (
              <div key={i} className="relative">
                <img src={url} className="h-32 rounded-xl object-cover border border-gray-700" />
                <button onClick={() => setProfitImages(profitImages.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full font-bold flex items-center justify-center">×</button>
              </div>
            ))}
          </div>
          <input type="file" accept="image/*" onChange={handleUploadProfit} className="block w-full p-2 bg-[#0B0F19] border border-gray-700 rounded-xl text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#B519FF]/10 file:text-[#B519FF]" />
        </div>

        <button onClick={handleSaveImages} disabled={saving} className="w-full bg-[#B519FF] text-white p-4 rounded-xl font-bold hover:bg-purple-600 transition disabled:opacity-50">
          {saving ? 'Saving...' : 'Save All Images'}
        </button>

      </div>
    </div>
  );
}