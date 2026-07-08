import { Card } from "../components/Card";
import { formatBytes, formatBytesPerSec, truncate } from "../../util/format";
import type { SeedItem } from "../hooks/useTorrents";
import { useTorrents } from "../hooks/useTorrents";
import { confirmCancelDownload } from "../util/confirm";

export function SeedingView() {
  const { list, pause, resume, remove } = useTorrents();
  const items = list.seeds;

  const stopSeed = async (it: SeedItem): Promise<void> => {
    const choice = await confirmCancelDownload(truncate(it.name, 40));
    if (choice === "keep") await remove(it.id, false);
    else if (choice === "delete") await remove(it.id, true);
  };

  return (
    <Card title="Seeding" subtitle={items.length ? `${items.length} items` : undefined}>
      {items.length === 0 ? (
        <p className="empty">Nothing seeding.</p>
      ) : (
        <ul className="download-list">
          {items.map((it) => {
            const paused = it.status === "paused";
            return (
              <li key={it.id} className="download-item">
                <div className="download-head">
                  <span className="download-icon" aria-hidden>
                    ↑
                  </span>
                  <span className="download-name">{truncate(it.name, 48)}</span>
                  <span className="download-meta">{formatBytes(it.sizeBytes)}</span>
                </div>
                <div className="download-stats">
                  {paused ? (
                    <span className="muted">Paused</span>
                  ) : (
                    <>
                      <span>↑ {formatBytesPerSec(it.uploadSpeed)}</span>
                      <span>· {formatBytes(it.uploaded)} uploaded</span>
                      <span>· {it.peers} peers</span>
                    </>
                  )}
                </div>
                <div className="download-actions">
                  {it.status === "seeding" ? (
                    <button type="button" className="btn btn-ghost" onClick={() => void pause(it.id)}>
                      Pause
                    </button>
                  ) : (
                    <button type="button" className="btn btn-ghost" onClick={() => void resume(it.id)}>
                      Resume
                    </button>
                  )}
                  <button type="button" className="btn btn-ghost" onClick={() => void stopSeed(it)}>
                    Stop
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
