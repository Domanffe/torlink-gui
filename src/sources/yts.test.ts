import { describe, it, expect } from "vitest";
import { mapYtsResponse } from "./yts";

describe("mapYtsResponse", () => {
  it("maps movie torrents with quality tags", () => {
    const out = mapYtsResponse({
      data: {
        movies: [
          {
            title: "Test Movie",
            date_uploaded_unix: 1_700_000_000,
            torrents: [
              { hash: "ABCDEF0123456789ABCDEF0123456789ABCDEF01", quality: "1080p", seeds: 42, peers: 3, size_bytes: 1_000 },
            ],
          },
        ],
      },
    });
    expect(out).toHaveLength(1);
    expect(out[0]!.name).toBe("Test Movie [1080p]");
    expect(out[0]!.seeders).toBe(42);
    expect(out[0]!.infoHash).toBe("abcdef0123456789abcdef0123456789abcdef01");
  });
});
