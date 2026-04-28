import Navbar from './navbar';
import Footer from './footer';

export default function PageShell({ children, tone = 'dark' }) {
  const isLight = tone === 'light';

  return (
    <div className={isLight ? 'min-h-screen bg-[#f6f3ee] text-[#171412]' : 'min-h-screen bg-background-base text-foreground-primary'}>
      <Navbar tone={tone} />
      <main className="pt-28">{children}</main>
      <Footer tone={tone} />
    </div>
  );
}
