export default function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-[8px] border border-dashed border-[#171412]/15 bg-[#f4efe8] px-6 py-16 text-center backdrop-blur-xl">
      <h3 className="text-2xl font-semibold tracking-tight">{title}</h3>
      {description ? (
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#756c63]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}