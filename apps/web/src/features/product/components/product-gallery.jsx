import { useMemo, useState } from 'react';
import MediaPlaceholder from '../../../components/ui/media-placeholder';

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
      <div className="flex min-h-[70vh] items-center justify-center border border-[#171412]/10 bg-[#eee7dc] text-sm uppercase text-[#756c63]">
        Product image unavailable
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="hidden grid-cols-[76px_minmax(0,1fr)] gap-4 lg:grid">
        <div className="flex flex-col gap-3">
          {galleryItems.map((item, index) => (
            <button
              key={`${item.url}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-24 w-[72px] overflow-hidden rounded-[8px] border bg-[#eee7dc] transition ${
                activeIndex === index
                  ? 'border-[#171412] opacity-100'
                  : 'border-[#171412]/10 opacity-70 hover:opacity-100'
              }`}
              aria-label={`View product media ${index + 1}`}
            >
              <div className="relative h-full w-full">
                {inferType(item) === 'video' ? (
                  <video src={item.url} className="h-full w-full object-cover" />
                ) : (
                  <img
                    src={item.url}
                    alt={item.alt || 'Product preview'}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="overflow-hidden bg-[#f6f3ee]">
          <div className="relative flex h-[calc(100vh-13rem)] min-h-[650px] items-center justify-center border border-[#171412]/10 bg-[#f6f3ee]">
            {inferType(activeItem) === 'video' ? (
              <video
                src={activeItem.url}
                controls
                className="h-full w-full bg-[#f6f3ee] object-contain"
              />
            ) : (
              <>
                <MediaPlaceholder
                  label="Product image unavailable"
                  className="bg-[#f6f3ee] text-[#756c63]"
                />
                <img
                  src={activeItem.url}
                  alt={activeItem.alt || 'Product media'}
                  loading="eager"
                  decoding="async"
                  onError={(event) => {
                    event.currentTarget.hidden = true;
                  }}
                  className="absolute inset-0 h-full w-full bg-[#f6f3ee] object-contain"
                />
              </>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3 lg:hidden">
        <div className="overflow-hidden bg-[#eee7dc]">
          <div className="relative aspect-[4/5] bg-[#f6f3ee]">
            {inferType(activeItem) === 'video' ? (
              <video
                src={activeItem.url}
                controls
                className="h-full w-full bg-[#f6f3ee] object-contain"
              />
            ) : (
              <>
                <MediaPlaceholder
                  label="Product image unavailable"
                  className="bg-[#f6f3ee] text-[#756c63]"
                />
                <img
                  src={activeItem.url}
                  alt={activeItem.alt || 'Product media'}
                  loading="eager"
                  decoding="async"
                  onError={(event) => {
                    event.currentTarget.hidden = true;
                  }}
                  className="absolute inset-0 h-full w-full bg-[#f6f3ee] object-contain"
                />
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {galleryItems.map((item, index) => (
            <button
              key={`${item.url}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-20 w-16 shrink-0 overflow-hidden rounded-[8px] border transition ${
                activeIndex === index
                  ? 'border-[#171412]'
                  : 'border-[#171412]/10 opacity-70'
              }`}
            >
              <div className="relative h-full w-full bg-[#eee7dc]">
                {inferType(item) === 'video' ? (
                  <video src={item.url} className="h-full w-full object-cover" />
                ) : (
                  <img
                    src={item.url}
                    alt={item.alt || 'Product preview'}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
