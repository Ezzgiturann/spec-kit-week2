import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEY, parseFavorites, createFavorites } from '../../src/favorites.js';
import { createStorage } from '../../src/storage.js';
import { createFakeBackend } from '../helpers.js';

// Failures are logged with console.warn; silence and record them for every test.
beforeEach(() => mock.method(console, 'warn', () => {}));
afterEach(() => mock.restoreAll());

const warnings = () => console.warn.mock.calls.map((call) => call.arguments.join(' '));

const KNOWN = new Set(['q001', 'q002', 'q003']);

function setup(initial) {
  const backend = createFakeBackend();
  if (initial !== undefined) backend.data.set(STORAGE_KEY, initial);
  const storage = createStorage(backend.getBackend);
  return { backend, storage, favorites: createFavorites(storage, KNOWN) };
}

const saved = (backend) => backend.data.get(STORAGE_KEY);

describe('parseFavorites', () => {
  it('uses the key qotd.favorites.v1', () => {
    assert.equal(STORAGE_KEY, 'qotd.favorites.v1');
  });

  for (const raw of [
    null,
    'not json',
    '42',
    'null',
    '{"version":2,"ids":["q001"]}',
    '{"version":1,"ids":"q001"}',
  ]) {
    it(`returns [] for ${raw}`, () => {
      assert.deepEqual(parseFavorites(raw, KNOWN), []);
    });
  }

  it('drops non-strings, unknown ids and duplicates, keeping the first occurrence', () => {
    const raw = '{"version":1,"ids":["q999","q001",1,"q001","q002"]}';
    assert.deepEqual(parseFavorites(raw, KNOWN), ['q001', 'q002']);
  });
});

describe('createFavorites', () => {
  it('loads existing favorites from storage', () => {
    const { favorites } = setup('{"version":1,"ids":["q002","q001"]}');
    assert.deepEqual(favorites.ids(), ['q002', 'q001']);
    assert.equal(favorites.has('q002'), true);
    assert.equal(favorites.has('q003'), false);
  });

  it('toggle adds a favorite at the front and saves it', () => {
    const { favorites, backend } = setup('{"version":1,"ids":["q001"]}');
    assert.equal(favorites.toggle('q002'), true);
    assert.deepEqual(favorites.ids(), ['q002', 'q001']);
    assert.equal(saved(backend), JSON.stringify({ version: 1, ids: ['q002', 'q001'] }));
  });

  it('toggle removes an existing favorite and saves it', () => {
    const { favorites, backend } = setup('{"version":1,"ids":["q001","q002"]}');
    assert.equal(favorites.toggle('q001'), false);
    assert.deepEqual(favorites.ids(), ['q002']);
    assert.equal(saved(backend), JSON.stringify({ version: 1, ids: ['q002'] }));
  });

  it('re-favoriting moves a quote to the front', () => {
    const { favorites } = setup();
    favorites.toggle('q001');
    favorites.toggle('q002');
    favorites.toggle('q001');
    favorites.toggle('q001');
    assert.deepEqual(favorites.ids(), ['q001', 'q002']);
  });

  it('remove deletes a favorite and saves it', () => {
    const { favorites, backend } = setup('{"version":1,"ids":["q001","q002"]}');
    favorites.remove('q002');
    assert.deepEqual(favorites.ids(), ['q001']);
    assert.equal(saved(backend), JSON.stringify({ version: 1, ids: ['q001'] }));
  });

  it('remove of an absent id is a no-op and does not notify', () => {
    const { favorites } = setup();
    let calls = 0;
    favorites.subscribe(() => calls++);
    favorites.remove('q001');
    assert.equal(calls, 0);
    assert.deepEqual(favorites.ids(), []);
  });

  it('throws RangeError for unknown ids', () => {
    const { favorites } = setup();
    assert.throws(() => favorites.toggle('q999'), RangeError);
    assert.throws(() => favorites.remove('q999'), RangeError);
  });

  it('ids() returns a copy', () => {
    const { favorites } = setup('{"version":1,"ids":["q001"]}');
    favorites.ids().push('q002');
    assert.deepEqual(favorites.ids(), ['q001']);
  });

  it('notifies subscribers with the new ids until they unsubscribe', () => {
    const { favorites } = setup();
    const seen = [];
    const unsubscribe = favorites.subscribe((ids) => seen.push(ids));
    favorites.toggle('q001');
    favorites.toggle('q002');
    unsubscribe();
    favorites.toggle('q003');
    assert.deepEqual(seen, [['q001'], ['q002', 'q001']]);
  });

  it('isPersistent mirrors storage, including after a failed write', () => {
    const { favorites, backend } = setup();
    assert.equal(favorites.isPersistent(), true);
    backend.throwOnWrite = true;
    favorites.toggle('q001');
    assert.equal(favorites.isPersistent(), false);
    assert.deepEqual(favorites.ids(), ['q001']);
  });
});

describe('parseFavorites warnings', () => {
  it('warns once with the storage key when the saved value is not JSON', () => {
    parseFavorites('not json', KNOWN);
    assert.equal(warnings().length, 1);
    assert.match(warnings()[0], /qotd\.favorites\.v1/);
  });

  it('logs nothing for missing or valid saved favorites', () => {
    parseFavorites(null, KNOWN);
    parseFavorites('{"version":1,"ids":["q001"]}', KNOWN);
    assert.deepEqual(warnings(), []);
  });
});
