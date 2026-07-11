import { SOURCE_META } from "./meta";
import type { Source, SourceId } from "./types";

export function buildSource(id: SourceId, search: Source["search"]): Source {
  return { ...SOURCE_META[id], search };
}
