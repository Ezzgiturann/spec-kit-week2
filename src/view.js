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
  const el = elementFactory(root.ownerDocument);
  const ui = buildLayout(el);
  const quotesById = new Map(deps.quotes.map((quote) => [quote.id, quote]));
  let current = deps.pickRandom(deps.quotes, deps.rng);

  // Every favorites change re-renders both the main toggle and the list, so they always agree.
  const renderFavorites = () => {
    renderFavoriteState(ui, favorites.has(current.id));
    renderFavoritesList(
      ui,
      el,
      favorites.ids().map((id) => quotesById.get(id)),
    );
    renderNotice(ui, favorites.isPersistent());
  };
  const showNewQuote = () => {
    current = deps.pickDifferent(deps.quotes, current.id, deps.rng);
    renderQuote(ui, current);
    renderFavoriteState(ui, favorites.has(current.id));
  };
  const toggleFavorite = () => favorites.toggle(current.id);
  const removeFavorite = (event) => removeFromList(ui, favorites, event);

  root.replaceChildren(ui.heading, ui.figure, ui.controls, ui.favoritesSection);
  renderQuote(ui, current);
  renderFavorites();

  const unsubscribe = favorites.subscribe(renderFavorites);
  const listeners = [
    [ui.newQuoteButton, showNewQuote],
    [ui.favoriteButton, toggleFavorite],
    [ui.favoritesList, removeFavorite],
  ];
  for (const [target, handler] of listeners) target.addEventListener('click', handler);

  return {
    destroy() {
      unsubscribe();
      for (const [target, handler] of listeners) target.removeEventListener('click', handler);
      root.replaceChildren();
    },
  };
}

function elementFactory(doc) {
  return (tag, attrs = {}, text) => {
    const node = doc.createElement(tag);
    for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
    if (text !== undefined) node.textContent = text;
    return node;
  };
}

/** Create the page's static structure (contracts/ui.md); content is filled in by the renderers. */
function buildLayout(el) {
  const heading = el('h1', {}, 'Quote of the Day');
  const notice = el(
    'p',
    { role: 'status', 'data-testid': 'storage-notice', class: 'notice' },
    STORAGE_NOTICE,
  );
  return { heading, notice, ...buildQuoteArea(el), ...buildFavoritesArea(el) };
}

function buildQuoteArea(el) {
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

  return { figure, blockquote, caption, controls, favoriteButton, favoriteIcon, newQuoteButton };
}

function buildFavoritesArea(el) {
  const favoritesSection = el('section', {
    class: 'favorites',
    'aria-labelledby': 'favorites-heading',
  });
  const favoritesList = el('ul', { 'data-testid': 'favorites-list' });
  const favoritesEmpty = el(
    'p',
    { 'data-testid': 'favorites-empty', tabindex: '-1', class: 'favorites-empty' },
    'No favorites yet.',
  );
  favoritesSection.append(
    el('h2', { id: 'favorites-heading' }, 'Your favorites'),
    favoritesList,
    favoritesEmpty,
  );
  return { favoritesSection, favoritesList, favoritesEmpty };
}

function renderQuote(ui, quote) {
  ui.blockquote.textContent = quote.text;
  ui.caption.textContent = `— ${quote.author ?? 'Unknown'}`;
}

function renderFavoriteState(ui, pressed) {
  ui.favoriteButton.setAttribute('aria-pressed', String(pressed));
  ui.favoriteIcon.textContent = pressed ? '★' : '☆';
}

function renderFavoritesList(ui, el, quotes) {
  ui.favoritesList.replaceChildren(...quotes.map((quote) => createFavoriteEntry(el, quote)));
  ui.favoritesList.hidden = quotes.length === 0;
  ui.favoritesEmpty.hidden = quotes.length > 0;
}

// The notice sits right under the heading and is only in the DOM while storage is unusable.
function renderNotice(ui, persistent) {
  if (persistent) ui.notice.remove();
  else if (!ui.notice.isConnected) ui.heading.after(ui.notice);
}

function createFavoriteEntry(el, quote) {
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
function removeFromList(ui, favorites, event) {
  const removeButton = event.target.closest('button');
  if (!removeButton) return;
  const item = removeButton.closest('li');
  const index = [...ui.favoritesList.children].indexOf(item);
  favorites.remove(item.dataset.id);

  const remaining = ui.favoritesList.querySelectorAll('li button');
  const target = remaining[index] ?? remaining[index - 1] ?? ui.favoritesEmpty;
  target.focus();
}
