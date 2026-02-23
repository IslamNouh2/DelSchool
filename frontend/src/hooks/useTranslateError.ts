import { useTranslations } from 'next-intl';

export function useTranslateError() {
  const t = useTranslations('errors');

  const translateError = (error: any) => {
    const message = error?.response?.data?.message || error?.message || 'unknown_error';
    
    // If the message is a translation key (e.g., 'errors.local_capacity_exceeded')
    // or if it matches a key in our 'errors' namespace.
    const key = message.startsWith('errors.') ? message.replace('errors.', '') : message;
    
    try {
      // Check if the key exists in our translations
      return t(key);
    } catch (e) {
      // Fallback to the original message if translation key not found
      return message;
    }
  };

  return { translateError };
}
