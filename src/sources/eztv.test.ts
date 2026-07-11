import { describe, it, expect } from "vitest";
import { mapEztvResponse, filterEztvByQuery } from "./eztv";

describe("mapEztvResponse", () => {
  it("maps torrent rows with magnet urls", () => {
    const out = mapEztvResponse({
      torrents: [
        {
          title: "Show S01E01",
          hash: "abcdef0123456789abcdef0123456789abcdef01",
          magnet_url: "magnet:?xt=urn:btih:abc",
          seeds: 5,
          peers: 1,
          size_bytes: 500,
        },
      ],
    });
    expect(out).toHaveLength(1);
    expect(out[0]!.name).toBe("Show S01E01");
    expect(out[0]!.magnet).toContain("magnet:");
  });
});

describe("filterEztvByQuery", () => {
  it("filters by title tokens", () => {
    const rows = mapEztvResponse({
      torrents: [
        { title: "Breaking Bad S01E01", hash: "a".repeat(40), magnet_url: "magnet:a" },
        { title: "Other Show S01E01", hash: "b".repeat(40), magnet_url: "magnet:b" },
      ],
    });
    const filtered = filterEztvByQuery(rows, "breaking bad");
    expect(filtered).toHaveLength(1);
    expect(filtered[0]!.name).toContain("Breaking Bad");
  });
});
