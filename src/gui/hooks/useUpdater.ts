import { useCallback, useState } from "react";
import { runUpdateCheck, type UpdateCheckResult } from "../util/updateCheck";

export function useUpdater(tauri: boolean) {
  const [checking, setChecking] = useState(false);
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);

  const checkForUpdate = useCallback(
    async (install = false): Promise<UpdateCheckResult | null> => {
      if (!tauri) return null;
      setChecking(true);
      try {
        const result = await runUpdateCheck(install);
        if (result.status === "available") {
          setUpdateVersion(result.version);
        } else if (result.status === "current") {
          setUpdateVersion(null);
        }
        return result;
      } finally {
        setChecking(false);
      }
    },
    [tauri],
  );

  return { checking, updateVersion, checkForUpdate };
}
