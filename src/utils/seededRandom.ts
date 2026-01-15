/**
 * Seeded Random Number Generator Utility
 * 
 * Provides reproducible random numbers for simulations.
 * All visualization code that needs randomness should use this instead of Math.random().
 */

import { SeededRNG } from '../model/rng';

// Global RNG instance for visualization randomness
let globalRng: SeededRNG | null = null;

/**
 * Initialize the global RNG with a seed
 * Call this at the start of any simulation or visualization that needs reproducibility
 */
export function initGlobalRng(seed: number): void {
    globalRng = new SeededRNG(seed);
}

/**
 * Get a random number between 0 and 1 (exclusive)
 * Uses the seeded RNG if initialized, otherwise throws an error
 */
export function seededRandom(): number {
    if (!globalRng) {
        // Fall back to a default seed if not initialized (for safety)
        console.warn('seededRandom called before initGlobalRng - using default seed 42');
        globalRng = new SeededRNG(42);
    }
    return globalRng.next();
}

/**
 * Get a seeded random number in a range
 */
export function seededRandomRange(min: number, max: number): number {
    return min + seededRandom() * (max - min);
}

/**
 * Reset the global RNG (useful between simulation runs)
 */
export function resetGlobalRng(): void {
    globalRng = null;
}

/**
 * Check if the global RNG has been initialized
 */
export function isRngInitialized(): boolean {
    return globalRng !== null;
}
