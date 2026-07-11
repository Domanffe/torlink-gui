import { fetchResilient, HttpError, USER_AGENT } from "../util/net";
import { buildMagnet } from "./magnet";
import type { SearchOptions, TorrentResult } from "./types";

const API = "https://eztvx.to/api/get-torrents";
const MAX_PAGES = 3;
const PAGE_LIMIT = 100;

interface EztvTorrent {
  title?: string;
  filename?: string;
  hash?: string;
  magnet_url?: string;
  seeds?: number;
  peers?: number;
  size_bytes?: string | number;
  date_released_unix?: number;
}
interface EztvResponse {
  torrents?: EztvTorrent[];
}

export function mapEztvResponse(json: EztvResponse): TorrentResult[] {
  const out: TorrentResult[] = [];
  for (const t of json.torrents ?? []) {
    const hash = (t.hash ?? "").toLowerCase();
    const name = t.title || t.filename || hash;
    const magnet = t.magnet_url || (hash ? buildMagnet(hash, name) : "");
    if (!magnet || !hash) continue;
    out.push({
      infoHash: hash,
      name,
      sizeBytes: Number(t.size_bytes ?? 0) || 0,
      seeders: t.seeds ?? 0,
      leechers: t.peers ?? 0,
      source: "eztv",
      magnet,
      added: t.date_released_unix,
    });
  }
  return out;
}

export function filterEztvByQuery(results: TorrentResult[], query: string): TorrentResult[] {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) return results;
  return results.filter((r) => {
    const hay = r.name.toLowerCase();
    return tokens.every((t) => hay.includes(t));
  });
}

async function fetchPage(page: number, opts: SearchOptions): Promise<TorrentResult[]> {
  const res = await fetchResilient(`${API}?limit=${PAGE_LIMIT}&page=${page}`, {
    headers: { "User-Agent": USER_AGENT },
    signal: opts.signal,
    retries: 1,
  });
  if (!res.ok) throw new HttpError(res.status, `EZTV returned ${res.status}`);
  const json = (await res.json()) as EztvResponse;
  return mapEztvResponse(json);
}

export async function search(query: string, opts: SearchOptions = {}): Promise<TorrentResult[]> {
  const q = query.trim();
  const pages = await Promise.all(
    Array.from({ length: q ? MAX_PAGES : 1 }, (_, i) => fetchPage(i + 1, opts)),
  );
  const merged = pages.flat();
  return q ? filterEztvByQuery(merged, q) : merged;
}
