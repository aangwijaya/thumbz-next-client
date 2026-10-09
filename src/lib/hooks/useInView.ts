"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tracks whether an element is within `rootMargin` of the viewport, e.g. an
 * infinite-scroll sentinel. Falls back to "visible" where IntersectionObserver
 * is missing so content still loads.
 */
export function useInView<T extends Element>(rootMargin = "600px 0px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}
