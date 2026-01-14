import { describe, it, expect } from 'vitest';
import { SeededRNG } from './rng';

describe('SeededRNG (Determinism Verification)', () => {

    describe('1. Determinism', () => {
        it('should produce identical sequences for the same seed', () => {
            const rng1 = new SeededRNG(12345);
            const rng2 = new SeededRNG(12345);

            expect(rng1.next()).toBe(rng2.next());
            expect(rng1.next()).toBe(rng2.next());
            expect(rng1.randInt(0, 100)).toBe(rng2.randInt(0, 100));
            expect(rng1.normal()).toBe(rng2.normal());
        });

        it('should produce different sequences for different seeds', () => {
            const rng1 = new SeededRNG(12345);
            const rng2 = new SeededRNG(67890);

            expect(rng1.next()).not.toBe(rng2.next());
        });
    });

    describe('2. Distribution Properties (Sanity Check)', () => {
        it('Uniform distribution should be approximately uniform', () => {
            const rng = new SeededRNG(123);
            const buckets = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            const N = 10000;

            for (let i = 0; i < N; i++) {
                const val = rng.next();
                const bucket = Math.floor(val * 10);
                buckets[bucket]++;
            }

            // Each bucket should have roughly 10%
            buckets.forEach(count => {
                const pct = count / N;
                expect(pct).toBeGreaterThan(0.08);
                expect(pct).toBeLessThan(0.12);
            });
        });

        it('Normal distribution should have mean ~0 and stdDev ~1', () => {
            const rng = new SeededRNG(123);
            const values: number[] = [];
            const N = 5000;

            for (let i = 0; i < N; i++) {
                values.push(rng.normal());
            }

            const mean = values.reduce((a, b) => a + b, 0) / N;
            const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / N;
            const stdDev = Math.sqrt(variance);

            // Mean should be close to 0
            expect(Math.abs(mean)).toBeLessThan(0.05);
            // StdDev should be close to 1
            expect(Math.abs(stdDev - 1)).toBeLessThan(0.05);
        });
    });

});
