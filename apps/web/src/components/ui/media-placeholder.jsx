export default function MediaPlaceholder({
  label = 'Image unavailable',
  className = '',
}) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-background-panel px-4 text-center text-xs uppercase text-foreground-muted ${className}`}
    >
      {label}
    </div>
  );
}
