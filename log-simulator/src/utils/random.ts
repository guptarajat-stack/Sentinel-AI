/**
 * Generates a random integer between min and max (inclusive).
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Returns a random element from an array.
 */
export function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Returns a subset of unique elements from an array.
 */
export function randomSample<T>(array: T[], size: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

/**
 * Performs a weighted random selection.
 * Expects an array of items and an array of corresponding weights (should sum up to 1, or relative values).
 */
export function weightedRandom<T>(items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((acc, w) => acc + w, 0);
  let r = Math.random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    if (r < weights[i]) {
      return items[i];
    }
    r -= weights[i];
  }
  return items[items.length - 1];
}

/**
 * Returns true with the given probability (0.0 to 1.0).
 */
export function randomChance(probability: number): boolean {
  return Math.random() < probability;
}
