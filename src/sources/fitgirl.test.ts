import { describe, it, expect } from "vitest";
import { fitgirl } from "./fitgirl";

describe("fitgirl source", () => {
  it("uses wordpress rss without swarm health", () => {
    expect(fitgirl.id).toBe("fitgirl");
    expect(fitgirl.reportsHealth).toBe(false);
    expect(fitgirl.homepage).toContain("fitgirl-repacks.site");
  });
});
