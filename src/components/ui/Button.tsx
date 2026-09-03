import Link from "next/link";

type ButtonVariant = "primary" | "ghost" | "link";

interface ButtonProps {
  variant?: ButtonVariant;
  href?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary disabled:pointer-events-none disabled:opacity-50";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-text-primary px-5 py-2 text-background hover:bg-text-primary/90",
  ghost:
    "border border-border px-5 py-2 text-text-primary hover:border-text-secondary",
  link: "px-1 py-1 text-text-secondary hover:text-text-primary",
};

export function Button({
  variant = "primary",
  href,
  type = "button",
  disabled = false,
  onClick,
  className = "",
  children,
}: ButtonProps) {
  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} disabled={disabled} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
