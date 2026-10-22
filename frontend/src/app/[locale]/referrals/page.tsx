'use client';

import { useState, useEffect, use, Suspense } from 'react';

function ReferralsContent({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = use(params);
  const locale = resolvedParams.locale;
  const isAmharic = locale === 'am';

  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      window.location.href = `/${locale}/auth`;
      return;
    }

    const user = JSON.parse(storedUser);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

    fetch(`${apiUrl}/api/user/${user.id}/dashboard`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setUserData(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [locale]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!userData) return <div className="min-h-screen flex items-center justify-center">Failed to load data.</div>;

  const referralLink = `${window.location.origin}/${locale}/auth?ref=${userData.user.id}`;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border">
          <h1 className="text-xl font-bold text-gray-800">{isAmharic ? 'የሪፈራል ኔትዎርክ' : 'Referral Network'}</h1>
          <a href={`/${locale}/dashboard`} className="text-sm text-indigo-600 hover:underline">
            {isAmharic ? '← ወደ ዳሽቦርድ ተመለስ' : '← Back to Dashboard'}
          </a>
        </div>

        {/* Referral Link Box */}
        <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-sm">
          <h2 className="text-lg font-semibold mb-2">{isAmharic ? 'የእርስዎ የጋበዣ ሊንክ' : 'Your Referral Link'}</h2>
          <div className="flex gap-2">
            <input type="text" readOnly value={referralLink} className="w-full p-3 rounded-xl bg-indigo-700 text-white outline-none border border-indigo-500 text-sm" />
            <button onClick={() => { navigator.clipboard.writeText(referralLink); alert('Copied!'); }} className="bg-white text-indigo-600 px-5 py-3 rounded-xl font-medium text-sm hover:bg-indigo-50 transition">
              {isAmharic ? 'ቅዳ' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Tree Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">{isAmharic ? 'Level 1 ኔትዎርክ' : 'Level 1 Network'}</h3>
            {userData.referrals.level1.length === 0 ? (
              <p className="text-gray-500 text-sm">{isAmharic ? 'ምንም የለም' : 'No direct referrals yet.'}</p>
            ) : (
              <div className="space-y-3">
                {userData.referrals.level1.map((ref: any) => (
                  <div key={ref.id} className="p-3 bg-gray-50 rounded-xl border flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-800">{ref.name && ref.name !== 'User' ? ref.name : 'No Name Set'}</span>
                    <span className="text-gray-500 font-mono">{ref.maskedPhone}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">{isAmharic ? 'Level 2 ኔትዎርክ' : 'Level 2 Network'}</h3>
            {userData.referrals.level2.length === 0 ? (
              <p className="text-gray-500 text-sm">{isAmharic ? 'ምንም የለም' : 'No indirect referrals yet.'}</p>
            ) : (
              <div className="space-y-3">
                {userData.referrals.level2.map((ref: any) => (
                  <div key={ref.id} className="p-3 bg-gray-50 rounded-xl border flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-800">{ref.name && ref.name !== 'User' ? ref.name : 'No Name Set'}</span>
                    <span className="text-gray-500 font-mono">{ref.maskedPhone}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}

export default function ReferralsPage({ params }: { params: Promise<{ locale: string }> }) {
  return <Suspense fallback={<div>Loading...</div>}><ReferralsContent params={params} /></Suspense>;
}