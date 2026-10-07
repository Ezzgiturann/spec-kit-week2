/**
 * Pick one item uniformly at random.
 * @template T
 * @param {readonly T[]} items
 * @param {() => number} [rng] returns a number in [0, 1)
 * @returns {T}
 * @throws {RangeError} if items is empty
 */
export function pickRandom(items, rng = Math.random) {
  if (items.length === 0) throw new RangeError('pickRandom: items is empty');
  return items[Math.floor(rng() * items.length)];
}

/**
 * Pick one item uniformly among those whose id differs from `currentId`, using a single draw.
 * Returns the only item when there is just one; behaves like pickRandom when `currentId` is
 * not found.
 * @template {{ id: string }} T
 * @param {readonly T[]} items
 * @param {string} currentId
 * @param {() => number} [rng] returns a number in [0, 1)
 * @returns {T}
 * @throws {RangeError} if items is empty
 */
export function pickDifferent(items, currentId, rng = Math.random) {
  if (items.length === 0) throw new RangeError('pickDifferent: items is empty');
  const currentIndex = items.findIndex((item) => item.id === currentId);
  if (currentIndex === -1) return pickRandom(items, rng);
  if (items.length === 1) return items[0];

  // Draw among the other n - 1 positions, then step over the current one.
  const index = Math.floor(rng() * (items.length - 1));
  return items[index >= currentIndex ? index + 1 : index];
}
