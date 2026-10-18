import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/routing';

export const instant = false;

export default async function WaytoHome() {
  const t = await getTranslations('Common');
  const feedT = await getTranslations('Feed');

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-indigo-600">Wayto</h1>
          <div className="flex gap-2">
            <Link href="/" locale="en" className="px-3 py-1 bg-white border rounded text-sm font-medium shadow-sm hover:bg-gray-100">English</Link>
            <Link href="/" locale="am" className="px-3 py-1 bg-white border rounded text-sm font-medium shadow-sm hover:bg-gray-100">አማርኛ</Link>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border mb-8 text-center">
          <h2 className="text-2xl font-bold mb-2">{t('welcome')}</h2>
          <p className="text-gray-600">{t('tagline')}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">{feedT('title')}</h3>
          <textarea 
            placeholder={feedT('placeholder')}
            className="w-full p-3 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
            rows={3}
          />
          <div className="flex justify-end">
            <button className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-medium hover:bg-indigo-700 transition">
              {feedT('postButton')}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}