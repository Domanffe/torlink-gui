import { beforeEach, describe, expect, it, vi } from "vitest";
import { markSplashSeen, shouldSkipSplash } from "./splash";

describe("splash persistence", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    });
  });

  it("skips splash after first visit", () => {
    expect(shouldSkipSplash()).toBe(false);
    markSplashSeen();
    expect(shouldSkipSplash()).toBe(true);
  });
});
