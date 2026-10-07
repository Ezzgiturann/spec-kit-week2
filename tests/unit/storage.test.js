import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createStorage } from '../../src/storage.js';
import { createFakeBackend } from '../helpers.js';

// Failures are logged with console.warn; silence and record them for every test.
beforeEach(() => mock.method(console, 'warn', () => {}));
afterEach(() => mock.restoreAll());

const warnings = () => console.warn.mock.calls.map((call) => call.arguments.join(' '));

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

describe('createStorage warnings', () => {
  const KEY = 'qotd.favorites.v1';

  it('logs nothing when storage works', () => {
    const storage = createStorage(createFakeBackend().getBackend);
    storage.write(KEY, 'v');
    storage.read(KEY);
    assert.deepEqual(warnings(), []);
  });

  it('warns once with the probe key when storage is unavailable', () => {
    createStorage(createFakeBackend({ throwOnAccess: true }).getBackend);
    assert.equal(warnings().length, 1);
    assert.match(warnings()[0], /qotd\.__probe__/);
  });

  it('warns once with the key when a write fails', () => {
    const backend = createFakeBackend();
    const storage = createStorage(backend.getBackend);
    backend.throwOnWrite = true;
    storage.write(KEY, 'v');
    assert.equal(warnings().length, 1);
    assert.match(warnings()[0], /qotd\.favorites\.v1/);
    assert.match(warnings()[0], /QuotaExceededError/);
  });

  it('warns once with the key when a read fails', () => {
    const storage = createStorage(() => ({
      getItem() {
        throw new Error('boom');
      },
      setItem() {},
      removeItem() {},
    }));
    storage.read(KEY);
    assert.equal(warnings().length, 1);
    assert.match(warnings()[0], /qotd\.favorites\.v1/);
    assert.match(warnings()[0], /boom/);
  });
});
