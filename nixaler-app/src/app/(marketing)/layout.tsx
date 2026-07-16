import NavBar from '@/components/layout/NavBar';
import MarketingFooter from '@/components/layout/MarketingFooter';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />
      <div className="flex-1">{children}</div>
      <MarketingFooter />
    </div>
  );
}
