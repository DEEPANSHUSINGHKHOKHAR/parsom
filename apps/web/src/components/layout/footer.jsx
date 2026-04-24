import { siteConfig } from '../../config/site-config';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border-soft bg-background-elevated text-foreground-primary">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.28em]">{siteConfig.brandName}</h3>
          <p className="mt-4 max-w-xs text-body-sm text-foreground-secondary">
            {siteConfig.footerDescription}
          </p>
        </div>

        <div>
          <h4 className="text-label text-foreground-primary">Navigation</h4>
          <div className="mt-4 flex flex-col gap-3 text-body-sm text-foreground-secondary">
            <a href="/">Home</a>
            <a href="/about">About</a>
            <a href="/collection">Collection</a>
            <a href="/contact">Contact</a>
            <a href="/size-chart">Size Chart</a>
          </div>
        </div>

        <div>
          <h4 className="text-label text-foreground-primary">Policies</h4>
          <div className="mt-4 flex flex-col gap-3 text-body-sm text-foreground-secondary">
            <a href="/terms">Terms & Conditions</a>
            <a href="/privacy">Privacy Policy</a>
            <a href="/returns">Return Policy</a>
          </div>
        </div>

        <div>
          <h4 className="text-label text-foreground-primary">Social</h4>
          <div className="mt-4 flex flex-col gap-3 text-body-sm text-foreground-secondary">
            <a href={siteConfig.socialLinks.instagram}>Instagram</a>
            <a href={siteConfig.socialLinks.whatsapp}>WhatsApp</a>
            <a href={siteConfig.socialLinks.facebook}>Facebook</a>
            <a href={siteConfig.socialLinks.youtube}>YouTube</a>
          </div>
        </div>
      </div>

      <div className="border-t border-border-soft">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-caption text-foreground-muted sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>&copy; {currentYear} {siteConfig.brandName}. All rights reserved.</p>
          <p>
            Made by{' '}
            <a
              href={siteConfig.socialLinks.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="text-foreground-secondary transition hover:text-accent-primary"
            >
              Deepanshu Singh Khokhar
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
