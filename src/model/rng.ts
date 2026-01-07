/**
 * DePIN Stress Test - Seeded Random Number Generator
 * Provides reproducible randomness for Monte Carlo simulations
 */

/**
 * Seedable pseudo-random number generator using Linear Congruential Generator
 * Ensures reproducibility across simulation runs with the same seed
 */
export class SeededRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed || 42;
  }

  /**
   * Generate next random number in [0, 1)
   */
  next(): number {
    this.state = (this.state * 1664525 + 1013904223) % 4294967296;
    return this.state / 4294967296;
  }

  /**
   * Generate standard normal random variable using Box-Muller transform
   */
  normal(): number {
    let u = 0;
    let v = 0;
    while (u === 0) u = this.next();
    while (v === 0) v = this.next();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  /**
   * Generate normal random variable with specified mean and standard deviation
   */
  normalWithParams(mean: number, stdDev: number): number {
    return mean + stdDev * this.normal();
  }

  /**
   * Generate random integer in [min, max] inclusive
   */
  randInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Generate random float in [min, max)
   */
  randFloat(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Generate UUID-like string for provider IDs
   */
  uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.floor(this.next() * 16);
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Shuffle array in place using Fisher-Yates algorithm
   */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.randInt(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Pick random element from array
   */
  pick<T>(array: T[]): T {
    return array[this.randInt(0, array.length - 1)];
  }

  /**
   * Generate exponential random variable
   */
  exponential(lambda: number): number {
    return -Math.log(1 - this.next()) / lambda;
  }

  /**
   * Reset RNG to a new seed
   */
  reset(seed: number): void {
    this.state = seed || 42;
  }

  /**
   * Get current state (for debugging/serialisation)
   */
  getState(): number {
    return this.state;
  }
}

