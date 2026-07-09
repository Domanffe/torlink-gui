import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const keyPath = path.join("src-tauri", ".updater-key.pem");
const env = { ...process.env };

if (!env.TAURI_SIGNING_PRIVATE_KEY && existsSync(keyPath)) {
  env.TAURI_SIGNING_PRIVATE_KEY = readFileSync(keyPath, "utf8").trim();
}

const result = spawnSync("tauri", ["build"], {
  stdio: "inherit",
  env,
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
