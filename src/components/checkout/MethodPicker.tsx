"use client";

import type { PaymentMethod, PaymentMethodOption } from "@/lib/api/types";

import { formatMoney } from "./money";

interface MethodPickerProps {
  options: PaymentMethodOption[];
  value: PaymentMethod | null;
  onChange: (method: PaymentMethod) => void;
  quantity: number;
}

const GROUPS: Array<{ title: string; match: (option: PaymentMethodOption) => boolean }> = [
  { title: "QRIS", match: (option) => option.method === "qris" },
  { title: "Bank transfer (virtual account)", match: (option) => option.bank !== null },
  { title: "Crypto", match: (option) => option.family === "crypto" },
];

/** Payment methods as an accessible radio group, grouped like Indonesian checkouts. */
export function MethodPicker({ options, value, onChange, quantity }: MethodPickerProps) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-caption font-semibold text-pencil">Pay with</legend>
      {GROUPS.map((group) => {
        const items = options.filter(group.match);
        if (items.length === 0) return null;
        return (
          <div key={group.title} className="flex flex-col gap-1.5">
            {items.length > 1 ? <p className="text-caption text-pencil">{group.title}</p> : null}
            <div className="flex flex-wrap gap-2">
              {items.map((option) => {
                const selected = value === option.method;
                return (
                  <label
                    key={option.method}
                    className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-body-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-deep-ember ${
                      selected ? "border-ink bg-cream" : "border-stone hover:border-ink/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      value={option.method}
                      checked={selected}
                      onChange={() => onChange(option.method)}
                      className="sr-only"
                    />
                    <span className="font-semibold text-ink">{option.bank ?? option.label}</span>
                    <span className="tabular-nums text-pencil">
                      {formatMoney(option.unit_amount * quantity, option.currency)}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </fieldset>
  );
}
