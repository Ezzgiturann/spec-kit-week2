import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeBackend, mountTestApp, sequenceRng } from '../helpers.js';

const FIXTURE = [
  { id: 'q001', text: 'First quote.', author: 'Ada' },
  { id: 'q002', text: 'Second quote.', author: null },
  { id: 'q003', text: 'Has <b>bold</b> markup.', author: 'Bob' },
];

const currentQuote = (document) => document.querySelector('[data-testid="current-quote"]');
const quoteText = (document) => currentQuote(document).querySelector('blockquote').textContent;
const quoteAuthor = (document) => currentQuote(document).querySelector('figcaption').textContent;

describe('US1: see a random quote', () => {
  it('shows the page heading', () => {
    const { document } = mountTestApp({ quotes: FIXTURE });
    assert.equal(document.querySelector('h1').textContent, 'Quote of the Day');
  });

  it('renders the current quote in a polite live region', () => {
    const { document } = mountTestApp({ quotes: FIXTURE });
    const figure = currentQuote(document);
    assert.equal(figure.tagName, 'FIGURE');
    assert.equal(figure.getAttribute('aria-live'), 'polite');
  });

  it('shows the quote chosen by the rng with its author', () => {
    const { document } = mountTestApp({ quotes: FIXTURE, rng: sequenceRng([0]) });
    assert.equal(quoteText(document), 'First quote.');
    assert.equal(quoteAuthor(document), '— Ada');
  });

  it('shows "Unknown" when the author is null', () => {
    const { document } = mountTestApp({ quotes: FIXTURE, rng: sequenceRng([0.4]) });
    assert.equal(quoteText(document), 'Second quote.');
    assert.equal(quoteAuthor(document), '— Unknown');
  });

  it('renders markup in quote text literally', () => {
    const { document } = mountTestApp({ quotes: FIXTURE, rng: sequenceRng([0.9]) });
    assert.equal(quoteText(document), 'Has <b>bold</b> markup.');
    assert.equal(currentQuote(document).querySelector('b'), null);
  });

  it('can be destroyed', () => {
    const { app } = mountTestApp({ quotes: FIXTURE });
    assert.doesNotThrow(() => app.destroy());
  });
});

describe('US2: new quote', () => {
  const newQuoteButton = (document) =>
    [...document.querySelectorAll('button')].find((b) => b.textContent === 'New quote');

  it('has a "New quote" button', () => {
    const { document } = mountTestApp({ quotes: FIXTURE });
    assert.ok(newQuoteButton(document));
    assert.equal(newQuoteButton(document).getAttribute('type'), 'button');
  });

  it('replaces the quote with a different one', () => {
    const { document } = mountTestApp({ quotes: FIXTURE, rng: sequenceRng([0]) });
    const before = quoteText(document);
    newQuoteButton(document).click();
    assert.notEqual(quoteText(document), before);
  });

  it('never shows the same quote twice in a row over 100 presses', () => {
    const { document } = mountTestApp({ rng: Math.random });
    let previous = quoteText(document);
    for (let i = 0; i < 100; i++) {
      newQuoteButton(document).click();
      const next = quoteText(document);
      assert.notEqual(next, previous);
      previous = next;
    }
  });

  it('keeps the only quote when the collection has one', () => {
    const { document } = mountTestApp({ quotes: [FIXTURE[0]] });
    assert.doesNotThrow(() => newQuoteButton(document).click());
    assert.equal(quoteText(document), 'First quote.');
  });

  it('keeps focus on the button after pressing it', () => {
    const { document } = mountTestApp({ quotes: FIXTURE });
    const button = newQuoteButton(document);
    button.focus();
    button.click();
    assert.equal(document.activeElement, button);
  });
});

const favoriteToggle = (document) => document.querySelector('button[aria-pressed]');
const findButton = (document, text) =>
  [...document.querySelectorAll('button')].find((b) => b.textContent === text);

