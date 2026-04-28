import { ArrowUpRight, Ruler, Scissors, Shirt } from 'lucide-react';

const comingWorkflow = [
  {
    icon: Shirt,
    title: 'Customer Preferences',
    copy: 'Capture garment type, fabric direction, reference notes, and desired fit.',
  },
  {
    icon: Ruler,
    title: 'Measurements',
    copy: 'Track size inputs and studio follow-up before production confirmation.',
  },
  {
    icon: Scissors,
    title: 'Production Status',
    copy: 'Move requests from new inquiry to contacted, sampled, stitched, and completed.',
  },
];

export default function StitchRequestsPage() {
  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[8px] border border-[#171412]/10 bg-[#fffaf4]">
        <div className="grid gap-6 p-6 md:grid-cols-[1fr_240px] md:p-8">
          <div>
            <p className="text-xs uppercase text-[#8f3d2f]">Coming Soon</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#171412]">
              Stitch Request Management
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#756c63]">
              This admin section is ready for the Stitch Your Cloth flow. Once the customer request
              form is connected, custom stitching inquiries will appear here for follow-up and
              status tracking.
            </p>
          </div>

          <div className="rounded-[8px] border border-[#ded5ca] bg-[#f6f3ee] p-5">
            <p className="text-xs uppercase text-[#756c63]">Current Status</p>
            <p className="mt-3 text-2xl font-semibold text-[#171412]">No requests yet</p>
            <p className="mt-2 text-sm leading-6 text-[#756c63]">
              Public page is live. Request intake can be added next.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {comingWorkflow.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.title}
              className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-5"
            >
              <div className="grid h-11 w-11 place-items-center rounded-[8px] bg-[#171412] text-[#fffaf4]">
                <Icon size={18} />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-[#171412]">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#756c63]">{item.copy}</p>
            </article>
          );
        })}
      </div>

      <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase text-[#756c63]">Storefront Link</p>
            <h3 className="mt-2 text-xl font-semibold text-[#171412]">Stitch Your Cloth page</h3>
          </div>

          <a
            href="/stitch-your-cloth"
            className="inline-flex items-center gap-2 rounded-full border border-[#171412]/10 px-5 py-3 text-sm text-[#574f48] transition hover:bg-[#171412] hover:text-[#fffaf4]"
          >
            Open Page
            <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
