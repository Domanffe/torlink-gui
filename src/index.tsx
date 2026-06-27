import { render } from "ink";
import { parseCliArgs, HELP_TEXT } from "./cli/args";
import { VERSION } from "./version";
import { App } from "./ui/App";

const cmd = parseCliArgs(process.argv.slice(2));

if (cmd.kind === "help") {
  console.log(HELP_TEXT);
  process.exit(0);
}

if (cmd.kind === "version") {
  console.log(`torlink v${VERSION}`);
  process.exit(0);
}

if (cmd.kind === "invalid") {
  console.error(`error: unknown argument '${cmd.arg}'\n`);
  console.error(HELP_TEXT);
  process.exit(1);
}

process.stdout.write("\x1b[?1049h\x1b[22;0t\x1b]0;torlink\x07");
if (process.platform === "win32") process.title = "torlink";

let restored = false;
function restoreTerminal(): void {
  if (restored) return;
  restored = true;
  process.stdout.write("\x1b[?1000l\x1b[?1006l\x1b[?25h\x1b[23;0t\x1b[?1049l");
}

let exiting = false;
function forceExit(code = 0): void {
  if (exiting) return;
  exiting = true;
  try {
    app?.unmount();
  } catch {}
  restoreTerminal();
  setTimeout(() => process.exit(code), 80).unref();
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
