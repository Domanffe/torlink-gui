import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ICONS = [
  "globe-icon",
  "gamepad-icon",
  "player-icon",
  "radio-icon",
  "sparkles-icon",
  "download-icon",
  "upload-icon",
  "magnifier-icon",
  "gear-icon",
  "triangle-alert-icon",
  "battery-pause-icon",
  "flame-icon",
];

const outDir = path.resolve("src/gui/icons");
await mkdir(outDir, { recursive: true });

let typesWritten = false;

for (const name of ICONS) {
  const res = await fetch(`https://itshover.com/r/${name}.json`);
  if (!res.ok) throw new Error(`${name}: ${res.status}`);
  const data = await res.json();
  for (const file of data.files) {
    const base = path.basename(file.path);
    if (base === "types.ts" && typesWritten) continue;
    if (base === "types.ts") typesWritten = true;
    await writeFile(path.join(outDir, base), file.content);
    console.log(`wrote ${base}`);
  }
}
