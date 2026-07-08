import type { SourceGroup, SourceId } from "./types";

export interface SourceMeta {
  id: SourceId;
  label: string;
  group: SourceGroup;
  homepage: string;
  reportsHealth: boolean;
}

export const SOURCE_IDS: readonly SourceId[] = [
  "fitgirl",
  "yts",
  "tpb-movies",
  "x1337-movies",
  "eztv",
  "tpb-tv",
  "x1337-tv",
  "nyaa",
  "subsplease",
] as const;

export const SOURCE_META: Record<SourceId, SourceMeta> = {
  fitgirl: {
    id: "fitgirl",
    label: "FitGirl",
    group: "Games",
    homepage: "https://fitgirl-repacks.site",
    reportsHealth: false,
  },
  yts: {
    id: "yts",
    label: "YTS",
    group: "Movies",
    homepage: "https://yts.mx",
    reportsHealth: true,
  },
  "tpb-movies": {
    id: "tpb-movies",
    label: "TPB",
    group: "Movies",
    homepage: "https://thepiratebay.org",
    reportsHealth: true,
  },
  "x1337-movies": {
    id: "x1337-movies",
    label: "1337x",
    group: "Movies",
    homepage: "https://1337x.to",
    reportsHealth: true,
  },
  eztv: {
    id: "eztv",
    label: "EZTV",
    group: "TV",
    homepage: "https://eztvx.to",
    reportsHealth: true,
  },
  "tpb-tv": {
    id: "tpb-tv",
    label: "TPB",
    group: "TV",
    homepage: "https://thepiratebay.org",
    reportsHealth: true,
  },
  "x1337-tv": {
    id: "x1337-tv",
    label: "1337x",
    group: "TV",
    homepage: "https://1337x.to",
    reportsHealth: true,
  },
  nyaa: {
    id: "nyaa",
    label: "Nyaa",
    group: "Anime",
    homepage: "https://nyaa.si",
    reportsHealth: true,
  },
  subsplease: {
    id: "subsplease",
    label: "SubsPlease",
    group: "Anime",
    homepage: "https://subsplease.org",
    reportsHealth: false,
  },
};

export function getSourceMeta(id: SourceId): SourceMeta {
  return SOURCE_META[id];
}

export function allSourceMeta(): SourceMeta[] {
  return SOURCE_IDS.map((id) => SOURCE_META[id]);
}
