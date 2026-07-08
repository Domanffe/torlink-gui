import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { AppConfig } from "../hooks/useTorrents";
import { useLocale } from "../i18n/LocaleProvider";
import type { LocalePref } from "../i18n/locale";
import { useToast } from "./Toast";
import { errMsg } from "../util/errors";

export function SettingsSheet({
  open: visible,
  onClose,
  config,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  config: AppConfig | null;
  onSaved: () => void;
}) {
  const { t, localePref, setLocalePref } = useLocale();
  const { toast } = useToast();
  const [downloadDir, setDownloadDir] = useState("");
  const [trackersText, setTrackersText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible || !config) return;
    setDownloadDir(config.downloadDir);
    setTrackersText(config.trackers.join("\n"));
  }, [visible, config]);

  if (!visible) return null;

  const pickFolder = async (): Promise<void> => {
    try {
      const picked = await open({
        directory: true,
        multiple: false,
        title: t("settings.pickFolderTitle"),
      });
      if (typeof picked === "string") setDownloadDir(picked);
    } catch (e) {
      toast(errMsg(e), "error");
    }
  };

  const save = async (): Promise<void> => {
    setSaving(true);
    try {
      const trackers = trackersText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      await invoke("set_config", {
        config: { downloadDir, trackers },
      });
      await invoke("torrent_set_trackers", { trackers });
      toast(t("settings.saved"), "success");
      onSaved();
      onClose();
    } catch (e) {
      toast(errMsg(e), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="settings-title">
        <header className="sheet-header">
          <h2 id="settings-title">{t("settings.title")}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t("settings.close")}>
            ×
          </button>
        </header>

        <div className="sheet-body">
          <label className="field">
            <span className="field-label">{t("settings.language")}</span>
            <select
              className="field-input field-select"
              value={localePref}
              onChange={(e) => setLocalePref(e.target.value as LocalePref)}
            >
              <option value="system">{t("settings.languageSystem")}</option>
              <option value="en">{t("settings.languageEn")}</option>
              <option value="ru">{t("settings.languageRu")}</option>
            </select>
          </label>

          <label className="field">
            <span className="field-label">{t("settings.downloadFolder")}</span>
            <div className="field-row">
              <input
                className="field-input"
                value={downloadDir}
                onChange={(e) => setDownloadDir(e.target.value)}
                spellCheck={false}
              />
              <button type="button" className="btn btn-secondary" onClick={() => void pickFolder()}>
                {t("settings.browse")}
              </button>
            </div>
          </label>

          <label className="field">
            <span className="field-label">{t("settings.extraTrackers")}</span>
            <span className="field-hint">{t("settings.trackersHint")}</span>
            <textarea
              className="field-textarea"
              value={trackersText}
              onChange={(e) => setTrackersText(e.target.value)}
              rows={5}
              spellCheck={false}
              placeholder={t("settings.trackersPlaceholder")}
            />
          </label>
        </div>

        <footer className="sheet-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {t("settings.cancel")}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => void save()} disabled={saving}>
            {saving ? t("settings.saving") : t("settings.save")}
          </button>
        </footer>
      </div>
    </div>
  );
}
