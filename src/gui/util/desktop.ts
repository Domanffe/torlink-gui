import { invoke } from "@tauri-apps/api/core";
import { isTauri } from "./tauri";

export async function openFolder(path: string): Promise<boolean> {
  if (!isTauri() || !path) return false;
  try {
    await invoke("open_folder", { path });
    return true;
  } catch {
    return false;
  }
}

export async function copyText(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
