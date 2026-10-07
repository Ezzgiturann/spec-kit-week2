---

description: "Task list for Quote of the Day"
---

# Tasks: Quote of the Day

**Input**: Design documents from `/specs/001-quote-of-the-day/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ (ui.md, storage.md,
modules.md), quickstart.md

**Tests**: REQUIRED. Constitution Principle II (Test-First, NON-NEGOTIABLE) mandates writing a
failing test before each implementation. In every story phase, run `npm test` after writing the
tests and confirm the new tests FAIL before starting the implementation tasks.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested
as its own increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story the task belongs to (US1–US4, from spec.md)
- All paths are relative to the repository root (single static frontend project, per plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Tooling and project skeleton (research.md R-1, R-6)

- [ ] T001 Create `package.json` at repo root with `"name": "quote-of-the-day"`, `"private": true`, `"type": "module"`, `"engines": { "node": ">=22" }` and scripts: `"test": "node --test --experimental-test-coverage --test-coverage-lines=80 --test-coverage-include='src/**/*.js' 'tests/**/*.test.js'"`, `"lint": "eslint . --max-warnings=0"`, `"format": "prettier --write ."`, `"format:check": "prettier --check ."`, `"serve": "python3 -m http.server 8000"`; also create empty directories `src/`, `tests/unit/`, `tests/integration/`
- [ ] T002 Install dev dependencies with `npm install --save-dev eslint @eslint/js globals prettier jsdom` (updates `package.json` and creates `package-lock.json`; no runtime dependencies)
- [ ] T003 [P] Create `eslint.config.js` (flat config): ignore `node_modules/`, `coverage/`, `.specify/`, `.claude/`, `specs/`; apply `@eslint/js` `recommended`; `globals.browser` for `src/**/*.js`; `globals.node` for `tests/**/*.js` and `eslint.config.js`
- [ ] T004 [P] Create `.prettierrc.json` (`{ "singleQuote": true, "printWidth": 100 }`) and `.prettierignore` listing `node_modules/`, `coverage/`, `package-lock.json`, `.specify/`, `.claude/`, `specs/`
- [ ] T005 [P] Create `.gitignore` containing `node_modules/` and `coverage/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Quote data, page shell, base styles and test helpers that every story needs

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 [P] Write failing test `tests/unit/quotes.test.js` (node:test + node:assert/strict) asserting for `QUOTES` from `src/quotes.js`: length is between 20 and 50 ("20–50 quotes"); `Object.isFrozen(QUOTES)` ("array is frozen") and every item is frozen; every `id` matches `^q\d{3}$` and ids are unique; every `text` is a string that is "Non-empty after trimming"; every `author` is a non-empty string or `null` ("`null` means unknown"); at least one quote has `author === null` and at least one quote's text is longer than 200 characters (needed for edge-case tests)
- [ ] T007 Create `src/quotes.js` exporting `QUOTES`: a frozen array of 24 frozen `{ id, text, author }` objects with ids `q001`–`q024`, using well-known public-domain or widely attributed quotes; include at least one with `author: null` and one with text longer than 200 characters; add a top comment that ids must never be reused for a different quote (data-model.md); make T006 pass
- [ ] T008 [P] Create `index.html`: `<!doctype html>`, `lang="en"`, charset + `<meta name="viewport" content="width=device-width, initial-scale=1">`, `<title>Quote of the Day</title>`, `<link rel="stylesheet" href="src/styles.css">`, body containing only `<main id="app"></main>`, a `<noscript>` message, and `<script type="module" src="src/main.js"></script>`
- [ ] T009 [P] Create `src/styles.css` base: color tokens on `:root` (background, text, muted, accent, focus) with a dark-mode override under `@media (prefers-color-scheme: dark)` meeting WCAG AA contrast; `body` with explicit background, system font stack; `#app` single column `max-width: 40rem`, centered, `padding: 0 16px`; `overflow-wrap: anywhere` on text; visible `:focus-visible` outline for all interactive elements; no horizontal scroll at 360 px (contracts/ui.md → Layout)
- [ ] T010 [P] Create `tests/helpers.js` exporting: `createTestDom()` → new jsdom `JSDOM('<!doctype html><main id="app"></main>')` returning `{ window, document, root }`; `sequenceRng(values)` → function returning the given numbers in order, cycling; `createFakeBackend({ throwOnAccess = false, throwOnWrite = false } = {})` → returns `{ getBackend, data }` where `data` is a `Map` and `getBackend()` either throws (when `throwOnAccess`) or returns an object with `getItem`, `setItem`, `removeItem` backed by `data`, whose `setItem` throws a `DOMException`-like error when `throwOnWrite` is true (the flag is a mutable property so a test can flip it mid-test)

