import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Suspense } from 'react';
import "../globals.css";
import DashboardLayout from '../components/DashboardLayout';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

async function RootLayoutContent({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="bg-[#FAFAFA] text-gray-900 antialiased">
        <NextIntlClientProvider messages={messages}>
          {/* Wrap everything in our new responsive DashboardLayout */}
          <DashboardLayout>
            {children}
          </DashboardLayout>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

export default function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center text-gray-500 font-medium">Loading...</div>}>
      <RootLayoutContent params={params}>{children}</RootLayoutContent>
    </Suspense>
  );
}