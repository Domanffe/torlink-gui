import { SOURCE_IDS } from "./meta";
import type { Source, SourceId } from "./types";

const LOADERS: Record<SourceId, () => Promise<Source>> = {
  fitgirl: () => import("./fitgirl").then((m) => m.fitgirl),
  "online-fix": () => import("./online-fix").then((m) => m.onlineFix),
  yts: () => import("./yts").then((m) => m.yts),
  "tpb-movies": () => import("./piratebay").then((m) => m.tpbMovies),
  "x1337-movies": () => import("./x1337").then((m) => m.x1337Movies),
  "bittorrented-movies": () => import("./bittorrented").then((m) => m.bittorrentedMovies),
  eztv: () => import("./eztv").then((m) => m.eztv),
  "tpb-tv": () => import("./piratebay").then((m) => m.tpbTv),
  "x1337-tv": () => import("./x1337").then((m) => m.x1337Tv),
  "bittorrented-tv": () => import("./bittorrented").then((m) => m.bittorrentedTv),
  nyaa: () => import("./nyaa").then((m) => m.nyaa),
  subsplease: () => import("./subsplease").then((m) => m.subsplease),
};

const loaded = new Map<SourceId, Source>();

async function loadSource(id: SourceId): Promise<Source> {
  const hit = loaded.get(id);
  if (hit) return hit;
  const source = await LOADERS[id]();
  loaded.set(id, source);
  return source;
}

export async function loadAllSources(): Promise<Source[]> {
  return Promise.all(SOURCE_IDS.map(loadSource));
}
