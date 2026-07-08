import { render } from "ink";
import type { CliCommand } from "./cli/args";
import { App } from "./ui/App";

export function runTui(cmd: Extract<CliCommand, { kind: "tui" }>): void {
  process.stderr.write(
    "warning: terminal UI is deprecated; use the desktop app (torlnk) or browser GUI\n",
  );

  process.stdout.write("\x1b[?1049h\x1b[?25l\x1b[22;0t\x1b]0;torlink\x07");
  if (process.platform === "win32") process.title = "torlink";

  let restored = false;
  function restoreTerminal(): void {
    if (restored) return;
    restored = true;
    process.stdout.write("\x1b[?1000l\x1b[?1006l\x1b[?25h\x1b[23;0t\x1b[?1049l");
  }

  let exiting = false;
  function forceExit(code = 0): void {
    if (exiting) {
      restoreTerminal();
      process.exit(code);
    }
    exiting = true;
    try {
      app?.unmount();
    } catch {}
    restoreTerminal();
    process.exit(code);
  }

  const app = render(
    <App
      initialMagnet={cmd.initialMagnet}
      initialTorrent={cmd.initialTorrent}
      onQuit={() => forceExit(0)}
    />,
    { exitOnCtrlC: false },
  );

  app
    .waitUntilExit()
    .then(() => forceExit(0))
    .catch((err) => {
      restoreTerminal();
      console.error(err);
      process.exit(1);
    });

  process.on("SIGINT", () => forceExit(0));
  process.on("SIGTERM", () => forceExit(0));
  process.on("exit", restoreTerminal);

  process.on("uncaughtException", (err) => {
    restoreTerminal();
    console.error(err);
    process.exit(1);
  });
}
