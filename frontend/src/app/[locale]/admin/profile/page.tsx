'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function SuperAdminProfile({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  // ✅ NEW: Use state for the user ID
  const [userId, setUserId] = useState('');
  
  const [profile, setProfile] = useState({ name: '', phone: '', role: '' });
  const [loading, setLoading] = useState(true);

  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [passError, setPassError] = useState('');

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
    
    // ✅ NEW: Set the ID in state
    setUserId(user.id); 
    setProfile({ name: user.name || '', phone: user.phone || '', role: user.role });
    setLoading(false);
  }, [router, locale]);

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    // ✅ Add a guard in case it's still loading
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

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    
    if (!userId) return setPassError('User ID not found. Please refresh.');

    if (passwords.new !== passwords.confirm) {
      return setPassError('New passwords do not match.');
    }
    if (passwords.new.length < 4) {
      return setPassError('Password must be at least 4 characters.');
    }

    try {
      const res = await fetch(`${apiUrl}/api/super-admin/profile/${userId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.new }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert('Password changed successfully!');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err: any) {
      setPassError(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* ... (Keep the rest of your JSX exactly the same) ... */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Personal Information</h1>
        <p className="text-gray-500 font-medium">Manage your account details and security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Profile Info Card */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-fit">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-[#B519FF] text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-[0_0_15px_rgba(181,25,255,0.4)]">
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{profile.name || 'Super Admin'}</h2>
              <span className="inline-block px-2 py-1 bg-purple-100 text-[#B519FF] text-xs font-bold rounded-md uppercase tracking-wider mt-1">
                {profile.role.replace('_', ' ')}
              </span>
            </div>
          </div>

          <form onSubmit={handleUpdateInfo} className="space-y-4">
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

        {/* Security / Password Card */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Security</h2>
          
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {passError && <div className="p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl">{passError}</div>}
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Current Password</label>
              <input type="password" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">New Password</label>
              <input type="password" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirm New Password</label>
              <input type="password" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B519FF]" required />
            </div>
            <button type="submit" className="w-full bg-gray-100 text-gray-900 p-4 rounded-2xl font-bold hover:bg-gray-200 transition">
              Update Password
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}