export default function ComicSkeleton() {
  return (
    <div className="animate-pulse bg-black/60 border border-gray-800 rounded-xl overflow-hidden">
      <div className="h-56 bg-gray-800" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-700 rounded w-full" />
        <div className="h-3 bg-gray-700 rounded w-5/6" />
        <div className="h-8 bg-gray-700 rounded mt-4" />
      </div>
    </div>
  );
}
