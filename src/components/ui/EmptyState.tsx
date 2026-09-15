import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: { label: string; href: string };
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded-lg border border-border px-6 py-12 text-center ${className}`}
    >
      <h3 className="font-display text-xl tracking-tight">{title}</h3>
      {description ? (
        <p className="max-w-md text-sm text-text-secondary">{description}</p>
      ) : null}
      {action ? (
        <Button variant="ghost" href={action.href} className="mt-2">
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
