import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Blurt — say it anonymously',
  description: 'No accounts. No names. Just honesty.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