**Checkpoint**: `npm test` passes (quotes test), `npm run lint` and `npm run format:check` pass

---

## Phase 3: User Story 1 - See a random quote (Priority: P1) 🎯 MVP

**Goal**: Opening the page shows exactly one random quote with its author (or "Unknown").

**Independent Test**: `npm run serve`, open the page several times: each time one complete
quote from the collection is shown, and more than one distinct quote appears across reloads.

### Tests for User Story 1 ⚠️ write first, confirm they FAIL

- [ ] T011 [P] [US1] Write `tests/unit/random.test.js` for `pickRandom(items, rng)` from `src/random.js` (contracts/modules.md): `rng = () => 0` → first item; `rng = () => 0.999` → last item; `rng = () => 0.5` with 4 items → index 2 (uses `Math.floor(rng() * n)`); empty array throws `RangeError`; default `rng` is `Math.random` (call without rng returns a member of the array)
- [ ] T012 [P] [US1] Add `mountTestApp({ quotes, rng } = {})` to `tests/helpers.js`: imports `QUOTES` from `src/quotes.js`, `pickRandom` and `pickDifferent` from `src/random.js`, `mountApp` from `src/view.js`; creates a test DOM via `createTestDom()`, calls `mountApp(root, { quotes: quotes ?? QUOTES, pickRandom, pickDifferent, rng: rng ?? sequenceRng([0]) })` and returns `{ window, document, root, app }` (these imports fail until T014/T015 exist — expected while tests are red; `pickDifferent` is a stub until T020)
- [ ] T013 [P] [US1] Write `tests/integration/app.test.js` section `describe('US1: see a random quote')` using `mountTestApp` and a 3-quote fixture (one with `author: null`, one whose text contains `<b>bold</b>`): page has `h1` "Quote of the Day"; `[data-testid="current-quote"]` is a `figure` with `aria-live="polite"`; its `blockquote` textContent equals the quote chosen by the rng (`sequenceRng([0.4])` → 2nd fixture quote); `figcaption` textContent is `— <author>`; quote with `author: null` shows `— Unknown`; text containing `<b>bold</b>` is rendered literally (no `b` element created); `app.destroy()` exists and runs without error

### Implementation for User Story 1

- [ ] T014 [US1] Create `src/random.js` exporting `pickRandom(items, rng = Math.random)` (throws `RangeError` on empty array; returns `items[Math.floor(rng() * items.length)]`) and a temporary `pickDifferent` that throws `Error('not implemented')` (replaced in T020); add JSDoc per contracts/modules.md; make T011 pass
- [ ] T015 [US1] Create `src/view.js` exporting `mountApp(root, deps)`: clears `root`; renders `h1` "Quote of the Day" and `figure[data-testid="current-quote"][aria-live="polite"]` containing `blockquote` and `figcaption`; picks the initial quote with `deps.pickRandom(deps.quotes, deps.rng)`; sets text ONLY via `textContent` (research.md R-7), author as `— ${author ?? 'Unknown'}`; keeps `currentId` in a closure; returns `{ destroy() }` that removes any listeners it added; make T013 pass
- [ ] T016 [US1] Create `src/main.js` (composition root, no exports): import `QUOTES`, `pickRandom`, `pickDifferent`, `mountApp`; call `mountApp(document.querySelector('#app'), { quotes: QUOTES, pickRandom, pickDifferent, rng: Math.random })`
- [ ] T017 [P] [US1] Add quote styles to `src/styles.css`: large readable `blockquote` (reset default margins), muted `figcaption`, long text wraps at 360 px without overflow

**Checkpoint**: `npm test` green; page served via `npm run serve` shows a random quote (quickstart.md scenarios 1–2)

---

## Phase 4: User Story 2 - Get a new quote on demand (Priority: P2)

**Goal**: A "New quote" button replaces the quote with a different one without reloading.

**Independent Test**: Press "New quote" 20 times: the quote changes every time and never repeats
consecutively; works with keyboard (Enter and Space).

**Depends on**: US1 (extends `src/view.js`)

### Tests for User Story 2 ⚠️ write first, confirm they FAIL

