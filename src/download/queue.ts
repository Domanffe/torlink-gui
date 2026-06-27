import { EventEmitter } from "node:events";
import { TorrentEngine } from "./engine";
import { saveQueue, saveQueueSync } from "./persist";
import { saveHistory, type HistoryItem } from "./history";
import type { QueueItem } from "./types";
import type { SourceId } from "../sources/types";

const POLL_MS = 500;
const HISTORY_MAX = 500;

export interface AddInput {
  id: string;
  name: string;
  magnet: string;
  source?: SourceId;
  sizeBytes?: number;
}

export class DownloadQueue extends EventEmitter {
  private items = new Map<string, QueueItem>();
  private engine = new TorrentEngine();
  private poll: ReturnType<typeof setInterval> | null = null;
  private history: HistoryItem[] = [];

  getItems(): QueueItem[] {
    return [...this.items.values()].sort((a, b) => b.addedAt - a.addedAt);
  }

  get activeCount(): number {
    let n = 0;
    for (const it of this.items.values()) if (it.status === "downloading") n++;
    return n;
  }

  has(id: string): boolean {
    return this.items.has(id);
  }

  add(input: AddInput, dir: string): void {
    const existing = this.items.get(input.id);
    if (existing && existing.status !== "failed") return;
    const item: QueueItem = existing
      ? { ...existing, status: "downloading", error: undefined, speed: 0 }
      : {
          id: input.id,
          name: input.name,
          source: input.source,
          magnet: input.magnet,
          dir,
          status: "downloading",
          progress: 0,
          totalBytes: input.sizeBytes ?? 0,
          downloadedBytes: 0,
          speed: 0,
          peers: 0,
          addedAt: Date.now(),
        };
    this.items.set(item.id, item);
    this.startEngine(item);
    this.ensurePoll();
    this.changed();
    void this.persist();
  }

  private startEngine(item: QueueItem): void {
    this.engine.add(item.id, item.magnet, item.dir, {
      onMetadata: (meta) => {
        const it = this.items.get(item.id);
        if (!it) return;
        if (meta.name) it.name = meta.name;
        if (meta.total) it.totalBytes = meta.total;
        it.files = meta.files;
        this.changed();
        void this.persist();
      },
      onDone: () => {
        const it = this.items.get(item.id);
        if (!it) return;
        if (it.totalBytes) it.downloadedBytes = it.totalBytes;
        this.complete(it);
      },
      onError: (msg) => {
        const it = this.items.get(item.id);
        if (!it) return;
        it.status = "failed";
        it.error = msg;
        it.speed = 0;
        it.peers = 0;
        this.changed();
        void this.persist();
        this.maybeStopPoll();
      },
    });
  }

  private complete(it: QueueItem): void {
    this.recordHistory(it);
    this.items.delete(it.id);
    this.emit("completed", it.name);
    this.changed();
    void this.persist();
    this.maybeStopPoll();
  }

  private tick(): void {
    let any = false;
    for (const it of this.items.values()) {
      if (it.status !== "downloading") continue;
      const s = this.engine.stats(it.id);
      if (!s) continue;
      it.progress = Math.min(100, Math.round(s.progress * 100));
      it.downloadedBytes = s.downloaded;
      if (s.total) it.totalBytes = s.total;
      it.speed = s.speed;
      it.peers = s.peers;
      it.eta =
        s.timeRemaining > 0 && Number.isFinite(s.timeRemaining)
          ? s.timeRemaining / 1000
          : undefined;
      if (s.name) it.name = s.name;
      any = true;
    }
    if (any) this.changed();
  }

  private ensurePoll(): void {
    if (this.poll) return;
    this.poll = setInterval(() => this.tick(), POLL_MS);
    this.poll.unref();
  }

  private maybeStopPoll(): void {
    if (this.activeCount === 0 && this.poll) {
      clearInterval(this.poll);
      this.poll = null;
    }
  }

  pause(id: string): void {
    const it = this.items.get(id);
    if (!it || it.status !== "downloading") return;
    it.status = "paused";
    it.speed = 0;
    it.peers = 0;
    it.eta = undefined;
    this.engine.remove(id);
    this.changed();
    void this.persist();
    this.maybeStopPoll();
  }

  resume(id: string): void {
    const it = this.items.get(id);
    if (!it || it.status !== "paused") return;
    it.status = "downloading";
    this.startEngine(it);
    this.ensurePoll();
    this.changed();
    void this.persist();
  }

  togglePause(id: string): void {
    const it = this.items.get(id);
    if (!it) return;
    if (it.status === "downloading") this.pause(id);
    else if (it.status === "paused") this.resume(id);
  }

  cancel(id: string): void {
    if (!this.items.has(id)) return;
    this.engine.remove(id);
    this.items.delete(id);
    this.changed();
    void this.persist();
    this.maybeStopPoll();
  }

  retry(id: string): void {
    const it = this.items.get(id);
    if (!it || it.status !== "failed") return;
    it.status = "downloading";
    it.error = undefined;
    this.startEngine(it);
    this.ensurePoll();
    this.changed();
    void this.persist();
  }

  retryFailed(): void {
    for (const it of [...this.items.values()]) {
      if (it.status === "failed") this.retry(it.id);
    }
  }

  restore(items: QueueItem[]): void {
    for (const raw of items) {
      this.items.set(raw.id, raw);
      if (raw.status === "downloading") this.startEngine(raw);
    }
    if (this.activeCount > 0) this.ensurePoll();
    this.changed();
  }

  restoreHistory(items: HistoryItem[]): void {
    this.history = items.slice(0, HISTORY_MAX);
  }

  getHistory(): HistoryItem[] {
    return this.history;
  }

  private recordHistory(it: QueueItem): void {
    const rec: HistoryItem = {
      id: it.id,
      name: it.name,
      source: it.source,
      sizeBytes: it.totalBytes,
      magnet: it.magnet,
      dir: it.dir,
      completedAt: Date.now(),
    };
    this.history = [rec, ...this.history.filter((h) => h.id !== it.id)].slice(0, HISTORY_MAX);
    void saveHistory(this.history).catch(() => {});
  }

  removeHistory(id: string): void {
    const next = this.history.filter((h) => h.id !== id);
    if (next.length === this.history.length) return;
    this.history = next;
    void saveHistory(this.history).catch(() => {});
    this.changed();
  }

  clearHistory(): void {
    if (this.history.length === 0) return;
    this.history = [];
    void saveHistory(this.history).catch(() => {});
    this.changed();
  }

  private changed(): void {
    this.emit("update");
  }

  private async persist(): Promise<void> {
    await saveQueue(this.getItems()).catch(() => {});
  }

  suspend(): void {
    for (const it of this.items.values()) {
      if (it.status === "downloading") {
        it.status = "paused";
        it.speed = 0;
        it.peers = 0;
        it.eta = undefined;
      }
    }
    saveQueueSync(this.getItems());
    if (this.poll) {
      clearInterval(this.poll);
      this.poll = null;
    }
    this.engine.destroy();
  }
}
