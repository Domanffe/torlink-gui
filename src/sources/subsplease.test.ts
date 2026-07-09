import { describe, it, expect } from "vitest";
import { pickBest, mapSubsplease } from "./subsplease";

describe("pickBest", () => {
  it("prefers 1080p over 720p", () => {
    const best = pickBest([
      { res: "720", magnet: "magnet:720" },
      { res: "1080", magnet: "magnet:1080" },
    ]);
    expect(best?.magnet).toBe("magnet:1080");
  });
});

describe("mapSubsplease", () => {
  it("maps api entries to torrent results", () => {
    const hash = "abcdef0123456789abcdef0123456789abcdef01";
    const out = mapSubsplease({
      "1": {
        show: "Anime",
        episode: "01",
        downloads: [{ res: "1080", magnet: `magnet:?xt=urn:btih:${hash}` }],
      },
    });
    expect(out).toHaveLength(1);
    expect(out[0]!.name).toContain("Anime");
    expect(out[0]!.infoHash).toBe(hash);
  });
});
