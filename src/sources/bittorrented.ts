import { fetchResilient, HttpError, USER_AGENT } from "../util/net";
import { buildMagnet } from "./magnet";
import type { SearchOptions, SourceId, TorrentResult } from "./types";

const BASE = "https://bittorrented.com";
const MIN_QUERY = 3;

const TV_PATTERN =
  /\bS\d{1,2}E\d{1,3}\b|\bS\d{1,2}\b|\bseason\s*\d|\bcomplete\s*series\b|\b\d{1,2}x\d{2}\b/i;

interface BtResult {
  torrent_infohash?: string;
  torrent_name?: string;
  torrent_total_size?: number;
  torrent_seeders?: number | null;
  torrent_leechers?: number | null;
  torrent_file_count?: number;
  torrent_created_at?: string;
}

interface BtResponse {
  results?: BtResult[];
}

function toUnixSeconds(iso: string | undefined): number | undefined {
  if (!iso) return undefined;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? undefined : Math.floor(ms / 1000);
}

export function isTvReleaseName(name: string): boolean {
  return TV_PATTERN.test(name);
}

export function filterBittorrentedResults(
  results: TorrentResult[],
  source: SourceId,
): TorrentResult[] {
  if (source === "bittorrented-tv") {
    return results.filter((r) => isTvReleaseName(r.name));
  }
  return results.filter((r) => !isTvReleaseName(r.name));
}

export function mapBittorrentedResults(results: BtResult[], id: SourceId): TorrentResult[] {
  const out: TorrentResult[] = [];
  for (const r of results) {
    const infoHash = r.torrent_infohash?.toLowerCase();
    if (!infoHash || !/^[a-f0-9]{40}$/.test(infoHash)) continue;
    const name = r.torrent_name || infoHash;
    out.push({
      infoHash,
      name,
      sizeBytes: r.torrent_total_size ?? 0,
      seeders: r.torrent_seeders ?? 0,
      leechers: r.torrent_leechers ?? 0,
      numFiles: r.torrent_file_count,
      source: id,
      magnet: buildMagnet(infoHash, name),
      added: toUnixSeconds(r.torrent_created_at),
    });
  }
  return filterBittorrentedResults(out, id);
}

async function fetchResults(query: string, opts: SearchOptions): Promise<BtResult[]> {
  const params = new URLSearchParams({
    q: query,
    type: "video",
    limit: "50",
    sortBy: "seeders",
    sortOrder: "desc",
  });
  const res = await fetchResilient(`${BASE}/api/search/torrents?${params.toString()}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: opts.signal,
    retries: 1,
  });
  if (!res.ok) throw new HttpError(res.status, `BitTorrented returned ${res.status}`);

  const json = (await res.json()) as BtResponse;
  return json.results ?? [];
}

async function search(source: SourceId, query: string, opts: SearchOptions = {}): Promise<TorrentResult[]> {
  const q = query.trim();
  if (q.length < MIN_QUERY) return [];
  return mapBittorrentedResults(await fetchResults(q, opts), source);
}

export async function searchMovies(query: string, opts: SearchOptions = {}): Promise<TorrentResult[]> {
  return search("bittorrented-movies", query, opts);
}

export async function searchTv(query: string, opts: SearchOptions = {}): Promise<TorrentResult[]> {
  return search("bittorrented-tv", query, opts);
}
