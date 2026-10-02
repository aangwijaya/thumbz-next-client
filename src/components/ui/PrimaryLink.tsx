import Link from "next/link";

interface PrimaryLinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
}

// The single dominant call to action of a view (design.md "Primary Action Button").
// Deep ember rather than ember red so the white label passes 4.5:1.
export function PrimaryLink({ href, className = "", children }: PrimaryLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-deep-ember px-4 text-center text-[15px] font-semibold leading-[1.15] text-paper transition-[background-color,box-shadow] hover:bg-[#b42d1b] hover:shadow-button min-[641px]:px-6 min-[641px]:text-body focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${className}`}
    >
      {children}
    </Link>
  );
}
