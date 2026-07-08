import { message } from "@tauri-apps/plugin-dialog";

export async function confirmCancelDownload(name: string): Promise<"keep" | "delete" | null> {
  const result = await message(`Cancel "${name}"?`, {
    title: "Cancel download",
    kind: "warning",
    buttons: {
      yes: "Keep files",
      no: "Delete files",
      cancel: "Back",
    },
  });
  if (result === "Keep files") return "keep";
  if (result === "Delete files") return "delete";
  return null;
}

export async function confirmClearHistory(): Promise<boolean> {
  const result = await message("Remove all completed downloads from history?", {
    title: "Clear history",
    kind: "warning",
    buttons: "YesNo",
  });
  return result === "Yes";
}

export async function confirmRemoveHistory(name: string): Promise<boolean> {
  const result = await message(`Remove "${name}" from history?`, {
    title: "Remove from history",
    kind: "warning",
    buttons: "YesNo",
  });
  return result === "Yes";
}
