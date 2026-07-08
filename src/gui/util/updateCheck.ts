import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { errMsg } from "./errors";

export type UpdateCheckResult =
  | { status: "available"; version: string }
  | { status: "current" }
  | { status: "error"; message: string };

export async function runUpdateCheck(install: boolean): Promise<UpdateCheckResult> {
  try {
    const update = await check();
    if (!update) return { status: "current" };

    if (install) {
      await update.downloadAndInstall();
      await relaunch();
    }

    return { status: "available", version: update.version };
  } catch (e) {
    return { status: "error", message: errMsg(e) };
  }
}
