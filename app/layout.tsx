import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'dr.x',
  description: 'واجهة محادثة متقدمة',
};

/**
 * The root layout wraps every page in your application.  Here we set
 * the language to Arabic and enable right‑to‑left (rtl) layout to
 * provide a comfortable experience for Arabic speakers.  We also
 * import the global CSS stylesheet at the top level so styles apply
 * across the entire app.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}