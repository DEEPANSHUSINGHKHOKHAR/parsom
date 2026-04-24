export default function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="mx-auto mb-10 max-w-3xl text-center">
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold uppercase text-[#8f3d2f]">
          {eyebrow}
        </p>
      ) : null}

      <h2 className="text-3xl font-semibold tracking-tight text-[#171412] md:text-5xl">
        {title}
      </h2>

      {description ? (
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#756c63] md:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}