- [ ] T018 [P] [US2] Add `pickDifferent(items, currentId, rng)` tests to `tests/unit/random.test.js`: items `[a,b,c]`, current `b`: `rng 0` → `a`, `rng 0.5` → `c`, `rng 0.999` → `c` (draws `i = Math.floor(rng() * (n - 1))` and uses `i + 1` when `i >= currentIndex`); never returns current for 1,000 `Math.random` draws; single-item array returns that item; empty array throws `RangeError`; unknown `currentId` behaves like `pickRandom`
- [ ] T019 [P] [US2] Add `describe('US2: new quote')` to `tests/integration/app.test.js`: a `button` with accessible name "New quote" exists; clicking it changes the `blockquote` text to a different fixture quote; with the real `QUOTES` and `rng: Math.random`, 100 clicks never show the same quote twice in a row (SC-003); with a 1-quote fixture, clicking keeps that quote and throws nothing; after clicking, `document.activeElement` is still the "New quote" button

### Implementation for User Story 2

- [ ] T020 [US2] Replace the stub `pickDifferent` in `src/random.js` with the single-draw algorithm from research.md R-2 (throws `RangeError` on empty; returns the only item when length is 1; falls back to `pickRandom` when `currentId` is not found); make T018 pass
- [ ] T021 [US2] In `src/view.js` add a `button[type="button"]` "New quote" after the figure; on click set the current quote to `deps.pickDifferent(deps.quotes, currentId, deps.rng)` and re-render the figure text; do not move focus; register the listener so `destroy()` removes it; make T019 pass
- [ ] T022 [P] [US2] Add button styles to `src/styles.css` (min 44×44 px touch target, hover/active states, uses tokens)

**Checkpoint**: `npm test` green; quickstart.md scenarios 3–4 pass

---

## Phase 5: User Story 3 - Favorite a quote and keep it after reload (Priority: P3)

**Goal**: Toggle the current quote as a favorite; state persists in `localStorage` across reloads;
if storage is unavailable, favorites work for the visit and a notice is shown.

**Independent Test**: Favorite a quote, reload until it reappears → still favorited; unfavorite,
reload → not favorited. In a storage-blocked browser, the notice appears.

**Depends on**: US1 (extends `src/view.js`); independent of US2

### Tests for User Story 3 ⚠️ write first, confirm they FAIL

- [ ] T023 [P] [US3] Write `tests/unit/storage.test.js` for `createStorage(getBackend)` from `src/storage.js` using `createFakeBackend`: working backend → `persistent === true`, `write` returns `true`, `read` returns written value, probe key `qotd.__probe__` is not left in `data`; `throwOnAccess` → `persistent === false` and read/write still work in memory; probe `setItem` throws → `persistent === false`; flipping `throwOnWrite = true` after creation → next `write` returns `false`, `persistent` becomes `false`, and `read` returns the value just written (adapter switched to memory, keeping prior values); `read` of a missing key returns `null`; `read`/`write` never throw
- [ ] T024 [P] [US3] Write `tests/unit/favorites.test.js` for `src/favorites.js` (contracts/storage.md "Load algorithm"): `STORAGE_KEY === 'qotd.favorites.v1'`; `parseFavorites` returns `[]` for `null`, `'not json'`, `'42'`, `'{"version":2,"ids":["q001"]}'`, `'{"version":1,"ids":"q001"}'`; drops non-strings, unknown ids and duplicates keeping first occurrence (`{"version":1,"ids":["q999","q001",1,"q001","q002"]}` → `['q001','q002']`); `createFavorites(storage, knownIds)`: loads existing favorites; `toggle(id)` on a non-favorite returns `true` and puts the id FIRST; toggling again returns `false` and removes it; re-favoriting moves it to the front; each change writes exactly `JSON.stringify({ version: 1, ids })` to `STORAGE_KEY`; `remove` of an absent id is a no-op and does not notify; `toggle`/`remove` with an unknown id throw `RangeError`; `ids()` returns a copy (mutating it does not affect the store); `has(id)` reflects state; `subscribe(listener)` is called with the new ids after each change and the returned function unsubscribes; `isPersistent()` mirrors `storage.persistent`, including after a failed write
- [ ] T025 [US3] Extend `mountTestApp` in `tests/helpers.js` to accept `{ backend }` (default `createFakeBackend()`), build `storage = createStorage(backend.getBackend)` and `favorites = createFavorites(storage, new Set(quotes.map((q) => q.id)))`, pass `favorites` into `mountApp` deps, and return `backend` and `favorites` too (so a test can "reload" by mounting a second app with the same `backend`)
- [ ] T026 [US3] Add `describe('US3: favorite')` to `tests/integration/app.test.js`: a `button` named "Favorite" has `aria-pressed="false"`; clicking sets `"true"`, clicking again sets `"false"`; favorite, then remount with the same `backend` and same rng → `aria-pressed="true"` (reload persistence); unfavorite, remount → `"false"`; after "New quote" the toggle reflects the new quote's state; icon span is `aria-hidden="true"` showing ★ when pressed and ☆ when not; with `createFakeBackend({ throwOnAccess: true })` an element `[data-testid="storage-notice"][role="status"]` shows "Favorites can't be saved in this browser; they'll be lost when you leave the page." and favoriting still works; with a working backend the notice is absent, and it appears after flipping `throwOnWrite = true` and toggling

