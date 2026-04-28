import { motion } from 'framer-motion';
import PageShell from '../components/layout/page-shell';
import { siteConfig } from '../config/site-config';

const aboutHighlights = [
  { label: 'Established', value: 'March 2026' },
  { label: 'Studio Model', value: 'India / Online Showroom' },
  { label: 'Current Focus', value: "Women's Collection" },
  { label: 'Support', value: 'Email + WhatsApp Assistance' },
  { label: 'Upcoming', value: 'Men, Kids, and Stitch Your Cloth' },
];

const companyFacts = [
  'Real style for modern wardrobes.',
  'Built for customers who want style with ease.',
  'Includes collection browsing, product pages, customer accounts, size guidance, wishlist management, reviews, checkout, and direct support.',
  'Developed as a real fashion business system, not just a display website.',
  'Focused on being organized, transparent, and customer-friendly.',
];

const platformFacts = [
  "Customers can browse the live women's collection and product pages online.",
  'The store includes account access for orders, saved addresses, wishlist items, reviews, and invoices.',
  'Client contact is available through email, WhatsApp, and the website contact form.',
  "Women's categories are live now, while men and kids are planned for future launch.",
  'Stitch Your Cloth is listed as an upcoming custom clothing service.',
];

export default function AboutPage() {
  return (
    <PageShell>
      <div className="bg-background-base">
        <section className="relative flex min-h-[72vh] items-end overflow-hidden">
          <img
            src="/images/home-hero-parsom.png"
            className="absolute inset-0 h-full w-full object-cover object-[62%_center]"
            alt={siteConfig.brandName}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,11,0.88)_0%,rgba(10,10,11,0.68)_38%,rgba(10,10,11,0.2)_74%,rgba(10,10,11,0.28)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,11,0.12)_0%,rgba(10,10,11,0.16)_44%,rgba(10,10,11,0.82)_100%)]" />
          <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
            <div className="max-w-3xl">
              <span className="mb-5 block text-label text-accent-primary">About the company</span>
              <h1 className="text-display-1 text-foreground-primary">PARSOM ATTIRES</h1>
              <p className="mt-6 max-w-2xl text-body-lg text-[#ddd5ca]">
                PARSOM ATTIRES was established in March 2026 as an online fashion brand
                built for modern women who want clothing that feels elegant,
                comfortable, and expressive.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-4 border-b border-border-soft pb-10 sm:grid-cols-2 xl:grid-cols-4">
            {aboutHighlights.map((item) => (
              <div key={item.label} className="border border-border-soft bg-background-elevated p-5">
                <p className="text-label text-accent-primary">{item.label}</p>
                <p className="mt-3 text-body text-foreground-primary">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mb-24 mt-14 grid grid-cols-1 items-start gap-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-label text-accent-primary">Company profile</p>
              <h2 className="mt-4 text-display-2 text-foreground-primary">Real style for modern wardrobes</h2>
              <p className="mt-8 text-body-lg leading-relaxed text-foreground-secondary">
                {siteConfig.aboutDescription}
              </p>
              <p className="mt-6 text-body text-foreground-secondary">
                We believe a clothing brand should not only look beautiful, but also feel
                organized, transparent, and customer-friendly. That is why every part of
                PARSOM ATTIRES is being developed as a real fashion business system, not
                just a display website.
              </p>
            </motion.div>

            <div className="border border-border-soft bg-background-elevated p-6 md:p-8">
              <p className="text-label text-accent-primary">Quick brand details</p>
              <ul className="mt-6 space-y-4">
                {companyFacts.map((fact) => (
                  <li key={fact} className="flex gap-3 text-body text-foreground-secondary">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-accent-primary" />
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            <div className="border border-border-soft bg-background-elevated p-6 md:p-8">
              <p className="text-label text-accent-primary">Platform capabilities</p>
              <h2 className="mt-4 text-display-3 text-foreground-primary">What is live right now</h2>
              <ul className="mt-5 space-y-4">
                {platformFacts.map((fact) => (
                  <li key={fact} className="flex gap-3 text-body text-foreground-secondary">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-accent-primary" />
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="border border-border-soft bg-background-panel p-6 md:p-8"
            >
              <p className="text-label text-accent-primary">Brand rollout</p>
              <h2 className="mt-4 text-display-3 text-foreground-primary">Current scope and next phase</h2>
              <p className="mt-5 text-body text-foreground-secondary">
                PARSOM ATTIRES is currently building its foundation around women&apos;s
                fashion, direct customer support, and online order management.
              </p>
              <p className="mt-4 text-body text-foreground-secondary">
                The next phase of the brand includes expanding the catalog, adding more
                refined shopping features, improving customer account tools, and
                preparing future categories such as men&apos;s wear, kids&apos; wear, and custom
                stitching services.
              </p>
            </motion.div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
