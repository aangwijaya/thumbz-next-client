import Link from "next/link";

interface TextLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function TextLink({ href, children, className = "" }: TextLinkProps) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text-primary ${className}`}
    >
      {children}
      <span
        aria-hidden="true"
        className="transition-transform motion-safe:group-hover:translate-x-0.5"
      >
        →
      </span>
    </Link>
  );
}