### Implementation for User Story 3

- [ ] T027 [P] [US3] Create `src/storage.js` exporting `createStorage(getBackend = () => globalThis.localStorage)` per research.md R-4 and contracts/modules.md: probe by `setItem`/`removeItem` of `qotd.__probe__` in `try/catch` (also catching a throwing `getBackend()`); return adapter `{ persistent, read(key), write(key, value) }` that never throws; on a failed write copy nothing is lost — switch to an internal `Map` (store the value there), set `persistent = false`, return `false`; make T023 pass
- [ ] T028 [P] [US3] Create `src/favorites.js` exporting `STORAGE_KEY`, `parseFavorites(raw, knownIds)` and `createFavorites(storage, knownIds)` exactly per contracts/modules.md and contracts/storage.md (newest first, "Each id appears at most once and must exist in the collection", write full value after every change, notify subscribers with a copy of ids); make T024 pass
- [ ] T029 [US3] In `src/view.js` add the favorite toggle after the figure: `button[type="button"]` with text label "Favorite" (visually labelled) plus `span[aria-hidden="true"]` showing ★/☆, and `aria-pressed` reflecting `deps.favorites.has(currentId)`; click → `deps.favorites.toggle(currentId)`; subscribe to `deps.favorites` to refresh the toggle and to show/hide the storage notice (`p[role="status"][data-testid="storage-notice"]` rendered below the `h1` only when `!deps.favorites.isPersistent()`); refresh the toggle on "New quote"; unsubscribe in `destroy()`; make T026 pass (T019/T013 must stay green)
- [ ] T030 [US3] Update `src/main.js`: build `storage = createStorage()` and `favorites = createFavorites(storage, new Set(QUOTES.map((q) => q.id)))` and pass `favorites` into `mountApp`
- [ ] T031 [P] [US3] Add styles to `src/styles.css` for the favorite toggle (accent color when `[aria-pressed="true"]`) and the storage notice (distinct, non-alarming banner)

**Checkpoint**: `npm test` green; quickstart.md scenarios 5, 9, 10, 12 pass

---

## Phase 6: User Story 4 - See and manage all favorites (Priority: P4)

**Goal**: A list of all favorites below the current quote, newest first, each removable.

**Independent Test**: Favorite three quotes → all listed newest first; reload → still listed;
remove one from the list → gone, also after reload; when the removed one is the current quote,
the main toggle updates.

**Depends on**: US3 (uses `src/favorites.js` and the toggle in `src/view.js`)

### Tests for User Story 4 ⚠️ write first, confirm they FAIL

- [ ] T032 [US4] Add `describe('US4: favorites list')` to `tests/integration/app.test.js`: `h2` "Your favorites" exists; with no favorites `[data-testid="favorites-empty"]` shows "No favorites yet." with `tabindex="-1"` and `[data-testid="favorites-list"]` is hidden; favoriting adds an `li` at the TOP containing text + ` — ` + author (or `Unknown`); after favoriting three quotes and remounting with the same backend, the list order is newest first; each `li` has a `button` with visible text "Remove" and `aria-label` `"Remove from favorites: " + text.slice(0, 60) + (text.length > 60 ? '…' : '')`; clicking Remove on the current quote's entry removes the `li` AND sets the main toggle to `aria-pressed="false"`; removal persists after remount; focus after removal goes to the next entry's Remove button, else the previous one, else the empty-state message; removing the last entry hides the list and shows the empty message; a >200-character quote is rendered in full in the list

