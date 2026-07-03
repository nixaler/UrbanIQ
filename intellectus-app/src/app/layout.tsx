import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import OfflineCacheInitializer from '@/components/layout/OfflineCacheInitializer';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Intellectus',
  description: 'A daily news and topic reader built for depth over noise.',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem>
          <OfflineCacheInitializer />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
