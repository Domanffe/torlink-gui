import { useEffect } from "react";
import { Card } from "../components/Card";
import { ProgressBar } from "../components/ProgressBar";
import {
  formatBytes,
  formatBytesPerSec,
  formatEtaShort,
  formatRelativeMs,
  truncate,
} from "../../util/format";
import { sourceStyle } from "../../ui/theme";
import type { HistoryItem, QueueItem } from "../hooks/useTorrents";
import { useTorrents } from "../hooks/useTorrents";
import { confirmCancelDownload, confirmClearHistory, confirmRemoveHistory } from "../util/confirm";

function isFailed(it: QueueItem): boolean {
  return it.status === "failed";
}

function isPaused(it: QueueItem): boolean {
  return it.status === "paused";
}

export function DownloadsView() {
  const { list, addDownload, pause, resume, retry, remove, removeHistory, clearHistory } =
    useTorrents();
  const items = list.downloads;
  const history = list.history;

  const cancelItem = async (it: QueueItem): Promise<void> => {
    const choice = await confirmCancelDownload(truncate(it.name, 40));
    if (choice === "keep") await remove(it.id, false);
    else if (choice === "delete") await remove(it.id, true);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const it = items[0];
      if (!it) return;
      if (e.key === "p") {
        if (it.status === "downloading") void pause(it.id);
        else if (it.status === "paused") void resume(it.id);
      }
      if (e.key === "f" && isFailed(it)) void retry(it.id);
      if (e.key === "c") void cancelItem(it);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items, pause, resume, retry, remove]);

  const redownload = (h: HistoryItem): void => {
    void addDownload({
      id: h.id,
      name: h.name,
      magnet: h.magnet,
      source: h.source,
      sizeBytes: h.sizeBytes,
    });
  };

  const clearAll = async (): Promise<void> => {
    if (await confirmClearHistory()) await clearHistory();
  };

  return (
    <div className="downloads-view">
      <Card title="Active" subtitle={items.length ? `${items.length} items` : undefined}>
        {items.length === 0 ? (
          <p className="empty">No active downloads.</p>
        ) : (
          <ul className="download-list">
            {items.map((it) => {
              const paused = isPaused(it);
              const failed = isFailed(it);
              const ss = it.source ? sourceStyle(it.source as never) : null;
              return (
                <li key={it.id} className={`download-item${failed ? " download-item--failed" : ""}`}>
                  <div className="download-head">
                    <span className="download-icon" aria-hidden>
                      {failed ? "!" : paused ? "⏸" : "↓"}
                    </span>
                    <span className="download-name">{truncate(it.name, 48)}</span>
                    <span className="download-meta">
                      {formatBytes(it.totalBytes)}
                      {ss && (
                        <span className="tag" style={{ color: ss.color }}>
                          {ss.tag}
                        </span>
                      )}
                    </span>
                  </div>
                  <ProgressBar pct={it.progress} paused={paused || failed} />
                  {it.error && <p className="download-error">{it.error}</p>}
                  <div className="download-stats">
                    {failed ? (
                      <span className="muted">Failed · {it.progress}%</span>
                    ) : paused ? (
                      <span className="muted">Paused · {it.progress}%</span>
                    ) : (
                      <>
                        <span>{it.progress}%</span>
                        <span>{formatBytesPerSec(it.speed) || "…"}</span>
                        <span>· {it.peers} peers</span>
                        {it.eta != null && it.eta > 0 && (
                          <span>· {formatEtaShort(it.eta)}</span>
                        )}
                      </>
                    )}
                  </div>
                  <div className="download-actions">
                    {failed ? (
                      <button type="button" className="btn btn-primary" onClick={() => void retry(it.id)}>
                        Retry
                      </button>
                    ) : it.status === "downloading" ? (
                      <button type="button" className="btn btn-ghost" onClick={() => void pause(it.id)}>
                        Pause
                      </button>
                    ) : (
                      <button type="button" className="btn btn-ghost" onClick={() => void resume(it.id)}>
                        Resume
                      </button>
                    )}
                    <button type="button" className="btn btn-ghost" onClick={() => void cancelItem(it)}>
                      Cancel
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card
        title="Recently downloaded"
        subtitle={history.length ? `${history.length} items` : undefined}
        className="history-card"
      >
        {history.length === 0 ? (
          <p className="empty empty--compact">Completed downloads appear here.</p>
        ) : (
          <>
            <ul className="history-list">
              {history.map((h) => {
                const ss = h.source ? sourceStyle(h.source as never) : null;
                return (
                  <li key={h.id} className="history-item">
                    <div className="history-main">
                      <span className="history-name">{truncate(h.name, 52)}</span>
                      <span className="history-meta">
                        {formatBytes(h.sizeBytes)}
                        {ss && (
                          <span className="tag" style={{ color: ss.color }}>
                            {ss.tag}
                          </span>
                        )}
                        <span className="muted">· {formatRelativeMs(h.completedAt)}</span>
                      </span>
                    </div>
                    <div className="download-actions">
                      <button type="button" className="btn btn-ghost" onClick={() => redownload(h)}>
                        Download again
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={async () => {
                          if (await confirmRemoveHistory(truncate(h.name, 40))) {
                            await removeHistory(h.id);
                          }
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="history-footer">
              <button type="button" className="btn btn-ghost" onClick={() => void clearAll()}>
                Clear history
              </button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
