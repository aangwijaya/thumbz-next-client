import Link from "next/link";

interface ArrowLinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
}

export function ArrowLink({ href, className = "", children }: ArrowLinkProps) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-1.5 rounded-lg text-[15px] font-medium text-cobalt-link hover:underline hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember ${className}`}
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
