import { fetchResilient, HttpError, USER_AGENT } from "../util/net";
import { buildMagnet, parseMagnet } from "./magnet";
import { unescapeEntities } from "./rss";
import type { SearchOptions, TorrentResult } from "./types";

const API = "https://api.anilibria.tv/v3";

interface AlNames {
  ru?: string;
  en?: string;
  alternative?: string;
}

interface AlTorrent {
  torrent_id?: number;
  hash?: string;
  magnet?: string;
  seeders?: number;
  leechers?: number;
  total_size?: number;
  uploaded_timestamp?: number;
  quality?: { string?: string };
  episodes?: { string?: string };
}

interface AlTitle {
  names?: AlNames;
  torrents?: { list?: AlTorrent[] };
}

interface AlSearchResponse {
  list?: AlTitle[];
}

function titleName(names: AlNames | undefined): string {
  return names?.ru || names?.en || names?.alternative || "Unknown";
}

export function mapAnilibriaTitles(titles: AlTitle[]): TorrentResult[] {
  const out: TorrentResult[] = [];
  for (const title of titles) {
    const base = titleName(title.names);
    for (const t of title.torrents?.list ?? []) {
      const hash = t.hash?.toLowerCase();
      const magnet = t.magnet ? parseMagnet(t.magnet)?.magnet : hash ? buildMagnet(hash, base) : null;
      const infoHash = hash || (magnet ? parseMagnet(magnet)?.infoHash : undefined);
      if (!infoHash || !magnet) continue;
      const quality = t.quality?.string ?? "?";
      const episodes = t.episodes?.string;
      const suffix = episodes ? ` [${episodes}]` : "";
      out.push({
        infoHash,
        name: `${base} — ${quality}${suffix}`,
        sizeBytes: t.total_size ?? 0,
        seeders: t.seeders ?? 0,
        leechers: t.leechers ?? 0,
        source: "anilibria",
        magnet,
        added: t.uploaded_timestamp,
      });
    }
  }
  return out;
}

export function parseAnilibriaRss(xml: string): TorrentResult[] {
  const out: TorrentResult[] = [];
  for (const item of xml.split("<entry>").slice(1)) {
    const title = unescapeEntities(item.match(/<title>(.*?)<\/title>/)?.[1]?.trim() ?? "");
    const magnetMatch = item.match(/href="(magnet:\?[^"]+)"/i);
    if (!title || !magnetMatch) continue;
    const magnet = unescapeEntities(magnetMatch[1]!);
    const parsed = parseMagnet(magnet);
    if (!parsed) continue;
    out.push({
      infoHash: parsed.infoHash,
      name: title,
      sizeBytes: 0,
      seeders: 0,
      leechers: 0,
      source: "anilibria",
      magnet: parsed.magnet,
    });
  }
  return out;
}

async function searchTitles(query: string, opts: SearchOptions): Promise<TorrentResult[]> {
  const params = new URLSearchParams({
    search: query,
    filter: "names,torrents",
    limit: "20",
  });
  const res = await fetchResilient(`${API}/title/search?${params.toString()}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: opts.signal,
    retries: 1,
  });
  if (!res.ok) throw new HttpError(res.status, `AniLibria returned ${res.status}`);
  const json = (await res.json()) as AlSearchResponse | AlTitle[];
  const list = Array.isArray(json) ? json : (json.list ?? []);
  return mapAnilibriaTitles(list);
}

async function fetchRss(opts: SearchOptions): Promise<TorrentResult[]> {
  const res = await fetchResilient(`${API}/torrent/rss?limit=20`, {
    headers: { "User-Agent": USER_AGENT },
    signal: opts.signal,
    retries: 1,
  });
  if (!res.ok) throw new HttpError(res.status, `AniLibria RSS returned ${res.status}`);
  return parseAnilibriaRss(await res.text());
}

export async function search(query: string, opts: SearchOptions = {}): Promise<TorrentResult[]> {
  const q = query.trim();
  if (q) return searchTitles(q, opts);
  return fetchRss(opts);
}
