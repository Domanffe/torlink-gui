import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  deleteTorrentMeta,
  exportTorrentMeta,
  saveTorrentMeta,
  torrentExportName,
} from "./persist";
import { replaceFile, writeJsonAtomic } from "../util/atomic";

describe("torrent metadata export", () => {
  it("builds a safe .torrent filename from a torrent name", () => {
    expect(torrentExportName('Bad:/Name?* "Final". ', "abc123")).toBe(
      "Bad Name Final.torrent",
    );
    expect(torrentExportName("   ", "abc123")).toBe("abc123.torrent");
  });

  it("copies cached .torrent metadata into the requested folder", async () => {
    const id = `export-${Date.now()}`;
    const outDir = await fs.mkdtemp(path.join(os.tmpdir(), "torlink-export-"));
    const data = new Uint8Array([1, 2, 3, 4]);
    try {
      await saveTorrentMeta(id, data);

      const file = await exportTorrentMeta(id, "Some/Torrent", outDir);

      expect(file).toBe(path.join(outDir, "Some Torrent.torrent"));
      await expect(fs.readFile(file!)).resolves.toEqual(Buffer.from(data));
    } finally {
      deleteTorrentMeta(id);
      await fs.rm(outDir, { recursive: true, force: true });
    }
  });

  it("returns null when metadata has not arrived yet", async () => {
    const outDir = await fs.mkdtemp(path.join(os.tmpdir(), "torlink-export-missing-"));
    try {
      await expect(exportTorrentMeta("missing", "Missing", outDir)).resolves.toBeNull();
    } finally {
      await fs.rm(outDir, { recursive: true, force: true });
    }
  });

  it("overwrites existing files when replacing via a temp file", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "torlink-atomic-replace-"));
    const target = path.join(dir, "state.json");
    const tmp = `${target}.tmp`;
    try {
      await fs.writeFile(target, "old", "utf8");
      await fs.writeFile(tmp, "new", "utf8");

      await replaceFile(tmp, target);

      await expect(fs.readFile(target, "utf8")).resolves.toBe("new");
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  it("rewrites JSON state even when the destination already exists", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "torlink-atomic-json-"));
    const file = path.join(dir, "queue.json");
    try {
      await writeJsonAtomic(file, { version: 1 });
      await writeJsonAtomic(file, { version: 2 });

      await expect(fs.readFile(file, "utf8")).resolves.toContain('"version": 2');
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});
