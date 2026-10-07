# Contract: Persisted Favorites (localStorage)

**Satisfies**: FR-008, FR-009, FR-010, FR-013, FR-014

## Key

`qotd.favorites.v1`

## Value (JSON)

```json
{
  "version": 1,
  "ids": ["q007", "q002", "q015"]
}
```

| Field | Type | Meaning |
|---|---|---|
| `version` | integer | Schema version. Must equal `1`. |
| `ids` | string[] | Favorited quote ids, most recently favorited first. |

## Load algorithm

1. Read the key. If storage is unavailable or the key is absent → favorites = `[]`.
2. `JSON.parse`; on error → `[]`.
3. If the result is not an object, `version !== 1`, or `ids` is not an array → `[]`.
4. Keep entries that are strings, exist in the quote collection, and have not appeared earlier in
   the array (first occurrence wins). Drop everything else silently.
5. No error is shown to the visitor for steps 2–4 (FR-010). The cleaned value is written back on
   the next change, not on load.

## Write rules

- After every successful `toggle` / `remove`, write the full value with the current order.
- If a write throws (quota, security error), keep the in-memory state, mark storage
  non-persistent, and show the storage notice (FR-009). Do not retry.

## Probe (availability check)

At startup, write and remove the key `qotd.__probe__`. Any exception (including accessing
`window.localStorage`) → non-persistent mode.

## Compatibility

A future schema change MUST use a new `version` value and either migrate `v1` data on load or
ignore it per step 3. Ids are never reassigned to different quotes, so stored ids remain valid.
