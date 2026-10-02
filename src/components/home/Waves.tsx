interface WavesProps {
  /** Positioning and height, e.g. "bottom-0 h-64". */
  className?: string;
  animate?: boolean;
}

// Decorative wave strokes (design.md "Decorative Wave System"). Flat lines that
// flow left to right and never carry content, so keep text clear of them.
// Sits behind its parent's content, so the parent must be `relative isolate`.
export function Waves({ className = "", animate = false }: WavesProps) {
  const path = "fill-none [vector-effect:non-scaling-stroke]";

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 400"
      preserveAspectRatio="none"
      strokeWidth={1.5}
      className={`pointer-events-none absolute inset-x-0 -z-10 w-full ${
        animate ? "motion-safe:animate-wave-reveal" : ""
      } ${className}`}
    >
      <path
        className={`${path} stroke-teal-dusk/45`}
        d="M0 250 C240 170 420 330 720 240 S1180 140 1440 220"
      />
      <path
        className={`${path} stroke-forest/35`}
        d="M0 290 C260 220 480 360 760 280 S1200 190 1440 270"
      />
      <path
        className={`${path} stroke-ember-red/35`}
        d="M0 200 C300 140 460 280 740 200 S1160 100 1440 170"
      />
      <path
        className={`${path} stroke-teal-dusk/25`}
        d="M0 330 C280 280 520 380 800 320 S1220 250 1440 310"
      />
    </svg>
  );
}
