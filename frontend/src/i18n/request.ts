import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';

export default getRequestConfig(async ({requestLocale}) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  // Explicit imports ensure Turbopack bundles both JSON files correctly
  let messages;
  if (locale === 'am') {
    messages = (await import('../../messages/am.json')).default;
  } else {
    messages = (await import('../../messages/en.json')).default;
  }

  return {
    locale,
    messages
  };
});