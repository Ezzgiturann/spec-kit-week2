import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createStorage } from '../../src/storage.js';
import { createFakeBackend } from '../helpers.js';

describe('createStorage', () => {
  it('is persistent with a working backend and round-trips values', () => {
    const backend = createFakeBackend();
    const storage = createStorage(backend.getBackend);
    assert.equal(storage.persistent, true);
    assert.equal(storage.write('k', 'v'), true);
    assert.equal(storage.read('k'), 'v');
    assert.equal(backend.data.get('k'), 'v');
  });

  it('does not leave the probe key behind', () => {
    const backend = createFakeBackend();
    createStorage(backend.getBackend);
    assert.equal(backend.data.has('qotd.__probe__'), false);
  });

  it('returns null for a missing key', () => {
    assert.equal(createStorage(createFakeBackend().getBackend).read('missing'), null);
  });

  it('falls back to memory when accessing the backend throws', () => {
    const storage = createStorage(createFakeBackend({ throwOnAccess: true }).getBackend);
    assert.equal(storage.persistent, false);
    assert.equal(storage.write('k', 'v'), false);
    assert.equal(storage.read('k'), 'v');
  });

  it('falls back to memory when the probe write throws', () => {
    const storage = createStorage(createFakeBackend({ throwOnWrite: true }).getBackend);
    assert.equal(storage.persistent, false);
  });

  it('switches to memory after a failed write, keeping earlier and new values', () => {
    const backend = createFakeBackend();
    const storage = createStorage(backend.getBackend);
    storage.write('a', '1');
    backend.throwOnWrite = true;
    assert.equal(storage.write('b', '2'), false);
    assert.equal(storage.persistent, false);
    assert.equal(storage.read('a'), '1');
    assert.equal(storage.read('b'), '2');
  });

  it('never throws from read when the backend getItem throws', () => {
    const storage = createStorage(() => ({
      getItem() {
        throw new Error('boom');
      },
      setItem() {},
      removeItem() {},
    }));
    assert.equal(storage.read('k'), null);
  });
});
