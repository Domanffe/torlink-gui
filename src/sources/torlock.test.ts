import { describe, it, expect } from "vitest";
import { buildTorlockSearchPath, parseTorlockRows } from "./torlock";

const FIXTURE = `
<tr>
<td class="m"><a href="magnet:?xt=urn:btih:abcdef0123456789abcdef0123456789abcdef01"></a></td>
<td class="n"><a href="/breaking-bad-s01.html" title="Breaking Bad S01">Breaking Bad S01</a></td>
<td class="t">TV</td><td class="s">15</td><td class="l">2</td><td>4.7 GB</td>
</tr>
`;
describe("parseTorlockRows", () => {
  it("parses magnet rows with seeders", () => {
    const rows = parseTorlockRows(FIXTURE);
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0]).toMatchObject({
      name: "Breaking Bad S01",
      seeders: 15,
      leechers: 2,
    });
    expect(rows[0]!.magnet).toContain("abcdef0123456789abcdef0123456789abcdef01");
  });
});

describe("buildTorlockSearchPath", () => {
  it("uses television torrents URL with hyphenated query", () => {
    expect(buildTorlockSearchPath("breaking bad")).toBe(
      "https://www.torlock.com/television/torrents/breaking-bad.html?sort=seeds",
    );
  });
});
