import { describe, expect, it } from "vitest";

import { checkSequence } from "./sequence";

describe("checkSequence", () => {
  it("accepts the first message without a baseline", () => {
    expect(checkSequence(null, 7)).toEqual({ gap: false, last: 7 });
  });

  it("accepts consecutive messages", () => {
    expect(checkSequence(7, 8)).toEqual({ gap: false, last: 8 });
  });

  it.each([
    [7, 9],
    [7, 7],
    [7, 3],
  ])("flags a gap or replay from %i to %i", (last, seq) => {
    expect(checkSequence(last, seq).gap).toBe(true);
  });
});
