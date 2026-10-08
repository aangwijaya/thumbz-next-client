import { describe, expect, it } from "vitest";

import imageLoader from "./image-loader";

function params(url: string): URLSearchParams {
  return new URL(url).searchParams;
}

describe("imageLoader", () => {
  it("routes remote images through the CDN with width, quality and format", () => {
    const out = imageLoader({ src: "https://picsum.photos/seed/a/800/450", width: 640 });
    expect(out.startsWith("https://wsrv.nl/?")).toBe(true);
    const p = params(out);
    expect(p.get("url")).toBe("https://picsum.photos/seed/a/800/450");
    expect(p.get("w")).toBe("640");
    expect(p.get("q")).toBe("75");
    expect(p.get("output")).toBe("webp");
    expect(p.get("we")).toBe("1");
  });

  it("keeps existing wsrv params and only overrides sizing", () => {
    const src = "https://wsrv.nl/?url=https://ik.imagekit.io/x/logo.png&fit=contain&w=999";
    const p = params(imageLoader({ src, width: 128, quality: 90 }));
    expect(p.get("url")).toBe("https://ik.imagekit.io/x/logo.png");
    expect(p.get("fit")).toBe("contain");
    expect(p.get("w")).toBe("128");
    expect(p.get("q")).toBe("90");
  });

  it("leaves local static files on the app origin", () => {
    expect(imageLoader({ src: "/images/thumbz-icon.png", width: 64 })).toBe(
      "/images/thumbz-icon.png?w=64",
    );
  });

  it("returns unparseable or data sources unchanged", () => {
    expect(imageLoader({ src: "data:image/png;base64,AAAA", width: 10 })).toBe(
      "data:image/png;base64,AAAA",
    );
    expect(imageLoader({ src: "not a url", width: 10 })).toBe("not a url");
  });
});
