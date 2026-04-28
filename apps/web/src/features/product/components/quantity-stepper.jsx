export default function QuantityStepper({
  value,
  min = 1,
  max = 99,
  onChange,
}) {
  const handleChange = (nextValue) => {
    const parsedValue = Number(nextValue);
    const safeValue = Number.isFinite(parsedValue) ? parsedValue : min;
    onChange(Math.max(min, Math.min(max, safeValue)));
  };

  return (
    <div className="inline-flex items-center rounded-full border border-[#171412]/10 bg-[#f4efe8] p-1">
      <button
        type="button"
        onClick={() => handleChange(value - 1)}
        className="rounded-full px-4 py-2 text-[#574f48] transition hover:bg-[#171412]/5 hover:text-[#171412]"
      >
        -
      </button>

      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(event) => handleChange(event.target.value)}
        className="w-16 bg-transparent text-center text-sm text-[#171412] outline-none"
      />

      <button
        type="button"
        onClick={() => handleChange(value + 1)}
        className="rounded-full px-4 py-2 text-[#574f48] transition hover:bg-[#171412]/5 hover:text-[#171412]"
      >
        +
      </button>
    </div>
  );
}