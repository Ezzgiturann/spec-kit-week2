# Data Model: Quote of the Day

**Feature**: [spec.md](./spec.md) | **Date**: 2026-10-07

## Quote

One entry of the built-in collection (`src/quotes.js`). Read-only at runtime.

| Field | Type | Rules |
|---|---|---|
| `id` | string | Required. Pattern `^q\d{3}$`. Unique within the collection. Never reused for a different quote, even after removal (FR-001). |
| `text` | string | Required. Non-empty after trimming. Displayed in full (no truncation in the main view). |
| `author` | string \| null | Optional. `null` means unknown → displayed as "Unknown" (FR-003). |

**Collection rules**: 20–50 quotes; array is frozen; validated by `tests/unit/quotes.test.js`.

## Favorites

The visitor's favorited quotes on this device/browser.

| Field | Type | Rules |
|---|---|---|
| `ids` | string[] | Ordered most recently favorited first (FR-013). Each id appears at most once and must exist in the collection; unknown or invalid entries are dropped on load (FR-010). |
| `persistent` | boolean (derived) | `true` when backed by working `localStorage`; `false` when using the in-memory fallback (FR-009). Not stored. |

**Relationship**: `Favorites.ids[*]` → `Quote.id` (many-to-one reference; a quote is in favorites
0 or 1 times).

### State transitions (per quote)

```text
                 toggle (main control)
 NOT_FAVORITE ───────────────────────────────▶ FAVORITE
      ▲                                           │
      └──── toggle (main control) or remove (list)┘
```

- `toggle(id)` on NOT_FAVORITE → id inserted at the **front** of `ids`.
- `toggle(id)` on FAVORITE → id removed.
- `remove(id)` → id removed (no-op if absent).
- Re-favoriting a previously removed quote places it at the front again.
- Every transition is persisted immediately (FR-008, FR-014) and notifies the view so both the
  main control and the list update together (FR-015).

## Current view state (in memory only)

| Field | Type | Rules |
|---|---|---|
| `currentId` | string | Id of the displayed quote. Chosen by `pickRandom` on load; replaced by `pickDifferent` on "New quote" (FR-002, FR-005). |
| `storageNoticeVisible` | boolean | Mirrors `!favorites.persistent`. |

## Persisted form

See [contracts/storage.md](./contracts/storage.md) for the exact key, JSON shape, and
load/validation algorithm.
