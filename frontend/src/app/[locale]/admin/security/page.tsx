'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminSecurity({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  useEffect(() => {
    if (!user.id) return router.push(`/${locale}/auth`);
  }, [router, locale, user.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (passwords.new !== passwords.confirm) return setError('New passwords do not match.');
    if (passwords.new.length < 4) return setError('Password must be at least 4 characters.');

    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/profile/${user.id}/password`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.new })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess('Password updated successfully!');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err: any) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Security</h1>
      
      <div className="bg-white p-8 rounded-3xl shadow-sm border">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-4 bg-red-50 text-red-600 font-bold text-sm rounded-2xl">{error}</div>}
          {success && <div className="p-4 bg-emerald-50 text-emerald-600 font-bold text-sm rounded-2xl">{success}</div>}
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Current Password</label>
            <input type="password" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} className="w-full p-4 bg-gray-50 border rounded-2xl" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">New Password</label>
            <input type="password" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} className="w-full p-4 bg-gray-50 border rounded-2xl" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirm New Password</label>
            <input type="password" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} className="w-full p-4 bg-gray-50 border rounded-2xl" required />
          </div>
          <button type="submit" disabled={submitting} className="w-full bg-[#B519FF] text-white p-4 rounded-2xl font-bold hover:bg-purple-600 transition">Update Password</button>
        </form>
      </div>
    </div>
  );
}