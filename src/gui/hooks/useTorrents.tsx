import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useToast, type ToastKind } from "../components/Toast";
import { errMsg } from "../util/errors";

export interface QueueItem {
  id: string;
  name: string;
  source?: string;
  magnet: string;
  dir: string;
  status: string;
  progress: number;
  totalBytes: number;
  downloadedBytes: number;
  speed: number;
  peers: number;
  eta?: number;
  error?: string;
}

export interface SeedItem {
  id: string;
  name: string;
  source?: string;
  magnet: string;
  dir: string;
  sizeBytes: number;
  status: string;
  uploadSpeed: number;
  uploaded: number;
  peers: number;
}

export interface HistoryItem {
  id: string;
  name: string;
  source?: string;
  magnet: string;
  dir: string;
  sizeBytes: number;
  completedAt: number;
}

export interface TorrentList {
  downloads: QueueItem[];
  seeds: SeedItem[];
  history: HistoryItem[];
}

export interface AppConfig {
  downloadDir: string;
  trackers: string[];
}

interface TorrentCtx {
  list: TorrentList;
  config: AppConfig | null;
  tauri: boolean;
  refreshConfig: () => Promise<void>;
  addDownload: (item: {
    id: string;
    name: string;
    magnet: string;
    source?: string;
    sizeBytes?: number;
  }) => Promise<void>;
  pause: (id: string) => Promise<void>;
  resume: (id: string) => Promise<void>;
  retry: (id: string) => Promise<void>;
  remove: (id: string, deleteFiles?: boolean) => Promise<void>;
  removeHistory: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
}

const Ctx = createContext<TorrentCtx | null>(null);
const EMPTY_LIST: TorrentList = { downloads: [], seeds: [], history: [] };

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function TorrentProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [list, setList] = useState<TorrentList>(EMPTY_LIST);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const tauri = isTauri();

  const refresh = useCallback(async () => {
    if (!tauri) return;
    setList(await invoke<TorrentList>("torrent_list"));
  }, [tauri]);

  const refreshConfig = useCallback(async () => {
    if (!tauri) return;
    setConfig(await invoke<AppConfig>("get_config"));
  }, [tauri]);

  const runAction = useCallback(
    async (action: () => Promise<void>, notice?: { message: string; kind: ToastKind }) => {
      if (!tauri) return;
      try {
        await action();
        if (notice) toast(notice.message, notice.kind);
        await refresh();
      } catch (e) {
        toast(errMsg(e), "error");
      }
    },
    [refresh, tauri, toast],
  );

  useEffect(() => {
    if (!tauri) return;
    void refresh();
    void refreshConfig();
    const unlisten = listen<TorrentList>("torrent-progress", (e) => setList(e.payload));
    return () => {
      void unlisten.then((fn) => fn());
    };
  }, [refresh, refreshConfig, tauri]);

  const addDownload = useCallback(
    async (item: {
      id: string;
      name: string;
      magnet: string;
      source?: string;
      sizeBytes?: number;
    }) => {
      if (!tauri) {
        toast("Downloads require the torlink desktop app.", "error");
        return;
      }
      try {
        const cfg = config ?? (await invoke<AppConfig>("get_config"));
        await invoke("torrent_add", {
          id: item.id,
          name: item.name,
          magnet: item.magnet,
          dir: cfg.downloadDir,
          source: item.source ?? null,
          sizeBytes: item.sizeBytes ?? null,
        });
        toast(`Added: ${item.name}`, "success");
        await refresh();
      } catch (e) {
        toast(errMsg(e), "error");
      }
    },
    [config, refresh, tauri, toast],
  );

  const pause = useCallback(
    (id: string) => runAction(() => invoke("torrent_pause", { id })),
    [runAction],
  );

  const resume = useCallback(
    (id: string) => runAction(() => invoke("torrent_resume", { id })),
    [runAction],
  );

  const retry = useCallback(
    (id: string) =>
      runAction(() => invoke("torrent_retry", { id }), {
        message: "Retrying download",
        kind: "info",
      }),
    [runAction],
  );

  const remove = useCallback(
    (id: string, deleteFiles = false) =>
      runAction(() => invoke("torrent_remove", { id, deleteFiles })),
    [runAction],
  );

  const removeHistory = useCallback(
    (id: string) => runAction(() => invoke("torrent_remove_history", { id })),
    [runAction],
  );

  const clearHistory = useCallback(
    () =>
      runAction(() => invoke("torrent_clear_history"), {
        message: "History cleared",
        kind: "info",
      }),
    [runAction],
  );

  return (
    <Ctx.Provider
      value={{
        list,
        config,
        tauri,
        refreshConfig,
        addDownload,
        pause,
        resume,
        retry,
        remove,
        removeHistory,
        clearHistory,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useTorrents(): TorrentCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTorrents requires TorrentProvider");
  return ctx;
}
