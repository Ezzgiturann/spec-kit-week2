# Quickstart & Validation: Quote of the Day

How to run the page and prove the feature works. Details of the UI, storage format and module
APIs live in [contracts/](./contracts/); entities in [data-model.md](./data-model.md).

## Prerequisites

- Node.js ≥ 22 (for tests and tooling) — `node --version`
- A current browser
- Python 3 (or `npx serve`) to serve static files

## Setup

```bash
npm install          # dev tools only: eslint, prettier, jsdom
```

## Automated checks (merge gates)

```bash
npm test             # unit + integration tests, fails if line coverage < 80%
npm run lint         # zero warnings required
npm run format:check
```

Expected: all pass, coverage report shows ≥ 80% lines.

## Run the page

```bash
npm run serve        # = python3 -m http.server 8000
# open http://localhost:8000
```

Opening `index.html` directly from disk (`file://`) is not supported because browsers block ES
module scripts there (research.md R-1).

## Manual validation scenarios

| # | Steps | Expected | Spec |
|---|---|---|---|
| 1 | Open the page. | One quote with author (or "— Unknown") is visible within 1 s. | Story 1, SC-001 |
| 2 | Reload ~10 times. | More than one distinct quote appears. | Story 1 #3 |
| 3 | Press "New quote" ~20 times. | Quote changes every time; never the same twice in a row. | Story 2, SC-003 |
| 4 | Tab to "New quote", press Enter, then Space. | New quote each time. | Story 2 #3 |
| 5 | Press "Favorite". | Star fills; quote appears at top of "Your favorites". | Story 3 #1, Story 4 #2 |
| 6 | Favorite two more quotes, reload. | List shows all three, newest first; if a favorited quote is shown, its star is filled. | Story 3 #3, Story 4 #3, SC-008 |
| 7 | Press "Remove" on a list entry that is the current quote. | Entry disappears; main star empties; after reload still gone. | Story 4 #4–5, FR-015 |
| 8 | With keyboard, remove entries until none remain. | Focus moves to the next/previous Remove button, then to "No favorites yet." | FR-016, FR-017 |
| 9 | With a screen reader (VoiceOver: Cmd+F5), focus "Favorite". | Announced as toggle button with pressed/not pressed state. | Story 3 #5 |
| 10 | In DevTools → Application → Local Storage, set `qotd.favorites.v1` to `not json`, reload. | Page works, no error shown, no favorites. | FR-010 |
| 11 | Set it to `{"version":1,"ids":["q999","q001","q001"]}`, reload. | Only q001's quote is listed, once. | FR-010 |
| 12 | Open the page in a Safari private window with storage blocked, or a sandboxed iframe. | Notice "Favorites can't be saved…" shown; favoriting still works until reload. | FR-009 |
| 13 | DevTools device mode at 360 px width. | No horizontal scroll; long quotes wrap. | FR-012 |
