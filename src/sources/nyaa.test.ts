import { describe, it, expect } from "vitest";
import { parseNyaaRss } from "./nyaa";

const xml = `<?xml version="1.0"?>
<rss><channel>
<item>
  <title>Test Anime</title>
  <nyaa:infoHash>abcdef0123456789abcdef0123456789abcdef01</nyaa:infoHash>
  <nyaa:seeders>12</nyaa:seeders>
  <nyaa:leechers>3</nyaa:leechers>
  <nyaa:size>1.5 GiB</nyaa:size>
  <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
</item>
</channel></rss>`;

describe("parseNyaaRss", () => {
  it("parses nyaa rss items", () => {
    const out = parseNyaaRss(xml);
    expect(out).toHaveLength(1);
    expect(out[0]!.name).toBe("Test Anime");
    expect(out[0]!.seeders).toBe(12);
    expect(out[0]!.magnet).toContain("abcdef0123456789abcdef0123456789abcdef01");
  });
});
