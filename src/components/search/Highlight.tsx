/** `text` with every case-insensitive occurrence of a query token wrapped in <mark>. */
export function Highlight({ text, query }: { text: string; query: string }) {
  const tokens = query
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 1);
  if (tokens.length === 0) return <>{text}</>;

  const escaped = tokens.map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const parts = text.split(new RegExp(`(${escaped.join("|")})`, "giu"));
  return (
    <>
      {parts.map((part, index) =>
        tokens.includes(part.toLowerCase()) ? (
          <mark key={index} className="rounded-sm bg-cream px-0.5 text-inherit">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}
