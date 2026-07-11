import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cacheEntryCount, cachedSearch, clearCache } from "./cache";
import type { Source } from "./types";

function mockSource(search: Source["search"]): Source {
  return {
    id: "yts",
    label: "YTS",
    group: "Movies",
    homepage: "https://yts.mx",
    reportsHealth: true,
    search,
  };
}

describe("cachedSearch", () => {
  beforeEach(() => {
    clearCache();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("re-fetches after TTL expires", async () => {
    const search = vi.fn().mockResolvedValue([]);
    const source = mockSource(search);
    await cachedSearch(source, "alpha");
    expect(search).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(5 * 60 * 1000 + 1);
    await cachedSearch(source, "alpha");
    expect(search).toHaveBeenCalledTimes(2);
  });

  it("caps cache size at 200 entries", async () => {
    const search = vi.fn().mockResolvedValue([]);
    const source = mockSource(search);
    for (let i = 0; i < 210; i++) {
      await cachedSearch(source, `query-${i}`);
    }
    expect(cacheEntryCount()).toBeLessThanOrEqual(200);
  });
});
