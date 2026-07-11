import { describe, it, expect } from "vitest";
import { getSourceMeta } from "./meta";
import { buildSource } from "./build";
import { search } from "./fitgirl";

describe("fitgirl source", () => {
  it("uses wordpress rss without swarm health", () => {
    const meta = getSourceMeta("fitgirl");
    expect(meta.reportsHealth).toBe(false);
    expect(meta.homepage).toContain("fitgirl-repacks.site");
    expect(buildSource("fitgirl", search).id).toBe("fitgirl");
  });
});
