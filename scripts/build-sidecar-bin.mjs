#!/usr/bin/env node
/**
 * Package the search sidecar into a standalone binary for Tauri externalBin.
 * Output: src-tauri/binaries/search-sidecar-<target-triple>[.exe]
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(import.meta.url), "..", "..");
const input = join(root, "dist", "search-sidecar.cjs");

if (!existsSync(input)) {
  console.error("Missing dist/search-sidecar.cjs — run: npm run build:sidecar");
  process.exit(1);
}

const triple =
  process.env.TAURI_ENV_TARGET_TRIPLE ??
  (process.platform === "win32"
    ? "x86_64-pc-windows-msvc"
    : process.platform === "darwin"
      ? process.arch === "arm64"
        ? "aarch64-apple-darwin"
        : "x86_64-apple-darwin"
      : "x86_64-unknown-linux-gnu");

const pkgTargets = {
  "x86_64-pc-windows-msvc": "node22-win-x64",
  "x86_64-unknown-linux-gnu": "node22-linux-x64",
  "aarch64-unknown-linux-gnu": "node22-linux-arm64",
  "x86_64-apple-darwin": "node22-macos-x64",
  "aarch64-apple-darwin": "node22-macos-arm64",
};

const pkgTarget = pkgTargets[triple];
if (!pkgTarget) {
  console.error(`Unsupported target triple: ${triple}`);
  process.exit(1);
}

const outDir = join(root, "src-tauri", "binaries");
mkdirSync(outDir, { recursive: true });

const ext = triple.includes("windows") ? ".exe" : "";
const output = join(outDir, `search-sidecar-${triple}${ext}`);

console.log(`Packaging search sidecar → ${output}`);
execSync(`npx --yes @yao-pkg/pkg "${input}" --targets ${pkgTarget} --output "${output}"`, {
  stdio: "inherit",
  cwd: root,
});

console.log("Done.");
