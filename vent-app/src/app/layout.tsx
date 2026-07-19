import type { Metadata } from 'next';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { NavBar } from '@/components/layout/NavBar';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'vent',
  description: 'A structured peer-to-peer emotional-support app.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <NavBar />
          <main className="mx-auto min-h-[70vh] max-w-3xl px-4 py-8">{children}</main>
          <Footer />
        </QueryProvider>
      </body>
    </html>
  );
}
