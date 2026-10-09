"use client";

import { useEffect, useState } from "react";

/**
 * Renders `value` as an SVG QR code in the browser. The encoder is imported
 * on demand, so it only ships to people who reach a payment screen.
 */
export function QrCode({ value, label, size = 224 }: { value: string; label: string; size?: number }) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    import("qrcode")
      .then((QRCode) =>
        QRCode.toString(value, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#25221e", light: "#ffffff" } }),
      )
      .then((markup) => {
        if (!cancelled) setSvg(markup);
      })
      .catch(() => setSvg(null));
    return () => {
      cancelled = true;
    };
  }, [value]);

  return (
    <div
      role="img"
      aria-label={label}
      className="grid shrink-0 place-items-center rounded-lg border border-stone bg-white p-2"
      style={{ width: size, height: size }}
    >
      {svg ? (
        // The SVG comes from the QR encoder, not from user input.
        <div className="size-full [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <div className="size-full rounded-md bg-stone/40 motion-safe:animate-pulse" />
      )}
    </div>
  );
}
