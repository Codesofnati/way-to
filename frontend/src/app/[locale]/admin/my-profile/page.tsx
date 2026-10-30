'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminMyProfile({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [profile, setProfile] = useState({ name: '', username: '', email: '', phone: '' });
  const [loading, setLoading] = useState(true);

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  useEffect(() => {
    if (!user.id || user.role !== 'admin') return router.push(`/${locale}/auth`);
    
    fetch(`${apiUrl}/api/admin/profile/${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProfile({ 
            name: data.profile.name || '', 
            username: data.profile.username || '', 
            email: data.profile.email || '', 
            phone: data.profile.phone || '' 
          });
        }
      }).finally(() => setLoading(false));
  }, [router, locale, user.id, apiUrl, user.role]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/admin/profile/${user.id}/update`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profile.name, username: profile.username, email: profile.email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...storedUser, name: data.user.name }));
      alert('Profile updated successfully!');
      window.location.reload();
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">My Profile</h1>
        <p className="text-gray-500 font-medium">Manage your personal information.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <form onSubmit={handleUpdate} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number (Cannot change)</label>
            <input type="tel" value={profile.phone} disabled className="w-full p-4 bg-gray-100 border rounded-2xl text-sm text-gray-500 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
            <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full p-4 bg-gray-50 border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label>
            <input type="text" value={profile.username} onChange={e => setProfile({...profile, username: e.target.value})} className="w-full p-4 bg-gray-50 border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
            <input type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} className="w-full p-4 bg-gray-50 border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]" />
          </div>
          <button type="submit" className="w-full bg-black text-white p-4 rounded-2xl font-bold hover:bg-gray-800 transition">Save Changes</button>
        </form>

        {/* Link to Security Page */}
        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500 mb-3">Want to change your password?</p>
          <Link href={`/${locale}/admin/security`} className="inline-block bg-gray-100 text-gray-900 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition">
            Go to Security Settings →
          </Link>
        </div>
      </div>
    </div>
  );
}