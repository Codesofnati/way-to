'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminReport({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  
  const [targetUserId, setTargetUserId] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  useEffect(() => {
    if (!user.id) return router.push(`/${locale}/auth`);
  }, [router, locale, user.id]);

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/report`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: user.id, targetUserId, reason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert('Report submitted to Super Admin successfully.');
      setTargetUserId(''); setReason('');
    } catch (err: any) { alert(err.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Report a User</h1>
      <p className="text-gray-500 font-medium -mt-4">Send a report directly to the Super Admin if a user breaks the rules.</p>
      
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-red-100">
        <form onSubmit={handleReport} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">User ID</label>
<input 
  type="text" 
  value={targetUserId} 
  onChange={e => setTargetUserId(e.target.value)} 
  placeholder="Enter User Phone Number or UUID" // ✅ Clear instructions
  className="w-full p-4 bg-gray-50 border rounded-2xl" 
  required 
/>          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reason for Report</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Explain why you are reporting this user..." className="w-full p-4 bg-gray-50 border rounded-2xl h-32 resize-none" required />
          </div>
          <button type="submit" disabled={submitting} className="w-full bg-red-600 text-white p-4 rounded-2xl font-bold hover:bg-red-700 transition">Submit Report</button>
        </form>
      </div>
    </div>
  );
}