import { JSDOM } from 'jsdom';
import { QUOTES } from '../src/quotes.js';
import { pickRandom, pickDifferent } from '../src/random.js';
import { mountApp } from '../src/view.js';
import { createStorage } from '../src/storage.js';
import { createFavorites } from '../src/favorites.js';

export function createTestDom() {
  const dom = new JSDOM('<!doctype html><main id="app"></main>');
  const { window } = dom;
  return { window, document: window.document, root: window.document.querySelector('#app') };
}

/** An rng that returns the given values in order, cycling when it runs out. */
export function sequenceRng(values) {
  let index = 0;
  return () => values[index++ % values.length];
}

/**
 * A stand-in for window.localStorage. `throwOnAccess` makes getBackend() throw (like a blocked
 * localStorage getter); `throwOnWrite` makes setItem throw and can be flipped mid-test.
 */
export function createFakeBackend({ throwOnAccess = false, throwOnWrite = false } = {}) {
  const data = new Map();
  const backend = {
    throwOnAccess,
    throwOnWrite,
    data,
    getBackend() {
      if (backend.throwOnAccess) throw new Error('SecurityError: access denied');
      return {
        getItem: (key) => (data.has(key) ? data.get(key) : null),
        setItem: (key, value) => {
          if (backend.throwOnWrite) throw new Error('QuotaExceededError');
          data.set(key, String(value));
        },
        removeItem: (key) => data.delete(key),
      };
    },
  };
  return backend;
}

/**
 * Mount the app in a fresh test DOM with sensible defaults. Pass the same `backend` to a second
 * call to simulate reloading the page.
 */
export function mountTestApp({
  quotes = QUOTES,
  rng = sequenceRng([0]),
  backend = createFakeBackend(),
} = {}) {
  const { window, document, root } = createTestDom();
  const storage = createStorage(backend.getBackend);
  const favorites = createFavorites(storage, new Set(quotes.map((q) => q.id)));
  const app = mountApp(root, { quotes, favorites, pickRandom, pickDifferent, rng });
  return { window, document, root, app, backend, favorites };
}
