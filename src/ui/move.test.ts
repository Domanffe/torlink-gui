import { describe, it, expect } from "vitest";
import { wrapStep, windowStart } from "./move";

describe("wrapStep", () => {
  it("wraps around both ends", () => {
    expect(wrapStep(0, -1, 5)).toBe(4);
    expect(wrapStep(4, 1, 5)).toBe(0);
    expect(wrapStep(2, 1, 5)).toBe(3);
    expect(wrapStep(0, 1, 0)).toBe(0);
  });
});

describe("windowStart", () => {
  it("keeps the cursor centered within bounds", () => {
    expect(windowStart(0, 10, 5)).toBe(0);
    expect(windowStart(9, 10, 5)).toBe(5);
    expect(windowStart(5, 10, 5)).toBe(3);
    expect(windowStart(2, 4, 10)).toBe(0);
  });
});
