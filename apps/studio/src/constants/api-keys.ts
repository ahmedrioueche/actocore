export const API_KEYS_LIMIT = 10;

/** Playful default names suggested when creating an API key. */
export const API_KEY_FUN_NAMES: string[] = [
  'Cosmic Otter',
  'Turbo Pickle',
  'Quantum Llama',
  'Sneaky Waffle',
  'Neon Penguin',
  'Galactic Hedgehog',
  'Disco Narwhal',
  'Velvet Raccoon',
  'Pixel Walrus',
  'Thunder Muffin',
];

export function getRandomApiKeyName(exclude?: string): string {
  const pool = API_KEY_FUN_NAMES.filter((name) => name !== exclude);
  const source = pool.length > 0 ? pool : API_KEY_FUN_NAMES;
  return source[Math.floor(Math.random() * source.length)];
}
