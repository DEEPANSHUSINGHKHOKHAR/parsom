export default function SizeSelector({
  sizes = [],
  selectedSize,
  onSelect,
  onUnavailableSelect,
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase  text-[#574f48]">
          Select Size
        </h3>
        <span className="text-xs uppercase  text-[#756c63]">
          Size-wise stock
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        {sizes.map((sizeOption) => {
          const isUnavailable =
            Number(sizeOption.stock ?? 0) <= 0 ||
            sizeOption.status === 'out_of_stock';

          const isActive = selectedSize === sizeOption.size;

          return (
            <button
              key={sizeOption.size}
              type="button"
              onClick={() =>
                isUnavailable
                  ? onUnavailableSelect?.(sizeOption)
                  : onSelect(sizeOption.size)
              }
              className={[
                'min-w-[64px] rounded-[8px] border px-4 py-3 text-sm font-medium transition',
                isActive
                  ? 'border-[#171412] bg-[#171412] text-[#fffaf4]'
                  : 'border-[#171412]/10 bg-[#f4efe8] text-[#171412] hover:border-[#171412]/30',
                isUnavailable ? 'opacity-45' : '',
              ].join(' ')}
            >
              <div className="flex flex-col items-center">
                <span>{sizeOption.size}</span>
                <span className="mt-1 text-[10px] uppercase ">
                  {isUnavailable ? 'Unavailable' : `${sizeOption.stock} Left`}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
