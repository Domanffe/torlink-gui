import { loadConfig, type Config } from "../config/config";
import { DownloadQueue } from "../download/queue";
import { loadQueue, loadSeeds } from "../download/persist";
import { loadHistory } from "../download/history";
import { reconcileQueue } from "../download/reconcile";

export interface BootState {
  config: Config;
  queue: DownloadQueue;
}

/** Load config and restore download state in parallel. */
export async function bootApp(): Promise<BootState> {
  const [cfg, queueRaw, history, seeds] = await Promise.all([
    loadConfig(),
    loadQueue(),
    loadHistory(),
    loadSeeds(),
  ]);

  const queue = new DownloadQueue();
  queue.setTrackers(cfg.trackers);
  queue.restore(reconcileQueue(queueRaw));
  queue.restoreHistory(history);
  queue.restoreSeeds(seeds);

  return { config: cfg, queue };
}
