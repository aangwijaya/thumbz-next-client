import type { KeySystemConfig, PlaybackSession } from "@/lib/api/types";

/** What the current browser can do, from shaka's probeSupport() + canPlayType. */
export interface PlaybackCapabilities {
  /** Media Source Extensions (or Apple's ManagedMediaSource) are available. */
  mse: boolean;
  /** EME key systems the browser actually supports. */
  keySystems: ReadonlySet<string>;
  /** The <video> element plays HLS by itself (Safari, iOS, recent Chrome). */
  nativeHls: boolean;
  /** Apple WebKit: its own HLS player beats MSE (battery, AirPlay, iOS fullscreen). */
  preferNativeHls: boolean;
}

export type PlaybackSource =
  | {
      kind: "dash";
      manifestUrl: string;
      keySystem: string;
      license: KeySystemConfig;
    }
  /** HLS AES-128 played by shaka (MSE browsers without a usable EME key system). */
  | { kind: "hls"; manifestUrl: string }
  /** HLS AES-128 handed straight to <video> (Safari/iOS). */
  | { kind: "native-hls"; manifestUrl: string };

/**
 * Hardware-backed commercial DRM first, then the W3C ClearKey baseline.
 * FairPlay is not listed: Apple devices take the native HLS path below.
 */
const KEY_SYSTEM_PREFERENCE = ["com.widevine.alpha", "com.microsoft.playready", "org.w3.clearkey"];

/**
 * Picks the strongest protected source this browser can play:
 * DASH + best supported key system → native HLS on Apple → HLS through MSE
 * → native HLS anywhere else. Returns null when nothing fits.
 */
export function selectSource(
  session: Pick<PlaybackSession, "sources">,
  caps: PlaybackCapabilities,
): PlaybackSource | null {
  const { dash, hls } = session.sources;
  if (dash && caps.mse) {
    for (const keySystem of KEY_SYSTEM_PREFERENCE) {
      const license = dash.key_systems[keySystem];
      if (license && caps.keySystems.has(keySystem)) {
        return { kind: "dash", manifestUrl: dash.manifest_url, keySystem, license };
      }
    }
  }
  if (!hls) return null;
  if (caps.nativeHls && (caps.preferNativeHls || !caps.mse)) {
    return { kind: "native-hls", manifestUrl: hls.manifest_url };
  }
  if (caps.mse) return { kind: "hls", manifestUrl: hls.manifest_url };
  return caps.nativeHls ? { kind: "native-hls", manifestUrl: hls.manifest_url } : null;
}

/** Human-readable label for the protection actually in use. */
export function protectionLabel(source: PlaybackSource): string {
  if (source.kind !== "dash") return "HLS · AES-128";
  switch (source.keySystem) {
    case "com.widevine.alpha":
      return "DASH · Widevine";
    case "com.microsoft.playready":
      return "DASH · PlayReady";
    default:
      return "DASH · ClearKey";
  }
}
