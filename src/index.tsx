import { parseCliArgs, HELP_TEXT } from "./cli/args";
import { VERSION } from "./version";
import { runTui } from "./tui";

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

if (cmd.kind === "tui") {
  runTui(cmd);
} else if (cmd.kind === "search") {
  const { startSearchServer } = await import("./sidecar/search-server.js");
  await startSearchServer(Number(process.env.TORLINK_SEARCH_PORT ?? 3847));
  process.stdout.write("Search sidecar running. Press Ctrl+C to stop.\n");
} else {
  const { runBrowserGui } = await import("./browser-gui.js");
  await runBrowserGui();
}
