// Shown at once while a dashboard page loads, so a tab click feels instant.
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse">
      <div className="h-7 w-56 rounded bg-line mb-2" />
      <div className="h-4 w-80 max-w-full rounded bg-line mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-line/60" />
        ))}
      </div>
    </div>
  );
}
