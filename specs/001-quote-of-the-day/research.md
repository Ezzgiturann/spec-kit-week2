# Research: Quote of the Day

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-10-07

The user fixed the stack (plain HTML/CSS/JS, no backend, `localStorage`). No NEEDS
CLARIFICATION items remained in Technical Context; the decisions below resolve the remaining
design choices.

## R-1: Module format and how the page is served

- **Decision**: Native ES modules (`<script type="module" src="src/main.js">`), no bundler.
  Serve the folder over HTTP for development (`python3 -m http.server` or `npx serve`).
- **Rationale**: Modules give clear per-file boundaries and let the same files be imported by
  Node tests unchanged. All target browsers support them. No build step keeps the project simple
  (Principle IV).
- **Alternatives considered**: A single classic `<script>` (works from `file://`, but no module
  boundaries and harder to unit-test); a bundler such as Vite (adds tooling without a current
  need). Note: browsers block module scripts loaded from `file://`, so opening `index.html` by
  double-click is not supported — documented in quickstart.md.

## R-2: Random selection without immediate repeats

- **Decision**: `pickDifferent(items, currentId, rng)` picks uniformly among the other `n − 1`
  items: draw `i` in `[0, n−1)`, and skip over the current index. With `n = 1` it returns the
  only item. The RNG (`() => number in [0,1)`) is injected; production uses `Math.random`.
- **Rationale**: Exactly one draw, no retry loop, guaranteed "never the same twice in a row"
  (FR-005, SC-003), uniform over the remaining items. Injected RNG makes tests deterministic
  (Principle III).
- **Alternatives considered**: Re-roll until different (unbounded loop, harder to test);
  shuffled deck (guarantees full rotation, but more state than the spec asks for).

## R-3: Persisting favorites in localStorage

- **Decision**: One key `qotd.favorites.v1` holding
  `{"version":1,"ids":["q007","q002",...]}` — array order = most recently favorited first.
  On load: parse defensively, drop non-string, duplicate, and unknown ids (FR-010); on any parse
  error start empty. Write the whole value after every change.
- **Rationale**: Array order directly encodes the required newest-first ordering (FR-013)
  without timestamps. A version field allows future migrations. Writing the full (tiny) value is
  simpler than incremental updates.
- **Alternatives considered**: One key per favorite (harder to order and enumerate); storing
  timestamps (unneeded — only relative order is required); IndexedDB (async, heavier, no benefit
  at this size).

## R-4: Detecting unavailable storage

- **Decision**: `createStorage()` probes once by writing and removing a test key inside
  `try/catch` (also catching a throwing `window.localStorage` getter). On failure it returns an
  in-memory adapter with `persistent: false`; any later write that throws (e.g., quota) flips the
  adapter to non-persistent. The view shows a notice "Favorites can't be saved in this browser;
  they'll be lost when you leave the page." whenever `persistent` is false (FR-009).
- **Rationale**: Covers private mode, disabled storage, sandboxed iframes, and quota errors with
  one code path; the rest of the app never touches `localStorage` directly (Principle V).
- **Alternatives considered**: Checking `typeof localStorage` only (misses the cases that throw
  on access/write); failing silently (violates FR-009).

## R-5: Accessibility pattern

- **Decision**:
  - Favorite control on the current quote: a `<button>` with `aria-pressed="true|false"` and a
    stable label "Favorite"; visible ★/☆ icon is `aria-hidden`.
  - Quote region: `aria-live="polite"` so screen readers announce a new quote.
  - Favorites list: `<ul>` under a heading "Your favorites"; each entry has a "Remove" button
    whose `aria-label` is `Remove from favorites: <first 60 chars of text>…`.
  - After removing an entry, focus moves to the next entry's Remove button, else the previous
    one, else the empty-state message (made focusable with `tabindex="-1"`) (FR-017).
- **Rationale**: Native buttons give keyboard support for free; `aria-pressed` is the standard
  toggle-button pattern and announces state (Story 3, scenario 5).
- **Alternatives considered**: Checkbox styled as a star (works, but less conventional for
  "favorite"); custom `div` controls (need manual keyboard handling).

## R-6: Tooling and dev dependencies

- **Decision**:
  - **Tests**: Node's built-in `node:test` + `node:assert` (Node ≥ 22), coverage via
    `--experimental-test-coverage --test-coverage-lines=80`.
  - **DOM in tests**: `jsdom` (devDependency).
  - **Lint**: ESLint (flat config, `@eslint/js` recommended + browser globals).
  - **Format**: Prettier.
- **Justification (constitution Principle IV)**:
  - *jsdom*: integration tests need a DOM; writing one in-house is unreasonable. Widely used,
    actively maintained, MIT-licensed. Dev-only — never shipped.
  - *ESLint / Prettier*: required by constitution Principle I and the merge gates. Both actively
    maintained, MIT-licensed, dev-only.
  - No test framework dependency: the built-in runner covers our needs.
- **Alternatives considered**: Jest/Vitest (extra dependency and config for no added value
  here); Playwright browser tests (real-browser fidelity, but heavy install; the manual
  quickstart checks cover cross-browser rendering for v1); happy-dom (faster but less complete
  than jsdom).

## R-7: Rendering safety

- **Decision**: Set all quote and author text with `textContent`; never use `innerHTML` with
  data.
- **Rationale**: Quotes are built-in today, but this prevents markup injection if the data
  source ever changes, at no cost.
- **Alternatives considered**: Template strings with `innerHTML` (shorter, but unsafe by default).

## R-8: Built-in quote collection

- **Decision**: `src/quotes.js` exports a frozen array of 20–30 `{ id, text, author }` objects
  with ids `q001`, `q002`, …; `author` is `null` when unknown. Use well-known public-domain or
  widely attributed quotes; a unit test enforces unique ids and non-empty text.
- **Rationale**: Stable ids are needed for favorites across visits (FR-001); ids must never be
  reused for a different quote.
- **Alternatives considered**: Using the text itself as id (breaks favorites if a typo is fixed);
  array index as id (breaks when quotes are reordered or removed).

## Out of scope (confirmed)

- Syncing favorites across tabs while both are open (`storage` event) — not required by the spec;
  each tab reads the latest saved favorites on load.
- Daily-fixed quote, accounts, sharing, search/filter of favorites (spec Assumptions).
