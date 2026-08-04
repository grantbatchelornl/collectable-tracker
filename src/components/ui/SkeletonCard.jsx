export default function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border/60 overflow-hidden">
      <div className="aspect-square skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-3/4 rounded-md skeleton" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-5 w-16 rounded-md skeleton" />
          <div className="h-3 w-10 rounded-md skeleton" />
        </div>
        <div className="h-2.5 w-1/2 rounded-md skeleton" />
      </div>
    </div>
  );
}