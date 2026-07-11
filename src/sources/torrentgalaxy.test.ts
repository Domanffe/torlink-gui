import { describe, it, expect } from "vitest";
import { isGalaxyFence, parseTgxRows } from "./torrentgalaxy";

describe("torrentgalaxy", () => {
  it("detects galaxyfence pages", () => {
    expect(isGalaxyFence("<form action='galaxyfence.php'>")).toBe(true);
    expect(isGalaxyFence("<div>results</div>")).toBe(false);
  });

  it("parses torrent rows with magnets", () => {
    const html = `
      <div class="tgxtablecell" title="Dune Part Two 2024">
        <a href="magnet:?xt=urn:btih:abcdef0123456789abcdef0123456789abcdef01">m</a>
        <span class="seed">42</span>
        12.5 GB
      </div>
    `;
    const rows = parseTgxRows(html);
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0]!.infoHash).toBe("abcdef0123456789abcdef0123456789abcdef01");
  });
});
