# Синхронизация с upstream

**torlink-gui** — desktop (Tauri + librqbit).  
[baairon/torlink](https://github.com/baairon/torlink) — TUI + WebTorrent.

Связь односторонняя: смотрим их репозиторий, переносим к себе то, что нужно. Обратно в оригинал ничего не отправляем — у нас другой продукт.

## Что брать

| Из upstream | Оставить только у нас |
| --- | --- |
| `src/sources/**` | `src-tauri/`, `src/gui/` |
| `src/sources/*.test.ts` | `src/sidecar/`, `src/core/` |
| иногда `src/util/format.ts` | |

Поверх адаптеров у нас свои слои: `meta.ts`, lazy `registry.ts`, `core/search.ts`, sidecar, Rust. После переноса фикса — `npm test` и быстрый поиск в dev.

## Remote

```sh
git remote -v
# origin    → Domanffe/torlink-gui
# upstream  → baairon/torlink
```

Если `upstream` нет:

```sh
git remote add upstream https://github.com/baairon/torlink.git
```

## Проверка

```sh
npm run sync:check
npm run sync:check -- --fetch   # с git fetch upstream
```

Покажет новые коммиты upstream в зоне sources, diff и наши отличия.

## Перенос фикса

1. `npm run sync:check -- --fetch`
2. `git show upstream/main -- src/sources/…`
3. Cherry-pick (`git cherry-pick -n <sha>`) или ручное копирование — второе часто проще из‑за `registry.ts` / `meta.ts`
4. `npm test`

## Когда можно пропустить

Chore без изменений в `src/sources/` (nix, version bump). Или если источник уже починен у нас, а upstream давно не трогали.

## Версии

`package.json` и `src-tauri/` ведём сами. Совпадение номеров с upstream ни о чём не говорит.
