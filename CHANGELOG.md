# Changelog

## Unreleased

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
