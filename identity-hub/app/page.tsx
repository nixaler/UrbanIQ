import dynamic from 'next/dynamic';
import ThemeToggle from '@/components/ThemeToggle';
import { DEFAULT_TILES } from '@/lib/tile-data';

// react-grid-layout must be rendered client-side only (no SSR)
const Dashboard = dynamic(() => import('@/components/Dashboard'), { ssr: false });

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-4 py-3 sticky top-0 z-10"
        style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <h1 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
          Identity Hub
        </h1>
        <ThemeToggle />
      </header>

      {/* Grid dashboard — hydrated client-side */}
      <Dashboard initialTiles={DEFAULT_TILES} />
    </main>
  );
}