### Implementation for User Story 4

- [ ] T033 [US4] In `src/view.js` render a favorites section after the controls: `h2` "Your favorites", `ul[data-testid="favorites-list"]` and `p[data-testid="favorites-empty"][tabindex="-1"]` "No favorites yet."; build entries from `deps.favorites.ids()` mapped to quotes (text and author via `textContent` only), each with a `button[type="button"]` "Remove" and the `aria-label` from contracts/ui.md; clicking calls `deps.favorites.remove(id)`; re-render the list from the existing `subscribe` listener so the list and the main toggle always agree (FR-015); toggle `hidden` on the list/empty message
- [ ] T034 [US4] In `src/view.js` implement focus management after a Remove click (FR-017): remember the removed entry's index before calling `remove`, then after re-render focus the Remove button at the same index (next entry), else index − 1 (previous), else the empty-state message; make T032 pass
- [ ] T035 [P] [US4] Add favorites list styles to `src/styles.css`: section separated from the current quote, list entries with readable spacing, Remove buttons with ≥ 44 px touch target, long entries wrap at 360 px

**Checkpoint**: `npm test` green; quickstart.md scenarios 6–8, 11, 13 pass

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Merge gates and documentation (constitution, Development Workflow §3)

- [ ] T036 Run `npm run format`, then `npm run lint`, `npm run format:check`, and `npm test`; fix every warning/failure until all pass and coverage reports ≥ 80% lines for `src/**/*.js`
- [ ] T037 [P] Create `README.md` at repo root: one-paragraph description, `npm install`, `npm run serve` (note `file://` is unsupported, research.md R-1), `npm test` / `npm run lint` / `npm run format:check`, and a link to `specs/001-quote-of-the-day/`
- [ ] T038 Run every manual scenario in `specs/001-quote-of-the-day/quickstart.md` (1–13) in a real browser; for any failure, fix the code with a regression test first (Principle II) and re-run

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none. T002 after T001; T003–T005 parallel after T001.
- **Foundational (Phase 2)**: after Setup. T006→T007; T008, T009, T010 parallel. BLOCKS all stories.
- **US1 (Phase 3)**: after Foundational.
- **US2 (Phase 4)** and **US3 (Phase 5)**: each after US1; independent of each other, but both
  edit `src/view.js`, `src/main.js`, and `tests/integration/app.test.js`, so do them one after the
  other (P2 first) unless working on separate branches.
- **US4 (Phase 6)**: after US3.
- **Polish (Phase 7)**: after the stories you want to ship.

### User Story Dependencies

```text
Setup → Foundational → US1 ─┬─ US2
                            └─ US3 ── US4
```

### Within Each User Story

- Tests written and FAILING before implementation (Principle II)
- Pure modules (`random.js`, `storage.js`, `favorites.js`) before `view.js`
- `view.js` before `main.js` wiring
- Styles can be done any time within the phase ([P])

### Parallel Opportunities

- Phase 1: T003, T004, T005
- Phase 2: T006 (then T007) alongside T008, T009, T010
- US1: T011, T012, T013 (tests, different files); T017 alongside T014–T016
- US2: T018, T019; T022 alongside T020–T021
- US3: T023, T024 (tests); T027, T028 (modules); T031 alongside
- US4: T035 alongside T033–T034
- Polish: T037 alongside T036

---

## Parallel Example: User Story 3

```bash
# Tests first, in parallel (different files):
Task: "Write tests/unit/storage.test.js for createStorage (T023)"
Task: "Write tests/unit/favorites.test.js for parseFavorites/createFavorites (T024)"

# Then the two pure modules in parallel:
Task: "Create src/storage.js (T027)"
Task: "Create src/favorites.js (T028)"

# Styles any time during the phase:
Task: "Favorite toggle + notice styles in src/styles.css (T031)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup → Phase 2 Foundational
2. Phase 3 (US1) → **STOP and VALIDATE**: `npm test`, quickstart scenarios 1–2
3. Demo: a page that shows a random quote

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. + US1 → random quote (MVP)
3. + US2 → "New quote" button
4. + US3 → favorite toggle with persistence
5. + US4 → favorites list
6. Polish → merge gates and full quickstart pass

Each increment keeps all previous tests green.

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- Verify new tests fail before implementing; commit after each task or logical group
- Never set quote/author text with `innerHTML` (research.md R-7)
- Element names, labels and `data-testid` values come from contracts/ui.md — do not invent new ones
