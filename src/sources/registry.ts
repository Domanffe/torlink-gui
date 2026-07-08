import { allSourceMeta, getSourceMeta, SOURCE_IDS, SOURCE_META } from "./meta";
import type { Source, SourceGroup, SourceId } from "./types";

export { SOURCE_IDS, SOURCE_META, getSourceMeta, allSourceMeta };

const LOADERS: Record<SourceId, () => Promise<Source>> = {
  fitgirl: () => import("./fitgirl").then((m) => m.fitgirl),
  "online-fix": () => import("./online-fix").then((m) => m.onlineFix),
  yts: () => import("./yts").then((m) => m.yts),
  "tpb-movies": () => import("./piratebay").then((m) => m.tpbMovies),
  "x1337-movies": () => import("./x1337").then((m) => m.x1337Movies),
  eztv: () => import("./eztv").then((m) => m.eztv),
  "tpb-tv": () => import("./piratebay").then((m) => m.tpbTv),
  "x1337-tv": () => import("./x1337").then((m) => m.x1337Tv),
  nyaa: () => import("./nyaa").then((m) => m.nyaa),
  subsplease: () => import("./subsplease").then((m) => m.subsplease),
};

const loaded = new Map<SourceId, Source>();

export async function loadSource(id: SourceId): Promise<Source> {
  const hit = loaded.get(id);
  if (hit) return hit;
  const source = await LOADERS[id]();
  loaded.set(id, source);
  return source;
}

export async function loadAllSources(): Promise<Source[]> {
  return Promise.all(SOURCE_IDS.map(loadSource));
}

/** Sync list of source metadata (no search adapters loaded). */
export const SOURCES = allSourceMeta();

export const DEFAULT_SOURCE_ID: SourceId = SOURCE_IDS[0]!;

const GROUP_ORDER: readonly SourceGroup[] = ["Games", "Movies", "TV", "Anime"];

export function sourcesByGroup(): { group: SourceGroup; sources: typeof SOURCES }[] {
  return GROUP_ORDER.map((group) => ({
    group,
    sources: SOURCES.filter((s) => s.group === group),
  })).filter((g) => g.sources.length > 0);
}
