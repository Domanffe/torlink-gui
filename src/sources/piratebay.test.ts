import { describe, it, expect } from "vitest";
import { mapApibayItems } from "./piratebay";

describe("mapApibayItems", () => {
  it("skips zero hashes and maps valid items", () => {
    const out = mapApibayItems(
      [
        {
          name: "Valid",
          info_hash: "abcdef0123456789abcdef0123456789abcdef01",
          seeders: "10",
          leechers: "2",
          size: "1000",
        },
        { info_hash: "0000000000000000000000000000000000000000" },
      ],
      "tpb-movies",
    );
    expect(out).toHaveLength(1);
    expect(out[0]!.name).toBe("Valid");
    expect(out[0]!.source).toBe("tpb-movies");
  });
});
