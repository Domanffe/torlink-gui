import { useCallback } from "react";
import { useToast } from "../components/Toast";
import { useLocale } from "../i18n/LocaleProvider";
import { copyText, openFolder } from "../util/desktop";

export function useDesktopActions() {
  const { toast } = useToast();
  const { t } = useLocale();

  const revealFolder = useCallback(
    async (dir: string): Promise<void> => {
      if (await openFolder(dir)) return;
      toast(t("toast.openFolderFailed"), "error");
    },
    [toast, t],
  );

  const copyMagnet = useCallback(
    async (magnet: string): Promise<void> => {
      if (await copyText(magnet)) {
        toast(t("toast.magnetCopied"), "success");
        return;
      }
      toast(t("toast.clipboardFailed"), "error");
    },
    [toast, t],
  );

  return { revealFolder, copyMagnet };
}
