interface HomeSectionHeadProps {
  /** id of the h2, for the section's aria-labelledby. */
  id: string;
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  /** Links or controls on the right (below the title on phones). */
  actions?: React.ReactNode;
}

/** Eyebrow and title on the left, actions on the right: the home sections that span the full width. */
export function HomeSectionHead({ id, eyebrow, title, actions }: HomeSectionHeadProps) {
  return (
    <div className="mb-6 flex flex-col items-start gap-4 min-[641px]:mb-8 min-[641px]:flex-row min-[641px]:flex-wrap min-[641px]:items-end min-[641px]:justify-between">
      <div className="flex flex-col gap-4">
        <p className="-mb-2 flex items-center gap-2 text-caption font-semibold text-deep-ember">{eyebrow}</p>
        <h2
          id={id}
          className="text-balance font-graphik text-[clamp(28px,calc(2.2vw+8px),38px)] font-bold leading-[1.2] tracking-[-0.005em] text-ink"
        >
          {title}
        </h2>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-x-5 gap-y-3">{actions}</div> : null}
    </div>
  );
}
