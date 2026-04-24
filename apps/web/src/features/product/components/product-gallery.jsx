import { useMemo, useState } from 'react';

const inferType = (mediaItem) => {
  if (mediaItem?.type) return mediaItem.type;
  if (typeof mediaItem?.url === 'string' && mediaItem.url.endsWith('.mp4')) {
    return 'video';
  }
  return 'image';
};

export default function ProductGallery({ media = [] }) {
  const galleryItems = useMemo(() => media.filter(Boolean), [media]);
  const [activeIndex, setActiveIndex] = useState(0);

  const activeItem = galleryItems[activeIndex];

  if (!galleryItems.length) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center border border-border-soft bg-background-elevated text-sm uppercase text-foreground-muted">
        USE YOUR DATA HERE
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden border border-border-soft bg-background-elevated">
        <div className="aspect-[4/5]">
          {inferType(activeItem) === 'video' ? (
            <video
              src={activeItem.url}
              controls
              className="h-full w-full object-cover"
            />
          ) : (
            <img
              src={activeItem.url}
              alt={activeItem.alt || 'Product media'}
              className="h-full w-full object-cover"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {galleryItems.map((item, index) => (
          <button
            key={`${item.url}-${index}`}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`overflow-hidden rounded-[8px] border transition ${
              activeIndex === index
                ? 'border-accent-primary'
                : 'border-border-soft hover:border-border-strong'
            }`}
          >
            <div className="aspect-square bg-background-elevated">
              {inferType(item) === 'video' ? (
                <video src={item.url} className="h-full w-full object-cover" />
              ) : (
                <img
                  src={item.url}
                  alt={item.alt || 'Product preview'}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
