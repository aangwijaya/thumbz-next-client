export function LiveIndicator({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-xs font-medium uppercase tracking-widest text-live ${className}`}
    >
      <span
        aria-hidden="true"
        className="size-1.5 rounded-full bg-live motion-safe:animate-pulse"
      />
      LIVE
    </span>
  );
}
