import { decodeResponseText, fetchResilient, HttpError, USER_AGENT } from "../util/net";
import { buildMagnet } from "./magnet";
import { unescapeEntities } from "./rss";
import { parseSize } from "../util/format";
import type { SearchOptions, TorrentResult } from "./types";

const HOSTS = ["torrentgalaxy.to", "torrentgalaxy.mx"];
const MOVIE_CATS =
  "c3=1&c46=1&c45=1&c42=1&c4=1&c1=1&";
let workingHostIndex = 0;

interface Row {
  name: string;
  infoHash: string;
  magnet?: string;
  seeders: number;
  leechers: number;
  sizeBytes: number;
  added?: number;
}

export function isGalaxyFence(html: string): boolean {
  return /galaxyfence\.php/i.test(html) || /GalaxyFence/i.test(html);
}

export function parseTgxRows(html: string): Row[] {
  const out: Row[] = [];
  for (const block of html.split(/<div class="tgxtablecell/i).slice(1)) {
    const nameMatch = block.match(/title="([^"]+)"/i);
    const magnetMatch = block.match(/href="(magnet:\?[^"]+)"/i);
    const hashMatch =
      magnetMatch?.[1]?.match(/urn:btih:([a-zA-Z0-9]+)/i) ??
      block.match(/torrent\/([a-f0-9]{40})/i);
    if (!nameMatch || !hashMatch) continue;
    const infoHash = hashMatch[1]!.toLowerCase();
    const seeders = Number(block.match(/class="[^"]*seed[^"]*">\s*([\d,]+)/i)?.[1]?.replace(/,/g, "") ?? 0);
    const leechers = Number(block.match(/class="[^"]*leech[^"]*">\s*([\d,]+)/i)?.[1]?.replace(/,/g, "") ?? 0);
    const size = block.match(/([\d.]+\s*[KMGT]i?B)/i)?.[1] ?? "";
    out.push({
      name: unescapeEntities(nameMatch[1]!.trim()),
      infoHash,
      magnet: magnetMatch ? unescapeEntities(magnetMatch[1]!) : undefined,
      seeders,
      leechers,
      sizeBytes: parseSize(size),
    });
  }

  if (out.length > 0) return out;

  // Alternate table layout
  for (const tr of html.split("<tr").slice(1)) {
    const name = tr.match(/title="([^"]+)"/i)?.[1];
    const magnet = tr.match(/href="(magnet:\?[^"]+)"/i)?.[1];
    const infoHash = magnet?.match(/urn:btih:([a-zA-Z0-9]+)/i)?.[1]?.toLowerCase();
    if (!name || !infoHash || !magnet) continue;
    out.push({
      name: unescapeEntities(name.trim()),
      infoHash,
      magnet: unescapeEntities(magnet),
      seeders: Number(tr.match(/>(\d[\d,]*)<\/(?:td|font)[^>]*>\s*<(?:td|font)[^>]*>\s*[\d,]+/i)?.[1]?.replace(/,/g, "") ?? 0),
      leechers: 0,
      sizeBytes: parseSize(tr.match(/([\d.]+\s*[KMGT]i?B)/i)?.[1] ?? ""),
    });
  }
  return out;
}

async function fetchSearchHtml(query: string, opts: SearchOptions): Promise<string> {
  const q = encodeURIComponent(query.trim()).replace(/%20/g, "+");
  let lastError: unknown;
  for (let i = 0; i < HOSTS.length; i++) {
    const hostIdx = (workingHostIndex + i) % HOSTS.length;
    const host = HOSTS[hostIdx]!;
    const url = `https://${host}/torrents.php?${MOVIE_CATS}sort=seeders&order=desc&search=${q}`;
    try {
      const res = await fetchResilient(url, {
        headers: { "User-Agent": USER_AGENT },
        signal: opts.signal,
        retries: i === 0 ? 1 : 0,
      });
      if (!res.ok) throw new HttpError(res.status, `TGx returned ${res.status}`);
      const html = await decodeResponseText(res);
      if (isGalaxyFence(html)) {
        throw new HttpError(403, "TGx GalaxyFence captcha required");
      }
      workingHostIndex = hostIdx;
      return html;
    } catch (e) {
      if (opts.signal?.aborted) throw e;
      lastError = e;
    }
  }
  throw lastError instanceof Error ? lastError : new HttpError(0, "TGx unreachable");
}

export async function search(query: string, opts: SearchOptions = {}): Promise<TorrentResult[]> {
  const q = query.trim();
  if (!q) return [];
  const html = await fetchSearchHtml(q, opts);
  return parseTgxRows(html).map((row) => ({
    infoHash: row.infoHash,
    name: row.name,
    sizeBytes: row.sizeBytes,
    seeders: row.seeders,
    leechers: row.leechers,
    source: "tgx-movies" as const,
    magnet: row.magnet ?? buildMagnet(row.infoHash, row.name),
    added: row.added,
  }));
}
