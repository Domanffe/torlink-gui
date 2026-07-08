import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  parseDleRssGames,
  parseDleSearchResults,
  parseTorrentDirFromPage,
  parseTorrentFileFromListing,
} from "./online-fix";
import { fetchResilient } from "../util/net";

vi.mock("../util/net", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../util/net")>();
  return { ...actual, fetchResilient: vi.fn() };
});

vi.mock("./torrentBytes", () => ({
  magnetFromTorrentBytes: vi.fn(async () => ({
    infoHash: "abc123",
    name: "Torrent Name",
    magnet: "magnet:?xt=urn:btih:abc123",
    sizeBytes: 1024,
  })),
}));

const mockFetch = vi.mocked(fetchResilient);

const page = (html: string): Response =>
  ({ ok: true, status: 200, text: async () => html, arrayBuffer: async () => new ArrayBuffer(0) }) as unknown as Response;

beforeEach(() => {
  mockFetch.mockReset();
});

describe("parseDleSearchResults", () => {
  it("extracts game links from search HTML", () => {
    const html = `
      <a href="https://online-fix.me/games/rpg/1-elden-ring.html"><h2 class="title">Elden Ring</h2></a>
      <a href="https://online-fix.me/games/rpg/2-other.html"><h2 class="title">Other Game</h2></a>
    `;
    const links = parseDleSearchResults(html);
    expect(links).toHaveLength(2);
    expect(links[0]).toEqual({
      title: "Elden Ring",
      url: "https://online-fix.me/games/rpg/1-elden-ring.html",
    });
  });
});

describe("parseDleRssGames", () => {
  it("extracts /games/ items from DLE RSS", () => {
    const xml = `<rss><channel><item>
      <title>Game A</title>
      <link>https://online-fix.me/games/a/1-a.html</link>
      <pubDate>Tue, 07 Jul 2026 16:32:51 +0300</pubDate>
    </item><item>
      <title>Not a game</title>
      <link>https://online-fix.me/programs/1-b.html</link>
    </item></channel></rss>`;
    const links = parseDleRssGames(xml);
    expect(links).toHaveLength(1);
    expect(links[0]!.title).toBe("Game A");
    expect(links[0]!.added).toBeGreaterThan(0);
  });
});

describe("parseTorrentDirFromPage", () => {
  it("finds uploads torrent directory link", () => {
    const html = `<a target="_blank" href="https://uploads.online-fix.me:2053/torrents/Lies%20of%20P/" class="btn">Torrent</a>`;
    expect(parseTorrentDirFromPage(html)).toBe("https://uploads.online-fix.me:2053/torrents/Lies%20of%20P/");
  });
});

describe("parseTorrentFileFromListing", () => {
  it("resolves relative torrent file href", () => {
    const html = `<a href="Game.v1-OFME.torrent">Game</a>`;
    expect(parseTorrentFileFromListing(html, "https://uploads.online-fix.me:2053/torrents/Game/")).toBe(
      "https://uploads.online-fix.me:2053/torrents/Game/Game.v1-OFME.torrent",
    );
  });
});

describe("onlineFix search", () => {
  it("resolves magnets from search results", async () => {
    const { onlineFix } = await import("./online-fix");
    mockFetch
      .mockResolvedValueOnce(
        page(
          `<a href="https://online-fix.me/games/rpg/1-elden.html"><h2 class="title">Elden Ring</h2></a>`,
        ),
      )
      .mockResolvedValueOnce(
        page(`<a href="https://uploads.online-fix.me:2053/torrents/Elden/">Torrent</a>`),
      )
      .mockResolvedValueOnce(page(`<a href="elden.torrent">elden</a>`))
      .mockResolvedValueOnce(page(""));

    const results = await onlineFix.search("elden");
    expect(results).toHaveLength(1);
    expect(results[0]!.name).toBe("Elden Ring");
    expect(results[0]!.source).toBe("online-fix");
    expect(results[0]!.magnet).toContain("abc123");
  });
});
