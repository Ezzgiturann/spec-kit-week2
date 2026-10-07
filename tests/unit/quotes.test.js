import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { QUOTES } from '../../src/quotes.js';

describe('QUOTES collection', () => {
  it('contains between 20 and 50 quotes', () => {
    assert.ok(QUOTES.length >= 20 && QUOTES.length <= 50, `got ${QUOTES.length}`);
  });

  it('is frozen, and so is every quote', () => {
    assert.ok(Object.isFrozen(QUOTES));
    for (const quote of QUOTES) assert.ok(Object.isFrozen(quote), quote.id);
  });

  it('has unique ids matching ^q\\d{3}$', () => {
    const ids = QUOTES.map((q) => q.id);
    for (const id of ids) assert.match(id, /^q\d{3}$/);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('has text that is non-empty after trimming', () => {
    for (const quote of QUOTES) {
      assert.equal(typeof quote.text, 'string', quote.id);
      assert.ok(quote.text.trim().length > 0, quote.id);
    }
  });

  it('has an author that is a non-empty string or null', () => {
    for (const quote of QUOTES) {
      const ok =
        quote.author === null || (typeof quote.author === 'string' && quote.author.trim() !== '');
      assert.ok(ok, quote.id);
    }
  });

  it('includes a quote with an unknown author and one longer than 200 characters', () => {
    assert.ok(QUOTES.some((q) => q.author === null));
    assert.ok(QUOTES.some((q) => q.text.length > 200));
  });
});
