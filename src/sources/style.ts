import type { SourceId } from "./types";

const COLOR = {
  accent: "#a78bfa",
  alt: "#b9a7e6",
  good: "#86d6a2",
  warn: "#f0c560",
  bright: "#d8b4fe",
} as const;

export const SOURCE_STYLE: Record<SourceId, { tag: string; color: string }> = {
  fitgirl: { tag: "FG", color: COLOR.accent },
  "online-fix": { tag: "OF", color: "#7dd3fc" },
  yts: { tag: "YTS", color: COLOR.good },
  eztv: { tag: "EZTV", color: COLOR.warn },
  nyaa: { tag: "NYAA", color: COLOR.bright },
  subsplease: { tag: "SUB", color: "#b9a7e6" },
  "tpb-movies": { tag: "TPB", color: "#5fd0c5" },
  "tpb-tv": { tag: "TPB", color: "#5fd0c5" },
  "x1337-movies": { tag: "1337", color: "#f6a55c" },
  "x1337-tv": { tag: "1337", color: "#f6a55c" },
};

// Tolerant lookup: a source id may be absent (a pasted magnet / bare infohash) or
// no longer exist (a removed source persisted in old history/seeds). Fall back to a
// neutral tag rather than indexing SOURCE_STYLE and crashing on `undefined`.
export function sourceStyle(id?: string): { tag: string; color: string } {
  const s = id ? (SOURCE_STYLE as Record<string, { tag: string; color: string }>)[id] : undefined;
  return s ?? { tag: "•", color: COLOR.alt };
}
