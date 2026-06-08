import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Identity Hub',
  description: 'Modular, data-driven personal dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <body>{children}</body>
    </html>
  );
}
