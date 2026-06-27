import { spawn } from "node:child_process";

function run(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve) => {
    let out = "";
    try {
      const proc = spawn(cmd, args, { windowsHide: true });
      const timer = setTimeout(() => {
        try {
          proc.kill();
        } catch {}
        resolve("");
      }, 4000);
      timer.unref?.();
      proc.stdout.on("data", (d: Buffer) => (out += d.toString("utf8")));
      proc.on("error", () => {
        clearTimeout(timer);
        resolve("");
      });
      proc.on("close", () => {
        clearTimeout(timer);
        resolve(out);
      });
    } catch {
      resolve("");
    }
  });
}

const LINUX: [string, string[]][] = [
  ["wl-paste", ["--no-newline"]],
  ["xclip", ["-selection", "clipboard", "-o"]],
  ["xsel", ["-b"]],
];

export async function readClipboard(): Promise<string> {
  if (process.platform === "win32") {
    return (await run("powershell", ["-NoProfile", "-Command", "Get-Clipboard"])).trim();
  }
  if (process.platform === "darwin") {
    return (await run("pbpaste", [])).trim();
  }
  for (const [cmd, args] of LINUX) {
    const out = (await run(cmd, args)).trim();
    if (out) return out;
  }
  return "";
}
