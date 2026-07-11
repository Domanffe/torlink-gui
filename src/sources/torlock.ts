import { decodeResponseText, fetchResilient, HttpError, USER_AGENT } from "../util/net";
import { buildMagnet } from "./magnet";
import { unescapeEntities } from "./rss";
import { magnetFromTorrentBytes } from "./torrentBytes";
import { parseSize } from "../util/format";
import type { SearchOptions, TorrentResult } from "./types";

const BASE = "https://www.torlock.com";
const MAX_RESULTS = 12;
const MAX_DETAILS = 8;

interface Row {
  name: string;
  path: string;
  sizeBytes: number;
  seeders: number;
  leechers: number;
  magnet?: string;
}

export function parseTorlockRows(html: string): Row[] {
  const out: Row[] = [];
  const rowRe =
    /class="m"><a href="(magnet:[^"]+)"[\s\S]*?class="n"><a href="([^"]+)" title="([^"]+)"[\s\S]*?class="s">(\d+)<\/td><td class="l">(\d+)<\/td>[\s\S]*?([\d.]+\s*[KMGT]?B)/gi;
  for (const m of html.matchAll(rowRe)) {
    out.push({
      magnet: unescapeEntities(m[1]!),
      path: m[2]!,
      name: unescapeEntities(m[3]!.trim()),
      seeders: Number(m[4] ?? 0),
      leechers: Number(m[5] ?? 0),
      sizeBytes: parseSize(m[6] ?? ""),
    });
    if (out.length >= MAX_RESULTS) break;
  }
  if (out.length > 0) return out;

  // Fallback: simpler row parse when layout differs
  for (const block of html.split('<td class="n">').slice(1)) {
    const link = block.match(/<a href="(\/[^"]+\.html)" title="([^"]+)"/i);
    if (!link) continue;
    const magnet = block.match(/href="(magnet:[^"]+)"/i)?.[1];
    const seeders = Number(block.match(/class="s">(\d+)/i)?.[1] ?? 0);
    const leechers = Number(block.match(/class="l">(\d+)/i)?.[1] ?? 0);
    const size = block.match(/([\d.]+\s*[KMGT]?B)/i)?.[1] ?? "";
    out.push({
      path: link[1]!,
      name: unescapeEntities(link[2]!.trim()),
      seeders,
      leechers,
      sizeBytes: parseSize(size),
      magnet: magnet ? unescapeEntities(magnet) : undefined,
    });
    if (out.length >= MAX_RESULTS) break;
  }
  return out;
}

export function buildTorlockSearchPath(query: string): string {
  const slug = query.trim().replace(/\s+/g, "-");
  return `${BASE}/television/torrents/${slug}.html?sort=seeds`;
}

function searchPath(query: string): string {
  return buildTorlockSearchPath(query);
}

async function fetchText(url: string, opts: SearchOptions): Promise<string> {
  const res = await fetchResilient(url, {
    headers: { "User-Agent": USER_AGENT, Referer: `${BASE}/` },
    signal: opts.signal,
    retries: 1,
  });
  if (!res.ok) throw new HttpError(res.status, `Torlock returned ${res.status}`);
  return decodeResponseText(res);
}

async function resolveMagnet(row: Row, opts: SearchOptions): Promise<string | null> {
  if (row.magnet) return row.magnet;
  try {
    const html = await fetchText(`${BASE}${row.path}`, opts);
    const raw = html.match(/href="(magnet:\?[^"]+)"/i)?.[1];
    if (raw) return unescapeEntities(raw);
    const torrentUrl = html.match(/href="([^"]+\.torrent)"/i)?.[1];
    if (!torrentUrl) return null;
    const url = torrentUrl.startsWith("http") ? torrentUrl : `${BASE}${torrentUrl}`;
    const res = await fetchResilient(url, {
      headers: { "User-Agent": USER_AGENT, Referer: `${BASE}/` },
      signal: opts.signal,
    });
    if (!res.ok) return null;
    const parsed = await magnetFromTorrentBytes(new Uint8Array(await res.arrayBuffer()));
    return parsed?.magnet ?? null;
  } catch {
    return null;
  }
}

export async function search(query: string, opts: SearchOptions = {}): Promise<TorrentResult[]> {
  const q = query.trim();
  if (!q) return [];

  const html = await fetchText(searchPath(q), opts);
  const rows = parseTorlockRows(html).slice(0, MAX_DETAILS);
  const out: TorrentResult[] = [];

  for (const row of rows) {
    const magnet = await resolveMagnet(row, opts);
    if (!magnet) continue;
    const infoHash = magnet.match(/urn:btih:([a-zA-Z0-9]+)/i)?.[1]?.toLowerCase();
    if (!infoHash) continue;
    out.push({
      infoHash,
      name: row.name,
      sizeBytes: row.sizeBytes,
      seeders: row.seeders,
      leechers: row.leechers,
      source: "torlock",
      magnet: magnet.includes("dn=") ? magnet : buildMagnet(infoHash, row.name),
    });
  }
  return out;
}
