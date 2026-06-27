import { fetchResilient, HttpError, USER_AGENT } from "../util/net";
import { unescapeEntities } from "./rss";
import { parseSize } from "../util/format";
import type { SearchOptions, Source, SourceId, TorrentResult } from "./types";

const HOSTS = ["1337x.to", "1337x.st", "x1337x.ws", "1337xx.to"];

const MAX_DETAILS = 8;

const STOP = new Set(["the", "a", "an", "of", "and", "or", "to"]);

interface Row {
  name: string;
  path: string;
  seeders: number;
  leechers: number;
  sizeBytes: number;
}

function parseRows(html: string): Row[] {
  const start = html.indexOf("table-list");
  if (start < 0) return [];
  const out: Row[] = [];
  for (const tr of html.slice(start).split(/<tr[\s>]/i).slice(1)) {
    const link = tr.match(/href="(\/torrent\/[^"]+)"[^>]*>([^<]+)<\/a>/i);
    if (!link) continue;
    const size = tr.match(/class="coll-4 size[^"]*">\s*([\d.]+\s*[KMGT]i?B)/i)?.[1] ?? "";
    out.push({
      name: unescapeEntities(link[2]!.trim()),
      path: link[1]!,
      seeders: Number(tr.match(/class="coll-2 seeds[^"]*">\s*(\d+)/i)?.[1] ?? 0),
      leechers: Number(tr.match(/class="coll-3 leeches[^"]*">\s*(\d+)/i)?.[1] ?? 0),
      sizeBytes: parseSize(size),
    });
  }
  return out;
}

async function fetchText(url: string, opts: SearchOptions, retries: number): Promise<string> {
  const res = await fetchResilient(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: opts.signal,
    retries,
  });
  if (!res.ok) throw new HttpError(res.status, `1337x returned ${res.status}`);
  return res.text();
}

async function detailMagnet(base: string, path: string, opts: SearchOptions): Promise<string | null> {
  try {
    const html = await fetchText(`${base}${path}`, opts, 1);
    const raw = html.match(/magnet:\?xt=urn:btih:[^"'<>\s]+/i)?.[0];
    return raw ? unescapeEntities(raw) : null;
  } catch {
    return null;
  }
}

async function search(
  query: string,
  cat: "Movies" | "TV",
  source: SourceId,
  opts: SearchOptions = {},
): Promise<TorrentResult[]> {
  const q = query.trim();
  const path = q
    ? `/category-search/${encodeURIComponent(q).replace(/%20/g, "+")}/${cat}/1/`
    : `/popular-${cat === "Movies" ? "movies" : "tv"}`;

  let base = "";
  let html = "";
  let lastError: unknown;
  for (const host of HOSTS) {
    try {
      const candidate = `https://${host}`;
      html = await fetchText(`${candidate}${path}`, opts, 2);
      base = candidate;
      break;
    } catch (e) {
      if (opts.signal?.aborted) throw e;
      lastError = e;
    }
  }
  if (!base) throw lastError instanceof Error ? lastError : new HttpError(0, "1337x unreachable");

  const all = parseRows(html);
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
  const meaningful = tokens.filter((t) => !STOP.has(t));
  const need = meaningful.length ? meaningful : tokens;
  const matched = need.length
    ? all.filter((r) => {
        const n = r.name.toLowerCase();
        return need.every((t) => n.includes(t));
      })
    : all;
  matched.sort((a, b) => b.seeders - a.seeders);
  const rows = matched.slice(0, MAX_DETAILS);
  const settled = await Promise.all(
    rows.map(async (row): Promise<TorrentResult | null> => {
      const magnet = await detailMagnet(base, row.path, opts);
      const infoHash = magnet?.match(/urn:btih:([a-zA-Z0-9]+)/i)?.[1]?.toLowerCase();
      if (!magnet || !infoHash) return null;
      return {
        infoHash,
        name: row.name,
        sizeBytes: row.sizeBytes,
        seeders: row.seeders,
        leechers: row.leechers,
        source,
        magnet,
      };
    }),
  );
  return settled.filter((r): r is TorrentResult => r !== null);
}

export const x1337Movies: Source = {
  id: "x1337-movies",
  label: "1337x",
  group: "Movies",
  homepage: "https://1337x.to",
  search: (query, opts = {}) => search(query, "Movies", "x1337-movies", opts),
};

export const x1337Tv: Source = {
  id: "x1337-tv",
  label: "1337x",
  group: "TV",
  homepage: "https://1337x.to",
  search: (query, opts = {}) => search(query, "TV", "x1337-tv", opts),
};
