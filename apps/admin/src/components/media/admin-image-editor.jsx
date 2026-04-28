import { useEffect, useMemo, useRef, useState } from 'react';

const aspectOptions = [
  { label: 'Product 4:5', value: '4:5', ratio: 4 / 5 },
  { label: 'Square 1:1', value: '1:1', ratio: 1 },
  { label: 'Portrait 3:4', value: '3:4', ratio: 3 / 4 },
  { label: 'Original', value: 'original', ratio: null },
];

function drawImageCover(ctx, image, width, height, zoom, panX, panY) {
  const baseScale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const scale = baseScale * zoom;
  const drawnWidth = image.naturalWidth * scale;
  const drawnHeight = image.naturalHeight * scale;
  const x = (width - drawnWidth) / 2 + (panX / 100) * width * 0.45;
  const y = (height - drawnHeight) / 2 + (panY / 100) * height * 0.45;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#ede8df';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(image, x, y, drawnWidth, drawnHeight);
}

export default function AdminImageEditor({
  file,
  onCancel,
  onApply,
  onUploadOriginal,
}) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [source, setSource] = useState('');
  const [loadFailed, setLoadFailed] = useState(false);
  const [naturalAspect, setNaturalAspect] = useState(4 / 5);
  const [aspect, setAspect] = useState('4:5');
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [outputWidth, setOutputWidth] = useState(1200);

  useEffect(() => {
    const nextSource = URL.createObjectURL(file);
    setSource(nextSource);
    setLoadFailed(false);

    return () => URL.revokeObjectURL(nextSource);
  }, [file]);

  const selectedAspect = useMemo(() => {
    const option = aspectOptions.find((item) => item.value === aspect);
    if (option?.ratio) return option.ratio;

    return naturalAspect;
  }, [aspect, naturalAspect]);

  const previewHeight = Math.round(420 / selectedAspect);
  const outputHeight = Math.round(Number(outputWidth || 1200) / selectedAspect);

  const renderPreview = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;

    if (!canvas || !image || !image.complete || loadFailed) return;

    canvas.width = 420;
    canvas.height = previewHeight;
    drawImageCover(
      canvas.getContext('2d'),
      image,
      canvas.width,
      canvas.height,
      Number(zoom),
      Number(panX),
      Number(panY)
    );
  };

  useEffect(() => {
    renderPreview();
  }, [source, aspect, zoom, panX, panY, previewHeight, loadFailed]);

  const handleApply = () => {
    const image = imageRef.current;
    if (!image || loadFailed) return;

    const width = Number(outputWidth || 1200);
    const height = Math.round(width / selectedAspect);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    drawImageCover(
      canvas.getContext('2d'),
      image,
      width,
      height,
      Number(zoom),
      Number(panX),
      Number(panY)
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const editedFile = new File(
          [blob],
          `${file.name.replace(/\.[^.]+$/, '') || 'product-image'}-edited.webp`,
          { type: 'image/webp' }
        );

        onApply(editedFile, {
          width,
          height,
          format: 'webp',
          sizeBytes: editedFile.size,
        });
      },
      'image/webp',
      0.92
    );
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#171412]/70 p-4">
      <div className="grid max-h-[92vh] w-full max-w-5xl gap-5 overflow-y-auto rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-5 shadow-2xl lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase text-[#756c63]">Image editor</p>
            <h3 className="mt-2 text-2xl font-semibold text-[#171412]">
              Crop, zoom, and resize
            </h3>
          </div>

          <div className="flex min-h-[360px] items-center justify-center rounded-[8px] border border-[#171412]/10 bg-[#ede8df] p-4">
            {loadFailed ? (
              <div className="max-w-md text-center text-sm leading-7 text-[#756c63]">
                This image format cannot be previewed by the browser. Upload it
                directly and the server will still try to convert it.
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                className="max-h-[65vh] max-w-full rounded-[8px] border border-[#171412]/10 bg-[#ede8df]"
                style={{ aspectRatio: selectedAspect }}
              />
            )}
          </div>

          {source ? (
            <img
              ref={imageRef}
              src={source}
              alt=""
              className="hidden"
              onLoad={(event) => {
                const image = event.currentTarget;
                if (image.naturalWidth && image.naturalHeight) {
                  setNaturalAspect(image.naturalWidth / image.naturalHeight);
                }
                renderPreview();
              }}
              onError={() => setLoadFailed(true)}
            />
          ) : null}
        </div>

        <div className="space-y-5">
          <label className="block space-y-2 text-sm text-[#574f48]">
            <span>Crop shape</span>
            <select
              value={aspect}
              onChange={(event) => setAspect(event.target.value)}
              className="w-full rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
            >
              {aspectOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2 text-sm text-[#574f48]">
            <span>Zoom</span>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(event) => setZoom(event.target.value)}
              className="w-full"
              disabled={loadFailed}
            />
          </label>

          <label className="block space-y-2 text-sm text-[#574f48]">
            <span>Move left/right</span>
            <input
              type="range"
              min="-100"
              max="100"
              value={panX}
              onChange={(event) => setPanX(event.target.value)}
              className="w-full"
              disabled={loadFailed}
            />
          </label>

          <label className="block space-y-2 text-sm text-[#574f48]">
            <span>Move up/down</span>
            <input
              type="range"
              min="-100"
              max="100"
              value={panY}
              onChange={(event) => setPanY(event.target.value)}
              className="w-full"
              disabled={loadFailed}
            />
          </label>

          <label className="block space-y-2 text-sm text-[#574f48]">
            <span>Output width</span>
            <select
              value={outputWidth}
              onChange={(event) => setOutputWidth(event.target.value)}
              className="w-full rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
            >
              <option value={900}>900px</option>
              <option value={1200}>1200px</option>
              <option value={1600}>1600px</option>
              <option value={2000}>2000px</option>
            </select>
            <span className="text-xs text-[#756c63]">
              Output: {Number(outputWidth || 1200)} x {outputHeight}px
            </span>
          </label>

          <div className="grid gap-3">
            <button
              type="button"
              onClick={handleApply}
              disabled={loadFailed}
              className="rounded-full bg-[#171412] px-5 py-3 text-sm font-medium text-[#fffaf4] transition hover:bg-[#8f3d2f] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Apply & Upload
            </button>
            <button
              type="button"
              onClick={() => onUploadOriginal(file)}
              className="rounded-full border border-[#171412]/10 px-5 py-3 text-sm text-[#574f48] transition hover:bg-[#171412]/5"
            >
              Upload Original
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-[#171412]/10 px-5 py-3 text-sm text-red-700 transition hover:bg-red-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
