const formatters = {
  IDR: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }),
  USD: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
};

/** "Rp400.000" or "$25.00". */
export function formatMoney(amount: number | undefined | null, currency: string | undefined | null): string {
  const formatter = formatters[(currency ?? "USD") as keyof typeof formatters] ?? formatters.USD;
  return formatter.format(amount ?? 0);
}
