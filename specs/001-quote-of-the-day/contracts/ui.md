# Contract: User Interface

**Satisfies**: FR-002 to FR-007, FR-009, FR-011 to FR-017

Integration tests select elements by role and accessible name (and the `data-testid` hooks below
where a role is ambiguous), so these are the stable contract; CSS classes are not.

## Page structure (top to bottom)

| Region | Element / role | Accessible name / content | Notes |
|---|---|---|---|
| Heading | `h1` | "Quote of the Day" | |
| Storage notice | `p` `role="status"`, `data-testid="storage-notice"` | "Favorites can't be saved in this browser; they'll be lost when you leave the page." | Present only when storage is non-persistent (FR-009). |
| Current quote | `figure` `aria-live="polite"`, `data-testid="current-quote"` | `blockquote` = quote text; `figcaption` = "— " + author or "— Unknown" | Text set via `textContent` only. |
| Favorite toggle | `button` `aria-pressed="true\|false"` | "Favorite" | Visible ★ when pressed, ☆ when not (icon `aria-hidden`). |
| New quote | `button` | "New quote" | |
| Favorites heading | `h2` | "Your favorites" | |
| Favorites list | `ul` `data-testid="favorites-list"` | One `li` per favorite | Hidden when empty. |
| List entry | `li` | quote text + " — " + author/"Unknown" | Order: most recently favorited first. |
| Entry remove | `button` inside `li` | "Remove from favorites: " + first 60 chars of text (+ "…" if truncated) | Visible label "Remove". |
| Empty state | `p` `tabindex="-1"` `data-testid="favorites-empty"` | "No favorites yet." | Shown only when there are no favorites. |

## Behaviors

| Trigger | Result | Spec |
|---|---|---|
| Page load | One random quote shown; toggle reflects whether it is a favorite; list rendered from storage. | FR-002, FR-007, FR-013 |
| Click/Enter/Space on "New quote" | Quote replaced by a different one (if > 1 quote); toggle state updated; focus stays on "New quote". | FR-005, FR-007 |
| Activate "Favorite" | Toggles current quote; `aria-pressed` flips; list adds entry at top or removes it; saved. | FR-006, FR-008, FR-015 |
| Activate an entry's "Remove" | Entry removed; if it is the current quote, toggle shows not-favorited; saved; focus → next entry's Remove, else previous, else empty-state message. | FR-014, FR-015, FR-017 |
| Last favorite removed | List hidden, empty-state shown. | FR-016 |
| Storage non-persistent | Notice shown; everything else works for the session. | FR-009 |

## Layout

- Single column, max content width ~40rem, centered; 16px side padding.
- No horizontal scrolling at 360 px; long words wrap (`overflow-wrap: anywhere`) (FR-012).
- Visible focus outline on every interactive element.
- Respects `prefers-color-scheme` (light/dark) with sufficient contrast (WCAG AA).
