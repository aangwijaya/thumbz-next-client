import { TextLink } from "./TextLink";

interface SectionHeaderProps {
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  className?: string;
}

export function SectionHeader({
  title,
  viewAllHref,
  viewAllLabel = "View all",
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`flex items-end justify-between gap-4 ${className}`}>
      <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
        {title}
      </h2>
      {viewAllHref ? <TextLink href={viewAllHref}>{viewAllLabel}</TextLink> : null}
    </div>
  );
}
