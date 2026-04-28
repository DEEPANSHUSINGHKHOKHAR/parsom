import { useState } from 'react';

function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return '';
  if (/^(blob:|data:)/i.test(url)) return url;
  if (/^https?:\/\//i.test(url)) return url;

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const origin = apiBase.replace(/\/api\/?$/, '').replace(/\/+$/, '');

  return `${origin}${url.startsWith('/') ? url : `/${url}`}`;
}

function inferMediaType(media) {
  if (media?.type) return media.type;
  if (media?.mediaType) return media.mediaType;
  if (/\.(mp4|mov|webm|m4v)(\?|$)/i.test(media?.url || '')) return 'video';

  return 'image';
}

export default function AdminMediaPreview({
  media,
  alt = 'Product media',
  className = '',
  fit = 'contain',
}) {
  const [failedSource, setFailedSource] = useState('');
  const mediaUrl =
    typeof media === 'string'
      ? media
      : media?.url || media?.primaryImage || media?.previewUrl || '';
  const source = resolveMediaUrl(mediaUrl);
  const type = inferMediaType(media);
  const failed = failedSource === source;

  if (!source) {
    return (
      <div
        className={`flex items-center justify-center rounded-[8px] border border-[#171412]/10 bg-[#ede8df] text-xs uppercase text-[#756c63] ${className}`}
      >
        No media
      </div>
    );
  }

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 rounded-[8px] border border-[#171412]/10 bg-[#ede8df] p-3 text-center text-xs text-[#756c63] ${className}`}
      >
        <span>Preview unavailable</span>
        <a
          href={source}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-[#171412] underline"
        >
          Open media
        </a>
      </div>
    );
  }

  if (type === 'video') {
    return (
      <video
        src={source}
        className={`rounded-[8px] border border-[#171412]/10 bg-[#171412] ${fit === 'cover' ? 'object-cover' : 'object-contain'} ${className}`}
        muted
        playsInline
        controls
        onError={() => setFailedSource(source)}
      />
    );
  }

  return (
    <img
      src={source}
      alt={alt}
      className={`rounded-[8px] border border-[#171412]/10 bg-[#ede8df] ${fit === 'cover' ? 'object-cover' : 'object-contain'} ${className}`}
      loading="lazy"
      onError={() => setFailedSource(source)}
    />
  );
}
