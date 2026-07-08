import { isInfoHash } from "../sources/magnet";

export type CliCommand =
  | { kind: "version" }
  | { kind: "help" }
  | { kind: "gui"; initialMagnet?: string; initialTorrent?: string }
  | { kind: "tui"; initialMagnet?: string; initialTorrent?: string }
  | { kind: "search" }
  | { kind: "invalid"; arg: string };

function launchArgs(args: string[]): { initialMagnet?: string; initialTorrent?: string } {
  const a = args[0];
  if (!a) return {};
  if (/^magnet:\?/i.test(a)) return { initialMagnet: a };
  if (isInfoHash(a)) return { initialMagnet: a };
  if (/\.torrent$/i.test(a)) return { initialTorrent: a };
  return {};
}

export function parseCliArgs(argv: string[]): CliCommand {
  const args = argv.filter((a) => a.trim() !== "");
  if (args.length === 0) return { kind: "gui" };
  const a = args[0]!;
  if (a === "--version" || a === "-v") return { kind: "version" };
  if (a === "--help" || a === "-h") return { kind: "help" };
  if (a === "--tui") return { kind: "tui", ...launchArgs(args.slice(1)) };
  if (a === "--search") return { kind: "search" };
  if (a === "--gui") return { kind: "gui", ...launchArgs(args.slice(1)) };
  if (/^magnet:\?/i.test(a)) return { kind: "gui", initialMagnet: a };
  if (isInfoHash(a)) return { kind: "gui", initialMagnet: a };
  if (/\.torrent$/i.test(a)) return { kind: "gui", initialTorrent: a };
  return { kind: "invalid", arg: a };
}

export const HELP_TEXT = `torlink — torrent search & download

usage
  torlnk                      open the GUI (browser fallback, or Tauri desktop app)
  torlnk --gui                same as default
  torlnk --tui                terminal UI (search only — downloads need desktop app)
  torlnk --search             search API server only (dev)
  torlnk "magnet:?xt=..."     start a download on launch
  torlnk path/to/file.torrent open a .torrent file on launch
  torlnk --version            print the version

desktop app: install from GitHub Releases for full download/seeding (librqbit)
tip: quote magnet links (they contain & characters)
`;
