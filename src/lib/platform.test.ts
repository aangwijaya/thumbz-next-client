import { describe, expect, it } from "vitest";

import { vapidKeyBytes } from "./platform";

describe("vapidKeyBytes", () => {
  it("decodes an unpadded base64url VAPID key to its 65 raw bytes", () => {
    // Uncompressed P-256 point: 0x04 prefix + 64 bytes.
    const raw = Uint8Array.from({ length: 65 }, (_, index) => (index === 0 ? 4 : (index * 37) % 256));
    const key = Buffer.from(raw).toString("base64url");
    expect(key).not.toContain("=");
    expect(Array.from(vapidKeyBytes(key))).toEqual(Array.from(raw));
  });
});
