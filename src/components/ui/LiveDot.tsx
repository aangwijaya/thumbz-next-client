export function LiveDot({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex size-2 shrink-0 ${className}`}
    >
      <span className="absolute inset-0 rounded-full bg-deep-ember opacity-60 motion-safe:animate-ping" />
      <span className="relative size-2 rounded-full bg-deep-ember" />
    </span>
  );
}
