import { useState } from 'react';
import {
  downloadOrdersCsv,
  downloadNotifyRequestsCsv,
  uploadAdminMedia,
} from '../services/admin-tools-service';

export default function ToolsPage() {
  const [uploadState, setUploadState] = useState({
    loading: false,
    error: '',
    result: null,
  });

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadState({
      loading: true,
      error: '',
      result: null,
    });

    try {
      const result = await uploadAdminMedia(file);

      setUploadState({
        loading: false,
        error: '',
        result,
      });
    } catch (error) {
      setUploadState({
        loading: false,
        error: error?.response?.data?.message || 'Upload failed.',
        result: null,
      });
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6">
        <p className="text-xs uppercase  text-[#756c63]">
          Tools
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#171412]">
          Exports & Media Upload
        </h2>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6">
          <h3 className="text-2xl font-semibold text-[#171412]">CSV Exports</h3>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={downloadOrdersCsv}
              className="rounded-full bg-[#171412] px-5 py-3 text-sm font-medium text-[#fffaf4] transition hover:bg-[#8f3d2f]"
            >
              Download Orders CSV
            </button>

            <button
              type="button"
              onClick={downloadNotifyRequestsCsv}
              className="rounded-full border border-[#171412]/10 px-5 py-3 text-sm text-[#574f48] transition hover:bg-[#171412]/5"
            >
              Download Notify CSV
            </button>
          </div>
        </div>

        <div className="rounded-[8px] border border-[#171412]/10 bg-[#fffaf4] p-6">
          <h3 className="text-2xl font-semibold text-[#171412]">Media Upload</h3>

          <div className="mt-5 space-y-4">
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleUpload}
              className="block w-full text-sm text-[#574f48]"
            />

            {uploadState.loading ? (
              <p className="text-sm text-[#756c63]">Uploading media...</p>
            ) : null}

            {uploadState.error ? (
              <p className="text-sm text-red-400">{uploadState.error}</p>
            ) : null}

            {uploadState.result ? (
              <div className="rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] p-4">
                <p className="text-sm text-[#756c63]">Uploaded URL</p>
                <input
                  readOnly
                  value={uploadState.result.url}
                  className="mt-3 w-full rounded-[8px] border border-[#171412]/10 bg-[#f6f3ee] px-4 py-3 text-sm text-[#171412] outline-none"
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}