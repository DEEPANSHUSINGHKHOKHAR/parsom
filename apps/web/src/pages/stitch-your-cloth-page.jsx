import { Link } from 'react-router-dom';
import { ArrowRight, Ruler, Scissors, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import PageShell from '../components/layout/page-shell';
import Button from '../components/ui/button';

const highlights = [
  {
    icon: Ruler,
    label: 'Measured fit',
    copy: 'Tailoring guidance shaped around your preferred silhouette and comfort.',
  },
  {
    icon: Scissors,
    label: 'Fabric-led craft',
    copy: 'A future made-to-measure flow for shirts, co-ords, outerwear, and essentials.',
  },
  {
    icon: Sparkles,
    label: 'Signature finish',
    copy: 'Minimal PARSOM detailing with refined proportions and premium finishing.',
  },
];

export default function StitchYourClothPage() {
  return (
    <PageShell>
      <section className="relative overflow-hidden bg-background-base pb-24 pt-24">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1800&q=80"
            alt="Tailoring studio with cloth and measuring tools"
            className="h-full w-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-background-base/78" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-background-base" />
        </div>

        <div className="relative mx-auto grid min-h-[calc(100vh-7rem)] max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex border border-border-strong bg-background-elevated/80 px-4 py-2 text-label text-accent-primary backdrop-blur">
              Coming Soon
            </span>
            <h1 className="mt-8 max-w-4xl text-display-1 text-foreground-primary">
              Stitch Your Cloth
            </h1>
            <p className="mt-8 max-w-2xl text-body-lg text-foreground-secondary">
              A custom clothing experience is being prepared for PARSOM clients. Soon you will be
              able to shape fabrics, fits, and finish details into pieces made closer to your style.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button as={Link} to="/collection" className="gap-3">
                Explore Our Collection
                <ArrowRight size={18} />
              </Button>
              <Button as={Link} to="/contact" variant="secondary">
                Connect With Studio
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="grid gap-4"
          >
            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="border border-border-soft bg-background-elevated/86 p-6 backdrop-blur-md"
                >
                  <div className="flex items-start gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-border-strong bg-background-panel text-accent-primary">
                      <Icon size={21} />
                    </div>
                    <div>
                      <h2 className="text-label text-foreground-primary">{item.label}</h2>
                      <p className="mt-3 text-body-sm text-foreground-secondary">{item.copy}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>
    </PageShell>
  );
}
