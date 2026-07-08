export interface TorrentProgress {
  progress: number;
  downloaded: number;
  total: number;
  speed: number;
  uploadSpeed: number;
  uploaded: number;
  peers: number;
  timeRemaining: number;
  name: string;
}

export interface TorrentMeta {
  name: string;
  total: number;
  files: number;
  torrentFile?: Uint8Array;
}

export interface AddHandlers {
  onMetadata?: (meta: TorrentMeta) => void;
  onDone?: () => void;
  onError?: (message: string) => void;
}

const DESKTOP_MSG =
  "Downloads require the torlink desktop app. Install from GitHub Releases or run: npm run build:tauri";

/** Stub — P2P is handled by librqbit in the Tauri app. CLI/TUI is search-only. */
export class TorrentEngine {
  add(_id: string, _source: string, _dir: string, handlers: AddHandlers, _announce?: string[]): void {
    handlers.onError?.(DESKTOP_MSG);
  }

  listenPort(): number | null {
    return null;
  }

  stats(_id: string): TorrentProgress | null {
    return null;
  }

  remove(_id: string): void {}

  destroy(): void {}
}
