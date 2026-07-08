# Синхронизация с upstream

Форк **torlink-gui** — desktop (Tauri + librqbit).  
[baairon/torlink](https://github.com/baairon/torlink) — TUI + WebTorrent, GUI у них не планируется.

Связь односторонняя: **смотрим upstream → переносим к себе вручную или cherry-pick**. PR в оригинал не делаем.

## Что синхронизировать

| Брать из upstream | Не трогать |
| --- | --- |
| `src/sources/**` | `src-tauri/`, `src/gui/` |
| тесты `src/sources/*.test.ts` | `src/ui/` (Ink TUI) |
| иногда `src/util/format.ts` | `src/download/engine.ts` (у них WebTorrent) |
| | `package.json` scripts под TUI |

У нас поверх источников свои слои: `meta.ts`, lazy `registry.ts`, `core/search.ts`, sidecar, Rust. После переноса фикса адаптера проверь, что sidecar и GUI search всё ещё работают (`npm test`, `npm run dev:tauri`).

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

## Регулярная проверка

```sh
npm run sync:check          # отчёт без fetch
npm run sync:check -- --fetch   # сначала git fetch upstream
```

Скрипт покажет:

- коммиты в upstream по `src/sources/`, которых нет у нас;
- diff по зоне синхронизации;
- наши локальные изменения в той же зоне (чтобы не затереть своё).

## Как перенести фикс

1. `npm run sync:check -- --fetch`
2. Посмотреть коммит: `git show upstream/main -- src/sources/foo.ts`
3. Варианты:
   - **cherry-pick** (если коммит только sources):  
     `git cherry-pick -n <sha>` → правки → `git commit`
   - **ручной перенос** — часто проще из-за `registry.ts` / `meta.ts`
4. `npm test` и быстрый поиск в dev

## Когда можно не смотреть upstream

- Только chore (nix, version bump) без изменений в `src/sources/`
- Ты сам починил источник и upstream мёртвый

Подписка **Watch → Releases** на baairon/torlink — опционально, на случай если снова оживут.

## Версии

Версию npm (`package.json`) и Tauri (`src-tauri/`) ведём **независимо** от upstream. Совпадение 1.3.x / 1.4.x ни о чём не говорит.
