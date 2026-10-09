export interface Stat {
  label: string;
  value: React.ReactNode;
  hint?: string;
}

/** Key numbers as a definition list: label above, big tabular value. */
export function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-image border border-stone bg-stone min-[641px]:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-1 bg-paper p-4">
          <dt className="text-caption font-semibold text-pencil">{stat.label}</dt>
          <dd className="font-graphik text-subheading font-bold tabular-nums text-ink">
            {stat.value}
          </dd>
          {stat.hint ? <dd className="text-caption text-pencil">{stat.hint}</dd> : null}
        </div>
      ))}
    </dl>
  );
}

export function FormStrip({ form }: { form: Array<"W" | "L"> }) {
  if (form.length === 0) return null;
  return (
    <ol aria-label="Recent form, newest first" className="flex gap-1.5">
      {form.map((result, index) => (
        <li
          key={index}
          className={`grid size-7 place-items-center rounded-md text-caption font-bold ${
            result === "W" ? "bg-mint-wash text-forest" : "bg-cream text-deep-ember"
          }`}
        >
          <span aria-hidden="true">{result}</span>
          <span className="sr-only">{result === "W" ? "Win" : "Loss"}</span>
        </li>
      ))}
    </ol>
  );
}

export function percent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "–";
  // API win rates are 0..1 or 0..100 depending on the endpoint: normalize.
  const pct = value <= 1 ? value * 100 : value;
  return `${Math.round(pct)}%`;
}

export function decimal(value: number | null | undefined, digits = 1): string {
  return value === null || value === undefined || Number.isNaN(value) ? "–" : value.toFixed(digits);
}
