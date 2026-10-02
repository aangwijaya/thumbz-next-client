import { ArrowLink } from "@/components/ui/ArrowLink";
import { Container } from "@/components/ui/Container";

interface FeatureRowProps {
  id: string;
  eyebrow: React.ReactNode;
  title: string;
  /** One paragraph, or several. */
  body: string | string[];
  /** Extra controls next to the link, e.g. a toggle. */
  actions?: React.ReactNode;
  action?: { href: string; label: string };
  /** Put the text column on the right on desktop. */
  flip?: boolean;
  children: React.ReactNode;
}

// A text column next to a panel; alternates sides down the page (design.md "Layout").
export function FeatureRow({
  id,
  eyebrow,
  title,
  body,
  actions,
  action,
  flip = false,
  children,
}: FeatureRowProps) {
  const headingId = `${id}-title`;
  const paragraphs = Array.isArray(body) ? body : [body];

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="scroll-mt-24 py-[clamp(32px,4vw,48px)]"
    >
      <Container
        size="page"
        className={`grid items-start gap-7 min-[901px]:gap-[clamp(32px,4.5vw,72px)] ${
          flip
            ? "min-[901px]:grid-cols-[minmax(0,60fr)_minmax(0,40fr)]"
            : "min-[901px]:grid-cols-[minmax(0,40fr)_minmax(0,60fr)]"
        }`}
      >
        <div
          className={`flex flex-col items-start gap-3.5 min-[901px]:sticky min-[901px]:top-24 min-[901px]:gap-4 ${
            flip ? "min-[901px]:order-2" : ""
          }`}
        >
          <p className="-mb-2 flex items-center gap-2 text-caption font-semibold text-deep-ember">
            {eyebrow}
          </p>
          <h2
            id={headingId}
            className="text-balance font-graphik text-[clamp(28px,calc(2.2vw+8px),38px)] font-bold leading-[1.2] tracking-[-0.005em] text-ink"
          >
            {title}
          </h2>
          {paragraphs.map((text) => (
            <p key={text} className="max-w-[44ch] text-[15px] leading-[1.55] text-pencil min-[641px]:text-body">
              {text}
            </p>
          ))}
          {action || actions ? (
            <div className="flex flex-wrap items-center gap-4">
              {actions}
              {action ? (
                <ArrowLink href={action.href}>{action.label}</ArrowLink>
              ) : null}
            </div>
          ) : null}
        </div>
        {children}
      </Container>
    </section>
  );
}
