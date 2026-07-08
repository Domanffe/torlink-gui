import { promises as fs } from "node:fs";
import { magnetFromTorrentBytes } from "./torrentBytes";
import type { ParsedMagnet } from "./magnet";

export async function magnetFromTorrentFile(path: string): Promise<ParsedMagnet | null> {
  try {
    const buf = await fs.readFile(path);
    const parsed = await magnetFromTorrentBytes(new Uint8Array(buf));
    if (!parsed) return null;
    return { infoHash: parsed.infoHash, name: parsed.name, magnet: parsed.magnet };
  } catch {
    return null;
  }
}
