const PROBE_KEY = 'qotd.__probe__';

/**
 * Create a key-value storage adapter that never throws. Uses the backend returned by
 * `getBackend` (localStorage by default) when a probe write succeeds; otherwise, or after any
 * later failed write, keeps values in memory for the rest of the visit.
 * @param {() => Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>} [getBackend]
 * @returns {{
 *   persistent: boolean,
 *   read(key: string): string | null,
 *   write(key: string, value: string): boolean,
 * }}
 */
export function createStorage(getBackend = () => globalThis.localStorage) {
  const memory = new Map();
  const backend = probe(getBackend);
  let persistent = backend !== null;

  return {
    get persistent() {
      return persistent;
    },

    read(key) {
      if (memory.has(key)) return memory.get(key);
      if (backend === null) return null;
      try {
        return backend.getItem(key);
      } catch {
        return null;
      }
    },

    write(key, value) {
      if (persistent) {
        try {
          backend.setItem(key, value);
          return true;
        } catch {
          // Quota or security error: stop writing to the backend for the rest of the visit,
          // but keep reading values it already holds.
          persistent = false;
        }
      }
      memory.set(key, value);
      return false;
    },
  };
}

function probe(getBackend) {
  try {
    const backend = getBackend();
    backend.setItem(PROBE_KEY, PROBE_KEY);
    backend.removeItem(PROBE_KEY);
    return backend;
  } catch {
    return null;
  }
}
