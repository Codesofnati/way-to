'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SuperAdminProfile({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [userId, setUserId] = useState('');
  const [profile, setProfile] = useState({ name: '', phone: '', role: '' });
  const [loading, setLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push(`/${locale}/auth`);
      return;
    }
    const user = JSON.parse(storedUser);
    if (user.role !== 'super_admin') {
      router.push(`/${locale}/auth`);
      return;
    }
    
    setUserId(user.id); 
    setProfile({ name: user.name || '', phone: user.phone || '', role: user.role });
    setLoading(false);
  }, [router, locale]);

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return alert('User ID not found. Please refresh.');

    try {
      const res = await fetch(`${apiUrl}/api/super-admin/profile/${userId}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profile.name, phone: profile.phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...storedUser, name: data.user.name, phone: data.user.phone }));
      
      alert('Profile updated successfully!');
      window.location.reload(); 
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Personal Information</h1>
        <p className="text-gray-500 font-medium">Manage your account details.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 bg-[#B519FF] text-white rounded-full flex items-center justify-center text-3xl font-bold shadow-[0_0_15px_rgba(181,25,255,0.4)]">
            {profile.name ? profile.name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{profile.name || 'Super Admin'}</h2>
            <span className="inline-block px-3 py-1 bg-purple-100 text-[#B519FF] text-xs font-bold rounded-md uppercase tracking-wider mt-1">
              {profile.role.replace('_', ' ')}
            </span>
          </div>
        </div>

        <form onSubmit={handleUpdateInfo} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
            <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label>
            <input type="tel" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]" required />
          </div>
          <button type="submit" className="w-full bg-black text-white p-4 rounded-2xl font-bold hover:bg-gray-800 transition">
            Save Changes
          </button>
        </form>

        
      </div>
    </div>
  );
}