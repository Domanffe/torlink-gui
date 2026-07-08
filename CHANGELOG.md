# Changelog

## Unreleased

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
