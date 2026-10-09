"use client";

import { useReportWebVitals } from "next/web-vitals";

import { routeOf, VITAL_NAMES, type VitalName } from "@/lib/vitals";

/** Sends real-user Core Web Vitals to /api/vitals (production only). */
export function WebVitals() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV !== "production") return;
    if (!VITAL_NAMES.includes(metric.name as VitalName)) return;
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      route: routeOf(window.location.pathname),
      navigationType: metric.navigationType,
    });
    // sendBeacon survives the page being closed (CLS/INP report late).
    if (!navigator.sendBeacon?.("/api/vitals", new Blob([body], { type: "application/json" }))) {
      void fetch("/api/vitals", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => undefined);
    }
  });
  return null;
}
