'use client';

import { useState, useEffect, use, Suspense } from 'react';

function DepositContent({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = use(params);
  const locale = resolvedParams.locale;
  const isAmharic = locale === 'am';

  const [userId, setUserId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Telebirr');
  const [payAmount, setPayAmount] = useState('');
  const [ftNumber, setFtNumber] = useState('');
  const [screenshot, setScreenshot] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      window.location.href = `/${locale}/auth`;
      return;
    }
    setUserId(JSON.parse(storedUser).id);
  }, [locale]);

  const handleManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

    try {
      const res = await fetch(`${apiUrl}/api/user/${userId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: payAmount, paymentMethod, ftNumber, screenshotUrl: screenshot }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPayAmount('');
      setFtNumber('');
      setScreenshot('');
      alert(isAmharic ? 'ክፍያው ተልኳል! በቅርቡ ይረጋገጣል።' : 'Payment submitted successfully! It will be reviewed soon.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border">
          <h1 className="text-xl font-bold text-gray-800">{isAmharic ? 'ገንዘብ ማስገባት (Deposit)' : 'Manual Deposit'}</h1>
          <a href={`/${locale}/dashboard`} className="text-sm text-indigo-600 hover:underline">
            {isAmharic ? '← ወደ ዳሽቦርድ ተመለስ' : '← Back to Dashboard'}
          </a>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
          <div className="p-4 bg-indigo-50 rounded-xl text-sm text-indigo-900 space-y-1">
            <p className="font-semibold">{isAmharic ? 'የሂሳብ ቁጥሮች / አድራሻዎች:' : 'Our Payment Accounts:'}</p>
            <p>• <strong>Telebirr / CBE Birr / M-Pesa:</strong> 0920375815 (Name: Wayto Tech)</p>
            <p>• <strong>Commercial Bank of Ethiopia (CBE):</strong> 1000123456789</p>
            <p>• <strong>Bank of Abyssinia:</strong> ET12345678901234</p>
            <p>• <strong>Dashen Bank:</strong> 5432109876543</p>
          </div>

          <form onSubmit={handleManualPayment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{isAmharic ? 'የክፍያ ዘዴ' : 'Payment Method'}</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full p-3 border rounded-xl bg-white text-sm">
                <option value="Telebirr">Telebirr</option>
                <option value="CBE Birr">CBE Birr</option>
                <option value="CBE Bank">Commercial Bank of Ethiopia (CBE)</option>
                <option value="Abyssinia Bank">Bank of Abyssinia</option>
                <option value="Dashen Bank">Dashen Bank</option>
                <option value="M-Pesa">M-Pesa</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{isAmharic ? 'መጠን (ETB)' : 'Amount (ETB)'}</label>
              <input type="number" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="0.00" className="w-full p-3 border rounded-xl text-sm" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{isAmharic ? 'የግብይት ቁጥር (FT Number)' : 'Transaction / FT Number'}</label>
              <input type="text" value={ftNumber} onChange={(e) => setFtNumber(e.target.value)} placeholder="FT12345678" className="w-full p-3 border rounded-xl text-sm font-mono" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{isAmharic ? 'የቅጽበታዊ ገጽ እይታ ሊንክ (Screenshot URL)' : 'Screenshot Image URL'}</label>
              <input type="text" value={screenshot} onChange={(e) => setScreenshot(e.target.value)} placeholder="Paste image link here" className="w-full p-3 border rounded-xl text-sm" />
            </div>

            <button type="submit" className="w-full bg-indigo-600 text-white p-3 rounded-xl font-medium hover:bg-indigo-700 transition text-sm">
              {isAmharic ? 'ክፍያውን ላክ (Submit Payment)' : 'Submit Payment Proof'}
            </button>
          </form>
        </div>

      </div>
    </main>
  );
}

export default function DepositPage({ params }: { params: Promise<{ locale: string }> }) {
  return <Suspense fallback={<div>Loading...</div>}><DepositContent params={params} /></Suspense>;
}