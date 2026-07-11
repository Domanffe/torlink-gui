import { describe, it, expect } from "vitest";
import { mapAnilibriaTorrents } from "./anilibria";

describe("mapAnilibriaTorrents", () => {
  it("maps v1 torrent entries with seeders", () => {
    const out = mapAnilibriaTorrents([
      {
        hash: "a".repeat(40),
        magnet: `magnet:?xt=urn:btih:${"a".repeat(40)}`,
        seeders: 12,
        leechers: 1,
        size: 500_000_000,
        updated_at: "2024-03-23T10:08:42+00:00",
        quality: { description: "1080p" },
        description: "1-12",
        label: "Test Anime — 1080p [1-12]",
        release: {
          name: { main: "Фрирен", english: "Frieren" },
        },
      },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      infoHash: "a".repeat(40),
      seeders: 12,
      source: "anilibria",
    });
    expect(out[0]!.name).toContain("Test Anime");
  });
});
