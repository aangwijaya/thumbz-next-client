import type { LeadPoint } from "@/components/match/GoldLead";

const W = 200;
const H = 46;

/** A tiny gold-lead line: team A ahead above the middle (peach), team B below (sky). */
export function GoldSpark({ points, label, className = "" }: { points: LeadPoint[]; label: string; className?: string }) {
  if (points.length < 2) return <span aria-hidden="true" className={`block h-[46px] ${className}`} />;
  const end = Math.max(1, points[points.length - 1]?.seconds ?? 1);
  const max = Math.max(1500, ...points.map((point) => Math.abs(point.lead)));
  const x = (seconds: number) => (Math.max(0, seconds) / end) * W;
  const y = (lead: number) => H / 2 - (lead / max) * (H / 2 - 3);
  const line = points.map((point, index) => `${index ? "L" : "M"}${x(point.seconds).toFixed(1)} ${y(point.lead).toFixed(1)}`).join("");
  const area = `${line}L${x(end).toFixed(1)} ${H / 2}L0 ${H / 2}Z`;
  const id = `spark-${label.replace(/\W+/g, "-")}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={label} className={`block h-[46px] w-full ${className}`}>
      <defs>
        <clipPath id={`${id}-up`}>
          <rect x="0" y="0" width={W} height={H / 2} />
        </clipPath>
        <clipPath id={`${id}-down`}>
          <rect x="0" y={H / 2} width={W} height={H / 2} />
        </clipPath>
      </defs>
      <path d={`M0 ${H / 2}H${W}`} className="fill-none stroke-stone [stroke-dasharray:3_4] [vector-effect:non-scaling-stroke]" />
      <path d={area} clipPath={`url(#${id}-up)`} className="fill-[#fde2d6]" />
      <path d={area} clipPath={`url(#${id}-down)`} className="fill-sky-wash" />
      <path d={line} className="fill-none stroke-ink stroke-2 [stroke-linejoin:round] [vector-effect:non-scaling-stroke]" />
    </svg>
  );
}
