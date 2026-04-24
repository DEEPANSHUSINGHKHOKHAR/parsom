import clsx from 'clsx';

const toneMap = {
  featured: 'bg-[#171412] text-[#fffaf4]',
  trending: 'bg-[#c97051] text-[#171412]',
  comingSoon: 'bg-[#59624b] text-[#171412]',
  outOfStock: 'bg-[#8f3d2f] text-[#171412]',
};

export default function Badge({ children, tone = 'featured', className }) {
  return (
    <span
      className={clsx(
        'inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase',
        toneMap[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
