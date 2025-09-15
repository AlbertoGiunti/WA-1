/**
 * Domain logic for letter frequency, costs, and butterfly generation
 * Contains the core business rules for letter pricing and frequency calculations
 */

// Indicative frequencies (for Butterfly component)
export const letterFrequency = {
  E:12.7, T:9.1, A:8.2, O:7.5, I:7.0, N:6.7, S:6.3, H:6.1, R:6.0, D:4.3,
  L:4.0, C:2.8, U:2.8, M:2.4, W:2.4, F:2.2, G:2.0, Y:2.0, P:1.9, B:1.5,
  V:1.0, K:0.8, J:0.15, X:0.15, Q:0.1, Z:0.07
};

// Cost: vowels 10; consonants in tiers (5..1)
const vowels = new Set(['A','E','I','O','U']);
const tier5 = new Set(['T','N','S','H','R']);                 // most frequent -> most expensive among consonants
const tier4 = new Set(['D','L']);                             // indicative choice consistent with requirements
const tier3 = new Set(['C', 'U','M','W','F','G','Y','P']);
const tier2 = new Set(['B','V','K']);
const tier1 = new Set(['J','X','Q','Z']);

/**
 * Calculates the cost of a letter based on its frequency tier
 * @param {string} ch - Letter to calculate cost for
 * @returns {number} Cost in coins (1-10)
 */
export function letterCost(ch) {
  const c = ch.toUpperCase();
  if (vowels.has(c)) return 10;
  if (tier5.has(c)) return 5;
  if (tier4.has(c)) return 4;
  if (tier3.has(c)) return 3;
  if (tier2.has(c)) return 2;
  if (tier1.has(c)) return 1;
  return 2; // default for safety
}

/**
 * Generates random letters for the butterfly component
 * @param {number} n - Number of letters to generate
 * @returns {Array} Array of letter objects with frequency and cost
 */
export function randomButterfly(n=10) {
  const letters = Object.keys(letterFrequency);
  const set = new Set();
  while (set.size < n) {
    const l = letters[Math.floor(Math.random()*letters.length)];
    set.add(l);
  }
  return [...set].map(l => ({ letter: l, frequency: letterFrequency[l], cost: letterCost(l) }));
}