import { ReactNode } from 'react';
import { useCmsContent } from '@/hooks/useCmsContent';

/**
 * CmsProvider loads CMS content from the database and merges it into i18n.
 * This makes all admin-edited content available to the frontend via t() calls.
 */
export const CmsProvider = ({ children }: { children: ReactNode }) => {
  useCmsContent();
  return <>{children}</>;
};
