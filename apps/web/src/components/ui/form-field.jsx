export default function FormField({
  label,
  children,
  hint,
  required = false,
}) {
  return (
    <div className="space-y-2">
      <label className="block text-label text-foreground-muted">
        {label} {required ? <span className="text-foreground-primary">*</span> : null}
      </label>

      {children}

      {hint ? (
        <p className="text-caption leading-6 text-foreground-muted">{hint}</p>
      ) : null}
    </div>
  );
}
