import { Card } from "../components/Card";
import { truncate } from "../../util/format";
import type { SeedItem } from "../hooks/useTorrents";
import { useTorrents } from "../hooks/useTorrents";
import { useFormat } from "../hooks/useFormat";
import { useLocale } from "../i18n/LocaleProvider";
import { UploadIcon, UiIcon } from "../icons";
import { confirmCancelDownload } from "../util/confirm";

export function SeedingView() {
  const { t, messages } = useLocale();
  const fmt = useFormat();
  const { list, pause, resume, remove } = useTorrents();
  const items = list.seeds;
  const confirm = messages.confirm;

  const stopSeed = async (it: SeedItem): Promise<void> => {
    const choice = await confirmCancelDownload(truncate(it.name, 40), confirm);
    if (choice === "keep") await remove(it.id, false);
    else if (choice === "delete") await remove(it.id, true);
  };

  return (
    <Card
      title={t("seeding.title")}
      subtitle={items.length ? t("seeding.items", { count: items.length }) : undefined}
    >
      {items.length === 0 ? (
        <p className="empty">{t("seeding.empty")}</p>
      ) : (
        <ul className="download-list">
          {items.map((it) => {
            const paused = it.status === "paused";
            return (
              <li key={it.id} className="download-item">
                <div className="download-head">
                  <span className="download-icon" aria-hidden>
                    <UiIcon icon={UploadIcon} size={17} />
                  </span>
                  <span className="download-name">{truncate(it.name, 48)}</span>
                  <span className="download-meta">{fmt.bytes(it.sizeBytes)}</span>
                </div>
                <div className="download-stats">
                  {paused ? (
                    <span className="muted">{t("seeding.paused")}</span>
                  ) : (
                    <>
                      <span>{fmt.bytesPerSec(it.uploadSpeed)}</span>
                      <span>· {t("seeding.uploaded", { amount: fmt.bytes(it.uploaded) })}</span>
                      <span>· {t("seeding.peers", { count: it.peers })}</span>
                    </>
                  )}
                </div>
                <div className="download-actions">
                  {it.status === "seeding" ? (
                    <button type="button" className="btn btn-ghost" onClick={() => void pause(it.id)}>
                      {t("seeding.pause")}
                    </button>
                  ) : (
                    <button type="button" className="btn btn-ghost" onClick={() => void resume(it.id)}>
                      {t("seeding.resume")}
                    </button>
                  )}
                  <button type="button" className="btn btn-ghost" onClick={() => void stopSeed(it)}>
                    {t("seeding.stop")}
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
