type BadgeTone = "neutral" | "ember" | "green" | "blue" | "light" | "dark";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-ink/5 text-pencil",
  ember: "bg-cream text-deep-ember",
  green: "bg-mint-wash text-forest",
  blue: "bg-sky-wash text-cobalt-link",
  // Overlays on thumbnails.
  light: "bg-paper/90 text-ink",
  dark: "bg-ink/75 text-paper",
};

const sizeClasses = {
  md: "px-2.5 py-1 text-caption",
  sm: "px-2 py-0.5 text-caption",
  xs: "px-1.5 py-0.5 text-[11px]",
};

interface BadgeProps {
  tone?: BadgeTone;
  size?: keyof typeof sizeClasses;
  /** Positioning only (e.g. "absolute left-2 top-2"); size and tone have their own props. */
  className?: string;
  children: React.ReactNode;
}

export function Badge({
  tone = "neutral",
  size = "md",
  className = "",
  children,
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg font-semibold ${sizeClasses[size]} ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
