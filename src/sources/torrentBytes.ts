import parseTorrent from "parse-torrent";
import { buildMagnet, type ParsedMagnet } from "./magnet";

export async function magnetFromTorrentBytes(
  buf: Uint8Array,
): Promise<(ParsedMagnet & { sizeBytes: number }) | null> {
  try {
    const parsed = await parseTorrent(buf);
    const infoHash = parsed?.infoHash?.toLowerCase();
    if (!infoHash) return null;
    const name = parsed.name || infoHash;
    const sizeBytes = (parsed as { length?: number }).length ?? 0;
    return {
      infoHash,
      name,
      magnet: buildMagnet(infoHash, name),
      sizeBytes,
    };
  } catch {
    return null;
  }
}
