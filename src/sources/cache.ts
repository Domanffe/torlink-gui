import type { SearchOptions, Source, TorrentResult } from "./types";

const TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;

interface Entry {
  at: number;
  results: TorrentResult[];
}

const cache = new Map<string, Entry>();

/** Clear cache between tests. */
export function clearCache(): void {
  cache.clear();
}

export function cacheEntryCount(): number {
  return cache.size;
}

function key(sourceId: string, query: string): string {
  return `${sourceId}::${query.trim().toLowerCase()}`;
}

export function evictCache(now = Date.now()): void {
  for (const [k, v] of cache) {
    if (now - v.at >= TTL_MS) cache.delete(k);
  }
  if (cache.size <= MAX_CACHE_ENTRIES) return;
  const sorted = [...cache.entries()].sort((a, b) => a[1].at - b[1].at);
  const overflow = sorted.length - MAX_CACHE_ENTRIES;
  for (let i = 0; i < overflow; i++) {
    const entry = sorted[i];
    if (entry) cache.delete(entry[0]);
  }
}

export async function cachedSearch(
  source: Source,
  query: string,
  opts: SearchOptions = {},
): Promise<TorrentResult[]> {
  const k = key(source.id, query);
  const hit = cache.get(k);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.results;

  const results = await source.search(query, opts);
  cache.set(k, { at: Date.now(), results });
  evictCache();
  return results;
}
