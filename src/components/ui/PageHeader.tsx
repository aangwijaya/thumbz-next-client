interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  /** Right-aligned actions on wide screens (filters, links). */
  actions?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-5 min-[801px]:flex-row min-[801px]:items-end min-[801px]:justify-between">
      <div className="flex max-w-2xl flex-col gap-3">
        {eyebrow ? (
          <p className="text-caption font-semibold text-deep-ember">{eyebrow}</p>
        ) : null}
        <h1 className="text-balance font-graphik text-[clamp(30px,calc(2.4vw+10px),44px)] font-bold leading-[1.15] tracking-[-0.01em] text-ink">
          {title}
        </h1>
        {description ? (
          <p className="text-pretty text-body text-pencil">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}
