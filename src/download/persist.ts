import { promises as fs, mkdirSync, writeFileSync, renameSync } from "node:fs";
import path from "node:path";
import { queueFile } from "../config/paths";
import { serializeWrites, writeJsonAtomic } from "../util/atomic";
import type { QueueItem } from "./types";

const write = serializeWrites();

export function saveQueue(items: QueueItem[]): Promise<void> {
  return write(() => writeJsonAtomic(queueFile, items));
}

export function saveQueueSync(items: QueueItem[]): void {
  try {
    mkdirSync(path.dirname(queueFile), { recursive: true });
    const tmp = `${queueFile}.sync.tmp`;
    writeFileSync(tmp, JSON.stringify(items, null, 2), "utf8");
    renameSync(tmp, queueFile);
  } catch {}
}

function isQueueItem(v: unknown): v is QueueItem {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  return typeof r.id === "string" && typeof r.magnet === "string";
}

export async function loadQueue(): Promise<QueueItem[]> {
  let raw: string;
  try {
    raw = await fs.readFile(queueFile, "utf8");
  } catch {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isQueueItem) : [];
  } catch {
    return [];
  }
}
