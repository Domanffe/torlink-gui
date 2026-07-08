import { cachedSearch } from "../sources/cache";
import { loadAllSources } from "../sources/registry";
import { SOURCE_IDS } from "../sources/meta";
import { HttpError } from "../util/net";
import type { SourceId, TorrentResult } from "../sources/types";

export interface SourceState {
  loading: boolean;
  error: string | null;
  code: string | null;
  count: number;
}

export interface ConcurrentSearchState {
  results: TorrentResult[];
  perSource: Record<SourceId, SourceState>;
  loading: boolean;
  done: number;
  total: number;
}

function errorCode(e: unknown): string {
  if (e instanceof HttpError && e.status > 0) return `HTTP ${e.status}`;
  return "no response";
}

export function blankPerSource(loading: boolean): Record<SourceId, SourceState> {
  const out = {} as Record<SourceId, SourceState>;
  for (const id of SOURCE_IDS) {
    out[id] = { loading, error: null, code: null, count: 0 };
  }
  return out;
}

export function dedupeResults(list: TorrentResult[]): TorrentResult[] {
  const byHash = new Map<string, TorrentResult>();
  for (const r of list) {
    const existing = byHash.get(r.infoHash);
    if (!existing || r.seeders > existing.seeders) byHash.set(r.infoHash, r);
  }
  return [...byHash.values()];
}

/** Default ordering: healthiest first. */
export function defaultResultOrder(list: TorrentResult[]): TorrentResult[] {
  return list.sort((a, b) => {
    if (b.seeders !== a.seeders) return b.seeders - a.seeders;
    return (b.added ?? 0) - (a.added ?? 0);
  });
}

export function idleSearchState(): ConcurrentSearchState {
  return {
    results: [],
    perSource: blankPerSource(false),
    loading: false,
    done: 0,
    total: SOURCE_IDS.length,
  };
}

export interface SearchCallbacks {
  onUpdate: (state: ConcurrentSearchState) => void;
}

/** Run concurrent search across all sources; calls onUpdate as results stream in. */
export async function runConcurrentSearch(
  query: string,
  callbacks: SearchCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const sources = await loadAllSources();
  const collected: TorrentResult[] = [];
  const per = blankPerSource(true);
  let done = 0;
  const total = sources.length;

  const emit = (): void => {
    callbacks.onUpdate({
      results: defaultResultOrder(dedupeResults(collected.slice())),
      perSource: { ...per },
      loading: done < total,
      done,
      total,
    });
  };

  emit();

  await Promise.all(
    sources.map(async (source) => {
      try {
        const res = await cachedSearch(source, query, { signal });
        if (signal?.aborted) return;
        collected.push(...res);
        per[source.id] = { loading: false, error: null, code: null, count: res.length };
      } catch (e: unknown) {
        if (signal?.aborted) return;
        per[source.id] = {
          loading: false,
          error: e instanceof Error ? e.message : String(e),
          code: errorCode(e),
          count: 0,
        };
      } finally {
        if (signal?.aborted) return;
        done += 1;
        emit();
      }
    }),
  );
}
