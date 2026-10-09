"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, useTransition } from "react";

export interface TabItem {
  value: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  activeValue: string;
  paramName?: string;
  ariaLabel?: string;
  className?: string;
}

export function Tabs({
  items,
  activeValue,
  paramName = "tab",
  ariaLabel = "Sections",
  className = "",
}: TabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [pending, startTransition] = useTransition();
  // Shows the clicked tab immediately while the server renders its panel.
  const [optimistic, setOptimistic] = useState<string | null>(null);
  const current = pending && optimistic ? optimistic : activeValue;

  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.value === current),
  );

  function select(value: string) {
    if (value === current) return;
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set(paramName, value);
    setOptimistic(value);
    // replace: switching tabs should not fill the back stack.
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  function onKeyDown(event: React.KeyboardEvent) {
    let nextIndex: number | null = null;
    switch (event.key) {
      case "ArrowRight":
        nextIndex = (activeIndex + 1) % items.length;
        break;
      case "ArrowLeft":
        nextIndex = (activeIndex - 1 + items.length) % items.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = items.length - 1;
        break;
    }
    if (nextIndex === null) return;
    event.preventDefault();
    tabRefs.current[nextIndex]?.focus();
    select(items[nextIndex].value);
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      aria-busy={pending}
      className={`flex gap-1 overflow-x-auto border-b border-border ${className}`}
    >
      {items.map((item, index) => {
        const isActive = item.value === current;
        return (
          <button
            key={item.value}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            id={`${paramName}-tab-${item.value}`}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-controls={`${paramName}-panel-${item.value}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => select(item.value)}
            onKeyDown={onKeyDown}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-primary ${
              isActive
                ? "border-text-primary text-text-primary"
                : "border-transparent text-text-secondary hover:border-border hover:text-text-primary"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
