# Contract: JavaScript Module APIs

Public interface of each module in `src/`. Anything not listed is private to its module.
Tests target these signatures (constitution Principles III and V).

## `src/quotes.js`

```js
export const QUOTES; // readonly Array<{ id: string, text: string, author: string | null }>
```

## `src/random.js`

```js
/** Uniformly pick one item. Throws RangeError if items is empty. */
export function pickRandom(items, rng = Math.random);

/**
 * Uniformly pick an item whose id !== currentId.
 * Returns the only item when items.length === 1. Throws RangeError if items is empty.
 * If currentId is not found, behaves like pickRandom.
 */
export function pickDifferent(items, currentId, rng = Math.random);
```

`rng`: `() => number` in `[0, 1)`.

## `src/storage.js`

```js
/**
 * Returns a storage adapter. Uses `backend` (default: window.localStorage) if a probe
 * write/remove succeeds, otherwise an in-memory map.
 */
export function createStorage(getBackend = () => globalThis.localStorage);

// Adapter shape:
// {
//   persistent: boolean,          // false when in-memory; becomes false after a failed write
//   read(key): string | null,     // never throws
//   write(key, value): boolean,   // never throws; false (and persistent=false) on failure
// }
```

## `src/favorites.js`

```js
export const STORAGE_KEY = 'qotd.favorites.v1';

/** Parse a stored string into a clean id list per contracts/storage.md. Never throws. */
export function parseFavorites(raw, knownIds);

/**
 * Create the favorites store.
 * @param storage  adapter from createStorage()
 * @param knownIds Set<string> of valid quote ids
 */
export function createFavorites(storage, knownIds);

// Store shape:
// {
//   ids(): string[]                 // newest first (copy)
//   has(id): boolean
//   toggle(id): boolean             // returns new state (true = favorited)
//   remove(id): void                // no-op if absent
//   isPersistent(): boolean
//   subscribe(listener): () => void // listener(ids) after every change; returns unsubscribe
// }
```

Errors: `toggle`/`remove` with an id not in `knownIds` throw `RangeError` (programming error).

## `src/view.js`

```js
/**
 * Render the app into `root` and wire events.
 * @param deps { quotes, favorites, pickRandom, pickDifferent, rng }
 * @returns { destroy(): void }  // removes listeners (used by tests)
 */
export function mountApp(root, deps);
```

## `src/main.js`

Composition root only: builds `createStorage()`, `createFavorites(...)`, and calls
`mountApp(document.querySelector('#app'), deps)`. No exports; not unit-tested (covered by the
integration test via `mountApp`).
