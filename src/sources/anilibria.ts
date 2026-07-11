import { fetchResilient, HttpError, USER_AGENT } from "../util/net";
import { buildMagnet, parseMagnet } from "./magnet";
import type { SearchOptions, TorrentResult } from "./types";

const API = "https://anilibria.top/api/v1";
const MAX_RELEASES = 8;
const MAX_TORRENTS_PER_RELEASE = 5;

interface AlReleaseName {
  main?: string;
  english?: string;
  alternative?: string | null;
}

interface AlRelease {
  id: number;
  name?: AlReleaseName;
}

interface AlTorrent {
  hash?: string;
  magnet?: string;
  seeders?: number;
  leechers?: number;
  size?: number;
  quality?: { description?: string; value?: string };
  description?: string;
  label?: string;
  release?: { name?: AlReleaseName };
  updated_at?: string;
}

function releaseName(names: AlReleaseName | undefined): string {
  return names?.main || names?.english || names?.alternative || "Unknown";
}

export function mapAnilibriaTorrents(torrents: AlTorrent[]): TorrentResult[] {
  const out: TorrentResult[] = [];
  for (const t of torrents) {
    const hash = t.hash?.toLowerCase();
    const base = releaseName(t.release?.name);
    const magnet = t.magnet
      ? parseMagnet(t.magnet)?.magnet
      : hash
        ? buildMagnet(hash, t.label ?? base)
        : null;
    const infoHash = hash || (magnet ? parseMagnet(magnet)?.infoHash : undefined);
    if (!infoHash || !magnet) continue;
    const quality = t.quality?.description ?? t.quality?.value ?? "?";
    const suffix = t.description ? ` [${t.description}]` : "";
    out.push({
      infoHash,
      name: t.label ?? `${base} — ${quality}${suffix}`,
      sizeBytes: t.size ?? 0,
      seeders: t.seeders ?? 0,
      leechers: t.leechers ?? 0,
      source: "anilibria",
      magnet,
      added: t.updated_at ? Math.floor(Date.parse(t.updated_at) / 1000) : undefined,
    });
  }
  return out;
}

async function fetchReleaseTorrents(
  releaseId: number,
  opts: SearchOptions,
): Promise<AlTorrent[]> {
  const res = await fetchResilient(
    `${API}/anime/torrents/release/${releaseId}?limit=${MAX_TORRENTS_PER_RELEASE}`,
    {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: opts.signal,
      retries: 0,
    },
  );
  if (!res.ok) return [];
  return (await res.json()) as AlTorrent[];
}

async function searchTitles(query: string, opts: SearchOptions): Promise<TorrentResult[]> {
  const params = new URLSearchParams({ query, limit: String(MAX_RELEASES) });
  const res = await fetchResilient(`${API}/app/search/releases?${params}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: opts.signal,
    retries: 1,
  });
  if (!res.ok) throw new HttpError(res.status, `AniLibria returned ${res.status}`);

  const releases = (await res.json()) as AlRelease[];
  const torrents: AlTorrent[] = [];
  for (const release of releases.slice(0, MAX_RELEASES)) {
    if (opts.signal?.aborted) break;
    try {
      torrents.push(...(await fetchReleaseTorrents(release.id, opts)));
    } catch {
      /* try next release */
    }
  }
  return mapAnilibriaTorrents(torrents);
}

async function fetchLatest(opts: SearchOptions): Promise<TorrentResult[]> {
  const res = await fetchResilient(`${API}/anime/torrents?limit=20`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: opts.signal,
    retries: 1,
  });
  if (!res.ok) throw new HttpError(res.status, `AniLibria returned ${res.status}`);
  const json = (await res.json()) as { data?: AlTorrent[] };
  return mapAnilibriaTorrents(json.data ?? []);
}

export async function search(query: string, opts: SearchOptions = {}): Promise<TorrentResult[]> {
  const q = query.trim();
  if (q) return searchTitles(q, opts);
  return fetchLatest(opts);
}
