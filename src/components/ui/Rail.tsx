interface RailProps {
  /** Grid columns from 641px up, e.g. "min-[641px]:grid-cols-2 min-[901px]:grid-cols-4". */
  grid: string;
  /** Gaps for both layouts. */
  gap: string;
  children: React.ReactNode;
}

// A grid that becomes a sideways-scrolling row on phones, with the next card
// peeking in. It bleeds to the screen edges of a page Container (20px gutter).
// Children set their own phone width, e.g. "max-[640px]:w-[236px]".
export function Rail({ grid, gap, children }: RailProps) {
  return (
    <div
      className={`relative grid ${grid} ${gap} max-[640px]:-mx-5 max-[640px]:flex max-[640px]:snap-x max-[640px]:snap-mandatory max-[640px]:scroll-px-5 max-[640px]:overflow-x-auto max-[640px]:px-5 max-[640px]:pb-2 max-[640px]:pt-1 max-[640px]:[scrollbar-width:none] max-[640px]:*:shrink-0 max-[640px]:*:snap-start`}
    >
      {children}
    </div>
  );
}
