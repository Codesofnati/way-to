'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminAppSettings({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profitImages, setProfitImages] = useState<string[]>([]);
  const [vipImage, setVipImage] = useState('');
  const [saving, setSaving] = useState(false);

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  useEffect(() => {
    if (user.role !== 'super_admin') return router.push(`/${locale}/auth`);
    fetchSettings();
  }, [router, locale]);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/app-settings`);
      const data = await res.json();
      if (data.success) {
        setProfitImages(data.settings.profitImages || []);
        setVipImage(data.settings.vipImage || '');
      }
    } finally { setLoading(false); }
  };

  const uploadImage = async (file: File) => {
    const fileName = `app-${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
    const { data, error } = await supabase.storage.from('screenshots').upload(fileName, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('screenshots').getPublicUrl(data.path);
    return urlData.publicUrl;
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
      setVipImage(url);
    } catch (err: any) { alert(err.message); } 
    finally { setSaving(false); e.target.value = ''; }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/app-settings`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profitImages, vipImage })
      });
      if (!res.ok) throw new Error('Failed to save');
      alert('App Settings Saved!');
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="text-white p-10 text-center">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-white mb-2">App Images Settings</h1>
        <p className="text-gray-400">Manage images for the Profit & VIP pages on the home screen.</p>
      </div>

      <div className="bg-[#131825] p-6 md:p-8 rounded-3xl border border-gray-800 space-y-8">
        
        {/* VIP Image Section */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">VIP Poster Image</h2>
          {vipImage && (
            <div className="mb-4 relative inline-block">
              <img src={vipImage} className="h-48 rounded-xl object-cover border border-gray-700" />
              <button onClick={() => setVipImage('')} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full font-bold flex items-center justify-center">×</button>
            </div>
          )}
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

        <button onClick={handleSave} disabled={saving} className="w-full bg-[#B519FF] text-white p-4 rounded-xl font-bold hover:bg-purple-600 transition disabled:opacity-50">
          {saving ? 'Saving...' : 'Save All Images'}
        </button>

      </div>
    </div>
  );
}