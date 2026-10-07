import { QUOTES } from './quotes.js';
import { pickRandom, pickDifferent } from './random.js';
import { createStorage } from './storage.js';
import { createFavorites } from './favorites.js';
import { mountApp } from './view.js';

const favorites = createFavorites(createStorage(), new Set(QUOTES.map((quote) => quote.id)));

mountApp(document.querySelector('#app'), {
  quotes: QUOTES,
  favorites,
  pickRandom,
  pickDifferent,
  rng: Math.random,
});
