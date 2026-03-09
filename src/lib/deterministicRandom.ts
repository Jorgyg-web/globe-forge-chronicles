const FALLBACK_SEED = 0x6d2b79f5;

export function normalizeSeed(seed: number): number {
  const normalized = seed >>> 0;
  return normalized === 0 ? FALLBACK_SEED : normalized;
}

export function hashStringToSeed(value: string): number {
  let hash = 2166136261;

  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return normalizeSeed(hash);
}

export function nextRandom(seed: number): { value: number; seed: number } {
  const nextSeed = normalizeSeed(Math.imul(normalizeSeed(seed), 1664525) + 1013904223);
  return {
    value: nextSeed / 0x100000000,
    seed: nextSeed,
  };
}

export function randomFromKey(key: string): number {
  return nextRandom(hashStringToSeed(key)).value;
}

export function randomIntFromKey(key: string, min: number, maxInclusive: number): number {
  if (maxInclusive <= min) return min;
  return min + Math.floor(randomFromKey(key) * (maxInclusive - min + 1));
}

export function randomRangeFromKey(key: string, min: number, max: number): number {
  return min + randomFromKey(key) * (max - min);
}
