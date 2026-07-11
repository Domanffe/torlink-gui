import { describe, it, expect } from "vitest";
import { mapAnilibriaTitles, parseAnilibriaRss } from "./anilibria";

describe("mapAnilibriaTitles", () => {
  it("maps torrent list entries with seeders", () => {
    const out = mapAnilibriaTitles([
      {
        names: { ru: "Фрирен" },
        torrents: {
          list: [
            {
              hash: "a".repeat(40),
              magnet: `magnet:?xt=urn:btih:${"a".repeat(40)}`,
              seeders: 12,
              leechers: 1,
              total_size: 500_000_000,
              uploaded_timestamp: 1_700_000_000,
              quality: { string: "1080p" },
              episodes: { string: "1-12" },
            },
          ],
        },
      },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      infoHash: "a".repeat(40),
      seeders: 12,
      source: "anilibria",
    });
    expect(out[0]!.name).toContain("Фрирен");
  });
});

describe("parseAnilibriaRss", () => {
  it("extracts magnets from atom entries", () => {
    const xml = `<entry><title>Test Anime</title><link href="magnet:?xt=urn:btih:${"b".repeat(40)}"/></entry>`;
    const out = parseAnilibriaRss(xml);
    expect(out).toHaveLength(1);
    expect(out[0]!.name).toBe("Test Anime");
  });
});
