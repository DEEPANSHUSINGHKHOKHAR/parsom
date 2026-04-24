export default function LoadingState({ label = 'Loading...' }) {
  return (
    <div className="flex min-h-[300px] items-center justify-center rounded-[8px] border border-[#171412]/10 bg-white/5 backdrop-blur-xl">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-[#171412]/20 border-t-white" />
        <p className="mt-4 text-sm text-[#756c63]">{label}</p>
      </div>
    </div>
  );
}