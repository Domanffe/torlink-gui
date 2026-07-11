import { describe, it, expect } from "vitest";
import { parseXatabSearchResults, parseMagnetFromPage } from "./xatab";

describe("parseXatabSearchResults", () => {
  it("extracts game post links", () => {
    const html = `
      <a href="https://byxatab.com/games/elden-ring.html">Elden Ring RePack</a>
      <a href="https://byxatab.com/games/other.html">Other Game</a>
    `;
    const links = parseXatabSearchResults(html);
    expect(links).toHaveLength(2);
    expect(links[0]!.title).toBe("Elden Ring RePack");
  });
});

describe("parseMagnetFromPage", () => {
  it("finds magnet on post page", () => {
    const html = `<a href="magnet:?xt=urn:btih:abcdef0123456789abcdef0123456789abcdef01">dl</a>`;
    expect(parseMagnetFromPage(html)).toContain("abcdef0123456789abcdef0123456789abcdef01");
  });
});
