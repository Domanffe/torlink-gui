# Changelog

## Unreleased

## 1.5.1 — 2026-07-11

### Added
- Each torrent downloads into its own subfolder under the configured download directory
- BitTorrented search source for Movies and TV (synced from upstream 1.4.0)
- EZTV "browse only" badge in search source strip
- Settings hint for per-torrent subfolders and restart notice when changing download folder

### Changed
- UI refresh: Vercel/Geist dark theme — neutral surfaces, white primary buttons, `#333` borders
- HTTP(S) tracker endpoints in default magnets for networks that block UDP (upstream 1.4.0)
- 1337x remembers its last working mirror between searches (upstream 1.4.0)
- Search streaming coalesces UI updates to avoid redraw bursts (upstream 1.4.0)
- Accessibility fallbacks for reduced motion preferences

### Fixed
- Download directory validation in settings (`set_config`)
- Torrent ID sanitization for cached `.torrent` metadata files
- Path re-validation on torrent resume and restore
- `SeedStatus::Missing` now persists correctly across restarts
- Search cache eviction (TTL + 200 entry cap)
- Sources without health data show "—" instead of misleading 0 seeders

## 1.5.0 — 2026-07-09

### Changed
- Removed deprecated Ink TUI and TypeScript download stack; desktop app is the only download path
- Hardened Tauri security (CSP, scoped shell capabilities, download path validation)
- Expanded test coverage for search, sources, and Rust backend
- Added Dependabot and dependency audits in CI

## 1.4.8 — 2026-07-08

### Fixed
- Desktop app no longer hangs on startup when torrent restore blocks on unreachable trackers
- Search source pages decode declared charsets correctly, fixing mojibake in titles
- CI and release workflows install Linux desktop deps and build sidecar binaries before Tauri

### Changed
- Updater endpoints prefer jsDelivr and raw.githubusercontent.com over GitHub Releases

## 1.4.7 — 2026-07-08

### Fixed
- Update check no longer shows "latest version" when the network or updater request fails
- Settings display the installed app version during update checks

### Changed
- Added fallback updater manifest at `updater/latest.json` on GitHub raw
- Release workflow syncs the updater mirror after each tagged build

## 1.4.6 — 2026-07-08

### Added
- Split CI and release workflows; tests run before release builds
- Open folder action in Downloads, History, and Seeding views
- Copy magnet button in search details

### Fixed
- Windows persistence: atomic JSON writes now replace existing files correctly
- Re-downloading from history no longer deletes completed torrent files
- Search sidecar no longer trusts a random process on port 3847
- Desktop client caches `.torrent` metadata for resume and reseed
- Main branch CI no longer requires updater signing keys

### Changed
- Tracker settings save through a single config path
- Version metadata synced across package, Tauri, and CLI entrypoints
