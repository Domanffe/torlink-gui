import { describe, it, expect } from "vitest";
import { parseXatabSearchResults, parseMagnetFromPage } from "./xatab";

describe("parseXatabSearchResults", () => {
  it("extracts grid layout game links", () => {
    const html = `
      <a href="https://byxatab.com/games/adventure/elden-ring/10-1-0-123" class="item grid-item has-overlay-on-img">
        <div class="item__title">Elden Ring RePack</div>
      </a>
    `;
    const links = parseXatabSearchResults(html);
    expect(links).toHaveLength(1);
    expect(links[0]!.title).toBe("Elden Ring RePack");
    expect(links[0]!.url).toContain("/games/adventure/elden-ring/");
  });

  it("falls back to legacy .html links", () => {
    const html = `<a href="https://byxatab.com/games/elden-ring.html">Elden Ring RePack</a>`;
    const links = parseXatabSearchResults(html);
    expect(links).toHaveLength(1);
    expect(links[0]!.title).toBe("Elden Ring RePack");
  });
});

describe("parseMagnetFromPage", () => {
  it("finds magnet on post page", () => {
    const html = `<a href="magnet:?xt=urn:btih:abcdef0123456789abcdef0123456789abcdef01">dl</a>`;
    expect(parseMagnetFromPage(html)).toContain("abcdef0123456789abcdef0123456789abcdef01");
  });
});
