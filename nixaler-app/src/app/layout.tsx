import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'niXaler — Come as a cook, leave as a founder',
  description:
    'LLC formation, tax-advantage guidance, a website, a CRM, and a social media manager — one fixed monthly price. niXaler turns creators, self-employed pros, and side-hustlers into real businesses.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