describe('US3: favorite', () => {
  it('has a "Favorite" toggle that starts unpressed', () => {
    const { document } = mountTestApp({ quotes: FIXTURE });
    const toggle = favoriteToggle(document);
    assert.equal(toggle.getAttribute('type'), 'button');
    assert.equal(toggle.getAttribute('aria-pressed'), 'false');
    const visibleLabel = [...toggle.children].find((c) => !c.hasAttribute('aria-hidden'));
    assert.equal(visibleLabel.textContent, 'Favorite');
  });

  it('toggles on and off, with a hidden star icon', () => {
    const { document } = mountTestApp({ quotes: FIXTURE });
    const toggle = favoriteToggle(document);
    const icon = toggle.querySelector('[aria-hidden="true"]');
    assert.equal(icon.textContent, '☆');
    toggle.click();
    assert.equal(toggle.getAttribute('aria-pressed'), 'true');
    assert.equal(icon.textContent, '★');
    toggle.click();
    assert.equal(toggle.getAttribute('aria-pressed'), 'false');
    assert.equal(icon.textContent, '☆');
  });

  it('keeps a favorite after a reload', () => {
    const first = mountTestApp({ quotes: FIXTURE, rng: sequenceRng([0]) });
    favoriteToggle(first.document).click();
    const reloaded = mountTestApp({
      quotes: FIXTURE,
      rng: sequenceRng([0]),
      backend: first.backend,
    });
    assert.equal(favoriteToggle(reloaded.document).getAttribute('aria-pressed'), 'true');
  });

  it('keeps an unfavorite after a reload', () => {
    const first = mountTestApp({ quotes: FIXTURE, rng: sequenceRng([0]) });
    favoriteToggle(first.document).click();
    favoriteToggle(first.document).click();
    const reloaded = mountTestApp({
      quotes: FIXTURE,
      rng: sequenceRng([0]),
      backend: first.backend,
    });
    assert.equal(favoriteToggle(reloaded.document).getAttribute('aria-pressed'), 'false');
  });

  it('reflects the new quote after "New quote"', () => {
    const { document } = mountTestApp({ quotes: FIXTURE });
    favoriteToggle(document).click();
    findButton(document, 'New quote').click();
    assert.equal(favoriteToggle(document).getAttribute('aria-pressed'), 'false');
  });

  it('shows no storage notice when storage works', () => {
    const { document } = mountTestApp({ quotes: FIXTURE });
    assert.equal(document.querySelector('[data-testid="storage-notice"]'), null);
  });

  it('shows the storage notice when storage is blocked, and favoriting still works', () => {
    const { document } = mountTestApp({
      quotes: FIXTURE,
      backend: createFakeBackend({ throwOnAccess: true }),
    });
    const notice = document.querySelector('[data-testid="storage-notice"]');
    assert.equal(notice.getAttribute('role'), 'status');
    assert.equal(
      notice.textContent,
      "Favorites can't be saved in this browser; they'll be lost when you leave the page.",
    );
    favoriteToggle(document).click();
    assert.equal(favoriteToggle(document).getAttribute('aria-pressed'), 'true');
  });

  it('shows the storage notice after a save fails mid-visit', () => {
    const { document, backend } = mountTestApp({ quotes: FIXTURE });
    backend.throwOnWrite = true;
    favoriteToggle(document).click();
    assert.ok(document.querySelector('[data-testid="storage-notice"]'));
  });
});

