export const STORAGE_KEY = 'qotd.favorites.v1';
const SCHEMA_VERSION = 1;

/**
 * Parse a stored favorites value into a clean list of ids (newest first). Unusable input yields
 * an empty list; non-string, unknown and duplicate ids are dropped. Never throws.
 * @param {string | null} raw
 * @param {Set<string>} knownIds
 * @returns {string[]}
 */
export function parseFavorites(raw, knownIds) {
  if (raw === null) return [];
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    console.warn(`[qotd] ignoring unreadable saved favorites in "${STORAGE_KEY}":`, error);
    return [];
  }
  if (parsed === null || typeof parsed !== 'object') return [];
  if (parsed.version !== SCHEMA_VERSION || !Array.isArray(parsed.ids)) return [];

  const ids = [];
  for (const id of parsed.ids) {
    if (typeof id === 'string' && knownIds.has(id) && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

/**
 * Create the favorites store, loading any saved favorites and saving after every change.
 * @param {ReturnType<import('./storage.js').createStorage>} storage
 * @param {Set<string>} knownIds
 */
export function createFavorites(storage, knownIds) {
  let ids = parseFavorites(storage.read(STORAGE_KEY), knownIds);
  const listeners = new Set();

  function assertKnown(id) {
    if (!knownIds.has(id)) throw new RangeError(`Unknown quote id: ${id}`);
  }

  function commit(nextIds) {
    ids = nextIds;
    storage.write(STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION, ids }));
    for (const listener of listeners) listener([...ids]);
  }

  return {
    ids: () => [...ids],

    has: (id) => ids.includes(id),

    /** @returns {boolean} true if the quote is now a favorite */
    toggle(id) {
      assertKnown(id);
      if (ids.includes(id)) {
        commit(ids.filter((other) => other !== id));
        return false;
      }
      commit([id, ...ids]);
      return true;
    },

    remove(id) {
      assertKnown(id);
      if (ids.includes(id)) commit(ids.filter((other) => other !== id));
    },

    isPersistent: () => storage.persistent,

    /** @returns {() => void} unsubscribe */
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
