const STORAGE_NOTICE =
  "Favorites can't be saved in this browser; they'll be lost when you leave the page.";

/**
 * Render the app into `root` and wire its events.
 * @param {HTMLElement} root
 * @param {{
 *   quotes: readonly { id: string, text: string, author: string | null }[],
 *   favorites: ReturnType<import('./favorites.js').createFavorites>,
 *   pickRandom: Function,
 *   pickDifferent: Function,
 *   rng: () => number,
 * }} deps
 * @returns {{ destroy(): void }}
 */
export function mountApp(root, deps) {
  const { favorites } = deps;
  const doc = root.ownerDocument;
  const el = (tag, attrs = {}, text) => {
    const node = doc.createElement(tag);
    for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
    if (text !== undefined) node.textContent = text;
    return node;
  };

  let current = deps.pickRandom(deps.quotes, deps.rng);

  root.replaceChildren();
  const heading = el('h1', {}, 'Quote of the Day');
  const notice = el(
    'p',
    { role: 'status', 'data-testid': 'storage-notice', class: 'notice' },
    STORAGE_NOTICE,
  );

  const figure = el('figure', { 'data-testid': 'current-quote', 'aria-live': 'polite' });
  const blockquote = el('blockquote');
  const caption = el('figcaption');
  figure.append(blockquote, caption);

  const controls = el('div', { class: 'controls' });
  const favoriteButton = el('button', { type: 'button', class: 'favorite-toggle' });
  const favoriteIcon = el('span', { 'aria-hidden': 'true', class: 'icon' });
  favoriteButton.append(favoriteIcon, el('span', {}, 'Favorite'));
  const newQuoteButton = el('button', { type: 'button' }, 'New quote');
  controls.append(favoriteButton, newQuoteButton);

  const favoritesSection = el('section', {
    class: 'favorites',
    'aria-labelledby': 'favorites-heading',
  });
  const favoritesHeading = el('h2', { id: 'favorites-heading' }, 'Your favorites');
  const favoritesList = el('ul', { 'data-testid': 'favorites-list' });
  const favoritesEmpty = el(
    'p',
    { 'data-testid': 'favorites-empty', tabindex: '-1', class: 'favorites-empty' },
    'No favorites yet.',
  );
  favoritesSection.append(favoritesHeading, favoritesList, favoritesEmpty);

  root.append(heading, figure, controls, favoritesSection);

  const quotesById = new Map(deps.quotes.map((quote) => [quote.id, quote]));

  function renderQuote() {
    blockquote.textContent = current.text;
    caption.textContent = `— ${current.author ?? 'Unknown'}`;
    renderFavoriteState();
  }

  function renderFavoriteState() {
    const pressed = favorites.has(current.id);
    favoriteButton.setAttribute('aria-pressed', String(pressed));
    favoriteIcon.textContent = pressed ? '★' : '☆';
  }

  // The notice sits right under the heading and is only in the DOM while storage is unusable.
  function renderNotice() {
    if (favorites.isPersistent()) notice.remove();
    else if (!notice.isConnected) heading.after(notice);
  }

  function renderFavoritesList() {
    const ids = favorites.ids();
    favoritesList.replaceChildren(...ids.map((id) => favoriteEntry(quotesById.get(id))));
    favoritesList.hidden = ids.length === 0;
    favoritesEmpty.hidden = ids.length > 0;
  }

  function favoriteEntry(quote) {
    const item = el('li', { 'data-id': quote.id });
    const text = el('span', { class: 'favorite-text' }, quote.text);
    const author = el('span', { class: 'favorite-author' }, `— ${quote.author ?? 'Unknown'}`);
    const excerpt = quote.text.length > 60 ? `${quote.text.slice(0, 60)}…` : quote.text;
    const removeButton = el(
      'button',
      { type: 'button', 'aria-label': `Remove from favorites: ${excerpt}` },
      'Remove',
    );
    item.append(text, ' ', author, removeButton);
    return item;
  }

  // Removing an entry re-renders the list, so move focus to the entry that took its place,
  // else the one before it, else the empty-state message.
  function removeFavorite(event) {
    const removeButton = event.target.closest('button');
    if (!removeButton) return;
    const item = removeButton.closest('li');
    const index = [...favoritesList.children].indexOf(item);
    favorites.remove(item.dataset.id);

    const remaining = favoritesList.querySelectorAll('li button');
    const target = remaining[index] ?? remaining[index - 1] ?? favoritesEmpty;
    target.focus();
  }

  function showNewQuote() {
    current = deps.pickDifferent(deps.quotes, current.id, deps.rng);
    renderQuote();
  }

  function toggleFavorite() {
    favorites.toggle(current.id);
  }

  // Every favorites change re-renders both the main toggle and the list, so they always agree.
  const unsubscribe = favorites.subscribe(() => {
    renderFavoriteState();
    renderFavoritesList();
    renderNotice();
  });
  newQuoteButton.addEventListener('click', showNewQuote);
  favoriteButton.addEventListener('click', toggleFavorite);
  favoritesList.addEventListener('click', removeFavorite);
  renderQuote();
  renderFavoritesList();
  renderNotice();

  return {
    destroy() {
      unsubscribe();
      newQuoteButton.removeEventListener('click', showNewQuote);
      favoriteButton.removeEventListener('click', toggleFavorite);
      favoritesList.removeEventListener('click', removeFavorite);
      root.replaceChildren();
    },
  };
}
