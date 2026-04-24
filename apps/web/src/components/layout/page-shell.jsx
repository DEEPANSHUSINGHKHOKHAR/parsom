import Navbar from './navbar';
import Footer from './footer';

export default function PageShell({ children }) {
  return (
    <div className="min-h-screen bg-background-base text-foreground-primary">
      <Navbar />
      <main className="pt-28">{children}</main>
      <Footer />
    </div>
  );
}
