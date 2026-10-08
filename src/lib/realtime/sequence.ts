/**
 * Per-room sequence check (contract §14): every push carries `seq`, exactly
 * one more than the previous push to that room. Anything else means missed
 * messages, and the caller should resync from REST.
 */
export function checkSequence(last: number | null, seq: number): { gap: boolean; last: number } {
  return { gap: last !== null && seq !== last + 1, last: seq };
}
