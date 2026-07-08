import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { useCallback, useState } from "react";

export function useUpdater(tauri: boolean) {
  const [checking, setChecking] = useState(false);
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);

  const checkForUpdate = useCallback(
    async (install = false): Promise<string | null> => {
      if (!tauri) return null;
      setChecking(true);
      try {
        const update = await check();
        if (!update) {
          setUpdateVersion(null);
          return null;
        }
        setUpdateVersion(update.version);
        if (install) {
          await update.downloadAndInstall();
          await relaunch();
        }
        return update.version;
      } catch {
        return null;
      } finally {
        setChecking(false);
      }
    },
    [tauri],
  );

  return { checking, updateVersion, checkForUpdate };
}
