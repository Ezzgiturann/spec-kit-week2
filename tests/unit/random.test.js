import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { pickRandom, pickDifferent } from '../../src/random.js';

const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];

describe('pickRandom', () => {
  it('returns the first item when rng returns 0', () => {
    assert.equal(
      pickRandom(items, () => 0),
      items[0],
    );
  });

  it('returns the last item when rng returns just under 1', () => {
    assert.equal(
      pickRandom(items, () => 0.999),
      items[3],
    );
  });

  it('maps rng to Math.floor(rng() * n)', () => {
    assert.equal(
      pickRandom(items, () => 0.5),
      items[2],
    );
  });

  it('throws RangeError for an empty array', () => {
    assert.throws(() => pickRandom([], () => 0), RangeError);
  });

  it('defaults to Math.random', () => {
    assert.ok(items.includes(pickRandom(items)));
  });
});

describe('pickDifferent', () => {
  const [a, b, c] = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const abc = [a, b, c];

  it('skips over the current item', () => {
    assert.equal(
      pickDifferent(abc, 'b', () => 0),
      a,
    );
    assert.equal(
      pickDifferent(abc, 'b', () => 0.5),
      c,
    );
    assert.equal(
      pickDifferent(abc, 'b', () => 0.999),
      c,
    );
  });

  it('never returns the current item', () => {
    for (let i = 0; i < 1000; i++) assert.notEqual(pickDifferent(abc, 'b').id, 'b');
  });

  it('returns the only item when there is just one', () => {
    assert.equal(
      pickDifferent([a], 'a', () => 0.7),
      a,
    );
  });

  it('throws RangeError for an empty array', () => {
    assert.throws(() => pickDifferent([], 'a', () => 0), RangeError);
  });

  it('behaves like pickRandom when currentId is unknown', () => {
    assert.equal(
      pickDifferent(abc, 'zzz', () => 0),
      a,
    );
    assert.equal(
      pickDifferent(abc, 'zzz', () => 0.999),
      c,
    );
  });
});
