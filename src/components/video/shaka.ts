import type { PlaybackCapabilities } from "@/lib/player/source";

export type Shaka = typeof import("shaka-player").default;
export type ShakaPlayer = InstanceType<Shaka["Player"]>;

export interface Quality {
  /** Rendition height in pixels; doubles as its id. */
  height: number;
  label: string;
}

let shakaPromise: Promise<Shaka> | null = null;
const keySystemProbes = new Map<string, Promise<boolean>>();

/**
 * shaka-player is ~300 KB, so it loads only once a player mounts. Polyfills
 * (EME/MSE prefixes, fullscreen, MediaCapabilities on older Safari) install once.
 */
export function loadShaka(): Promise<Shaka> {
  shakaPromise ??= import("shaka-player").then(({ default: shaka }) => {
    shaka.polyfill.installAll();
    return shaka;
  });
  return shakaPromise;
}

/** The CENC content we package: H.264 + AAC in fragmented MP4. */
const EME_CONFIG: MediaKeySystemConfiguration[] = [
  {
    initDataTypes: ["cenc"],
    videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.42E01E"' }],
    audioCapabilities: [{ contentType: 'audio/mp4; codecs="mp4a.40.2"' }],
  },
];

function keySystemSupported(keySystem: string): Promise<boolean> {
  let probe = keySystemProbes.get(keySystem);
  if (!probe) {
    probe =
      typeof navigator !== "undefined" && typeof navigator.requestMediaKeySystemAccess === "function"
        ? navigator.requestMediaKeySystemAccess(keySystem, EME_CONFIG).then(
            () => true,
            () => false,
          )
        : Promise.resolve(false);
    keySystemProbes.set(keySystem, probe);
  }
  return probe;
}

/**
 * What this browser can play, probing only the key systems the server
 * offered (each EME probe can spin up a CDM, so the result is cached).
 */
export async function probeCapabilities(offeredKeySystems: string[]): Promise<PlaybackCapabilities> {
  const shaka = await loadShaka();
  const video = document.createElement("video");
  const nativeHls = video.canPlayType("application/vnd.apple.mpegurl") !== "";
  // Recent Chrome also answers "maybe" for HLS, but only Apple's player
  // handles AES-128 + FairPlay/AirPlay well, so prefer native there only.
  const appleWebKit = nativeHls && "webkitSetPresentationMode" in video;
  const mse = shaka.Player.isBrowserSupported();
  const results = mse
    ? await Promise.all(offeredKeySystems.map(async (keySystem) => [keySystem, await keySystemSupported(keySystem)] as const))
    : [];
  return {
    mse,
    keySystems: new Set(results.filter(([, ok]) => ok).map(([keySystem]) => keySystem)),
    nativeHls,
    preferNativeHls: appleWebKit,
  };
}

/** Distinct video renditions, highest first. */
export function qualitiesOf(player: ShakaPlayer): Quality[] {
  const heights = new Set<number>();
  for (const track of player.getVideoTracks()) {
    if (track.height) heights.add(track.height);
  }
  return [...heights].sort((a, b) => b - a).map((height) => ({ height, label: `${height}p` }));
}

/** `"auto"` hands control back to ABR; a height pins that rendition. */
export function selectQuality(player: ShakaPlayer, quality: number | "auto"): void {
  if (quality === "auto") {
    player.configure({ abr: { enabled: true } });
    return;
  }
  const track = player.getVideoTracks().find((item) => item.height === quality);
  if (!track) return;
  player.configure({ abr: { enabled: false } });
  // Keep a little buffer so the switch is quick but not a hard cut.
  player.selectVideoTrack(track, true, 4);
}

export function activeHeight(player: ShakaPlayer): number | null {
  return player.getVideoTracks().find((track) => track.active)?.height ?? null;
}
