'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function SuperAdminReferrals({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'super_admin') {
      router.push(`/${locale}/auth`);
      return;
    }

    // We will need a new backend route for this: /api/super-admin/referrals
    fetch(`${apiUrl}/api/super-admin/referrals`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setReferrals(data.referrals);
      })
      .finally(() => setLoading(false));
  }, [router, locale, apiUrl]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading analytics...</div>;

  return (
    <div className="space-y-8">
      <div>
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B519FF]/10 text-[#B519FF] text-xs font-bold uppercase tracking-wider mb-4 border border-[#B519FF]/20">
          <span className="w-2 h-2 rounded-full bg-[#B519FF]"></span> Global Analytics
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-2">
          Referral <span className="text-[#B519FF] italic font-serif">Network.</span>
        </h1>
        <p className="text-gray-500 font-medium mt-2">See which users are bringing in the most new members.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Top Inviters</h2>
        <div className="space-y-4">
          {referrals.length === 0 && <p className="text-gray-500 text-sm">No referral data yet.</p>}
          
          {referrals.map((ref: any, index: number) => (
            <div key={ref.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-4">
                <span className="text-xl font-black text-gray-300">#{index + 1}</span>
                <div>
                  <p className="font-bold text-gray-900">{ref.name}</p>
                  <p className="text-xs text-gray-500">{ref.phone}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-[#B519FF]">{ref.invitedCount}</p>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Invites</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}