describe('US4: favorites list', () => {
  const list = (document) => document.querySelector('[data-testid="favorites-list"]');
  const empty = (document) => document.querySelector('[data-testid="favorites-empty"]');
  const entries = (document) => [...list(document).querySelectorAll('li')];
  const entryTexts = (document) =>
    entries(document).map((li) => li.querySelector('.favorite-text').textContent);
  const removeButtons = (document) => entries(document).map((li) => li.querySelector('button'));

  /** Mount the app and favorite the fixture quotes at `positions`, in that order. */
  function favoriteInOrder(positions) {
    const ctx = mountTestApp({ quotes: FIXTURE });
    for (const index of positions) ctx.favorites.toggle(FIXTURE[index].id);
    return ctx;
  }

  it('shows a heading and an empty state when there are no favorites', () => {
    const { document } = mountTestApp({ quotes: FIXTURE });
    assert.equal(document.querySelector('h2').textContent, 'Your favorites');
    assert.equal(empty(document).textContent, 'No favorites yet.');
    assert.equal(empty(document).getAttribute('tabindex'), '-1');
    assert.equal(empty(document).hidden, false);
    assert.equal(list(document).hidden, true);
  });

  it('adds a favorited quote at the top with its author', () => {
    const { document, favorites } = mountTestApp({ quotes: FIXTURE, rng: sequenceRng([0]) });
    favorites.toggle('q002');
    favoriteToggle(document).click();
    assert.equal(list(document).hidden, false);
    assert.equal(empty(document).hidden, true);
    assert.deepEqual(entryTexts(document), ['First quote.', 'Second quote.']);
    assert.equal(entries(document)[0].querySelector('.favorite-author').textContent, '— Ada');
    assert.equal(entries(document)[1].querySelector('.favorite-author').textContent, '— Unknown');
  });

  it('lists favorites newest first after a reload', () => {
    const { backend } = favoriteInOrder([0, 2, 1]);
    const { document } = mountTestApp({ quotes: FIXTURE, backend });
    assert.deepEqual(entryTexts(document), [
      'Second quote.',
      'Has <b>bold</b> markup.',
      'First quote.',
    ]);
  });

  it('gives each entry a Remove button naming its quote', () => {
    const longText = 'x'.repeat(61);
    const quotes = [...FIXTURE, { id: 'q004', text: longText, author: 'Long' }];
    const { document, favorites } = mountTestApp({ quotes });
    favorites.toggle('q004');
    favorites.toggle('q001');
    const [shortButton, longButton] = removeButtons(document);
    assert.equal(shortButton.textContent, 'Remove');
    assert.equal(shortButton.getAttribute('type'), 'button');
    assert.equal(shortButton.getAttribute('aria-label'), 'Remove from favorites: First quote.');
    assert.equal(
      longButton.getAttribute('aria-label'),
      `Remove from favorites: ${'x'.repeat(60)}…`,
    );
  });

  it('removing the current quote also updates the main toggle', () => {
    const { document } = mountTestApp({ quotes: FIXTURE, rng: sequenceRng([0]) });
    favoriteToggle(document).click();
    removeButtons(document)[0].click();
    assert.equal(entries(document).length, 0);
    assert.equal(favoriteToggle(document).getAttribute('aria-pressed'), 'false');
  });

  it('keeps a removal after a reload', () => {
    const { document, backend } = favoriteInOrder([0, 1]);
    removeButtons(document)[0].click();
    const reloaded = mountTestApp({ quotes: FIXTURE, backend });
    assert.deepEqual(entryTexts(reloaded.document), ['First quote.']);
  });

  it('moves focus to the next, then previous, then the empty message', () => {
    const { document } = favoriteInOrder([0, 1, 2]);
    // List: [q003, q002, q001]. Remove the middle one → focus the next (q001).
    removeButtons(document)[1].click();
    assert.equal(document.activeElement, removeButtons(document)[1]);
    // List: [q003, q001]. Remove the last one → focus the previous (q003).
    removeButtons(document)[1].click();
    assert.equal(document.activeElement, removeButtons(document)[0]);
    // List: [q003]. Remove it → focus the empty message.
    removeButtons(document)[0].click();
    assert.equal(document.activeElement, empty(document));
    assert.equal(list(document).hidden, true);
    assert.equal(empty(document).hidden, false);
  });

  it('shows long quotes in full', () => {
    const longText = 'Long words '.repeat(25).trim();
    const quotes = [...FIXTURE, { id: 'q004', text: longText, author: null }];
    const { document, favorites } = mountTestApp({ quotes });
    favorites.toggle('q004');
    assert.equal(entryTexts(document)[0], longText);
  });
});
