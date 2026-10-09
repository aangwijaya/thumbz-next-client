import { describe, expect, it } from "vitest";

import { protectionLabel, selectSource, type PlaybackCapabilities } from "./source";

const session = {
  sources: {
    dash: {
      manifest_url: "https://cdn/m.mpd",
      key_systems: {
        "org.w3.clearkey": { license_url: "https://api/drm/clearkey/license" },
        "com.widevine.alpha": { license_url: "https://drm/wv", headers: { "x-thumbz-playback": "t" } },
      },
    },
    hls: { manifest_url: "https://api/playback/s/hls/master.m3u8?token=t" },
  },
};

const caps = (overrides: Partial<PlaybackCapabilities> = {}): PlaybackCapabilities => ({
  mse: true,
  keySystems: new Set(),
  nativeHls: false,
  preferNativeHls: false,
  ...overrides,
});

describe("selectSource", () => {
  it("prefers Widevine over ClearKey when both are offered and supported", () => {
    const source = selectSource(session, caps({ keySystems: new Set(["org.w3.clearkey", "com.widevine.alpha"]) }));
    expect(source).toMatchObject({ kind: "dash", keySystem: "com.widevine.alpha" });
  });

  it("falls back to ClearKey when the browser lacks Widevine (e.g. Chromium without CDM)", () => {
    const source = selectSource(session, caps({ keySystems: new Set(["org.w3.clearkey"]) }));
    expect(source).toMatchObject({
      kind: "dash",
      keySystem: "org.w3.clearkey",
      license: { license_url: "https://api/drm/clearkey/license" },
    });
  });

  it("ignores key systems the server did not offer", () => {
    const clearKeyOnly = {
      sources: { ...session.sources, dash: { ...session.sources.dash, key_systems: {} } },
    };
    expect(selectSource(clearKeyOnly, caps({ keySystems: new Set(["com.widevine.alpha"]) }))).toEqual({
      kind: "hls",
      manifestUrl: session.sources.hls.manifest_url,
    });
  });

  it("uses native HLS on Safari/iOS where ClearKey is unavailable", () => {
    expect(
      selectSource(session, caps({ nativeHls: true, preferNativeHls: true, keySystems: new Set(["com.apple.fps"]) })),
    ).toEqual({
      kind: "native-hls",
      manifestUrl: session.sources.hls.manifest_url,
    });
  });

  it("uses native HLS on iOS without MSE", () => {
    expect(selectSource(session, caps({ mse: false, nativeHls: true }))?.kind).toBe("native-hls");
  });

  it("keeps MSE for HLS on browsers whose native HLS is not Apple's (recent Chrome)", () => {
    expect(selectSource(session, caps({ nativeHls: true }))?.kind).toBe("hls");
  });

  it("returns null when nothing is playable", () => {
    expect(selectSource(session, caps({ mse: false }))).toBeNull();
  });
});

describe("protectionLabel", () => {
  it("names the delivery and protection", () => {
    expect(protectionLabel({ kind: "native-hls", manifestUrl: "" })).toBe("HLS · AES-128");
    expect(
      protectionLabel({ kind: "dash", manifestUrl: "", keySystem: "org.w3.clearkey", license: { license_url: "" } }),
    ).toBe("DASH · ClearKey");
  });
});
