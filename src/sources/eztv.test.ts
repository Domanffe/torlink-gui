import { describe, it, expect } from "vitest";
import { mapEztvResponse } from "./eztv";

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
