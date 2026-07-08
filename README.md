# torlink

Curated torrent search with a native desktop client.

This is a fork of [baairon/torlink](https://github.com/baairon/torlink). The search side is the same — FitGirl, YTS, 1337x, and the rest — but downloads run in a **Tauri** app through **librqbit**, not WebTorrent in the terminal.

## Install

Pick a build from [Releases](https://github.com/Domanffe/torlink-gui/releases):

- Windows — `.msi`
- macOS — `.dmg`
- Linux — `.AppImage`

No Node required for the desktop app.

If you only need search, `npx torlnk` still opens the web UI in a browser (Node 22+). Downloads from the browser build are not supported — use the desktop app for that.

## Desktop app

Search by category, queue downloads, pause and resume, seed when done. Settings (⚙ or `Ctrl+,`) let you change the download folder and add extra trackers. Closing the window sends the app to the system tray.

**Downloads** — pause, resume, retry on failure, cancel with a choice to keep or delete files on disk.

**History** — finished torrents sit under “Recently downloaded”; you can grab them again or clear the list.

**Shortcuts** (when the main view is focused): `/` focus search · `Tab` next section · `d` download · `p` pause · `f` retry · `c` cancel

## Build

```sh
git clone https://github.com/Domanffe/torlink-gui.git
cd torlink-gui
npm install
npm run dev:tauri      # dev window + search sidecar
npm run build:tauri    # installer in src-tauri/target/release/bundle/
npm test
```

The installer bundles **librqbit** (torrents) and a packaged **search-sidecar** binary.

## Sources

| Category | Sources |
| --- | --- |
| Games | FitGirl |
| Movies | YTS, The Pirate Bay, 1337x |
| TV | EZTV, The Pirate Bay, 1337x |
| Anime | Nyaa, SubsPlease |

Games are limited to FitGirl on purpose. If a source is down, the rest still answer.

## Upstream

Based on [baairon/torlink](https://github.com/baairon/torlink) (MIT). We track their **search source adapters** occasionally; see [docs/upstream.md](docs/upstream.md). No plans to merge GUI back upstream.

## Privacy

Nothing goes through our servers. torlink talks to trackers and peers directly. Completed torrents seed until you pause or stop them in the Seeding tab.
