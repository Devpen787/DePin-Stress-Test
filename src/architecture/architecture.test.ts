import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Architecture Enforcement Tests
 * 
 * These tests verify that architectural invariants are maintained.
 * They scan the codebase for patterns that violate the established architecture.
 * 
 * Run as part of CI to prevent architectural drift.
 */

const SRC_DIR = path.join(__dirname, '../');

// Helper to read file content
function readFile(filePath: string): string {
    try {
        return fs.readFileSync(filePath, 'utf-8');
    } catch {
        return '';
    }
}

// Helper to get all TypeScript/TSX files
function getAllFiles(dir: string, exts = ['.ts', '.tsx']): string[] {
    const files: string[] = [];

    function walk(currentDir: string) {
        try {
            const entries = fs.readdirSync(currentDir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(currentDir, entry.name);
                if (entry.isDirectory() && !entry.name.includes('node_modules') && !entry.name.startsWith('.')) {
                    walk(fullPath);
                } else if (entry.isFile() && exts.some(ext => entry.name.endsWith(ext))) {
                    files.push(fullPath);
                }
            }
        } catch {
            // Ignore permission errors
        }
    }

    walk(dir);
    return files;
}

describe('Architecture Invariants', () => {

    describe('No Direct Engine Imports (Phase 9)', () => {
        it('UI components should not import directly from legacy/engine.ts', () => {
            const componentFiles = getAllFiles(path.join(SRC_DIR, 'components'));
            const violations: string[] = [];

            for (const file of componentFiles) {
                const content = readFile(file);
                // Check for any import from legacy/engine
                if (content.includes("from '../model/legacy/engine'") ||
                    content.includes("from '../../model/legacy/engine'")) {
                    // Allow TYPE-ONLY imports (LegacySimulationParams as SimulationParams, etc.)
                    // These are safe - they import type aliases, not runtime code
                    if (content.includes('LegacySimulationParams as SimulationParams') ||
                        content.includes('LegacyAggregateResult as AggregateResult')) {
                        continue; // Type alias imports are allowed
                    }
                    violations.push(path.relative(SRC_DIR, file));
                }
            }

            expect(violations).toEqual([]);
        });

        it('useSimulationRunner should import from SimulationAdapter', () => {
            const hookPath = path.join(SRC_DIR, 'hooks/useSimulationRunner.ts');
            const content = readFile(hookPath);

            expect(content).toContain("from '../model/SimulationAdapter'");
        });
    });

    describe('No Math.random() in Visualization (Phase 10)', () => {
        it('should not use Math.random() in components except for user-triggered actions', () => {
            const componentFiles = getAllFiles(path.join(SRC_DIR, 'components'));
            const violations: string[] = [];

            for (const file of componentFiles) {
                const content = readFile(file);
                // Skip test files
                if (file.includes('.test.')) continue;

                // Check for Math.random() usage
                const matches = content.match(/Math\.random\(\)/g) || [];
                if (matches.length === 0) continue;

                // Allow one Math.random for seed randomizer button in SimulatorSidebar
                // This is an intentional user-triggered action, not visualization logic
                if (file.includes('SimulatorSidebar') && matches.length === 1 &&
                    content.includes('seed: Math.floor(Math.random()')) {
                    continue;
                }

                violations.push(path.relative(SRC_DIR, file));
            }

            expect(violations).toEqual([]);
        });
    });

    describe('ID-Based Lookups (Phase 8)', () => {
        it('chartInterpretations should not export getInterpretationByLabel', () => {
            const interpPath = path.join(SRC_DIR, 'data/chartInterpretations.ts');
            const content = readFile(interpPath);

            expect(content).not.toContain('export function getInterpretationByLabel');
        });

        it('BaseChartBox should accept metricId prop', () => {
            const chartBoxPath = path.join(SRC_DIR, 'components/ui/BaseChartBox.tsx');
            const content = readFile(chartBoxPath);

            expect(content).toContain('metricId?:');
        });
    });

    describe('Executable Registry (Phase 7)', () => {
        it('all metrics should have compute functions', () => {
            const registryPath = path.join(SRC_DIR, 'data/MetricRegistry.ts');
            const content = readFile(registryPath);

            // Count metrics and compute functions
            const metricMatches = content.match(/id: '[a-z_]+'/g) || [];
            const computeMatches = content.match(/compute: \(d/g) || [];

            // All metrics should have compute functions
            expect(computeMatches.length).toBeGreaterThanOrEqual(metricMatches.length);
        });
    });

    describe('MetricsPipeline Exists (Phase 7)', () => {
        it('MetricsPipeline.ts should exist and export key functions', () => {
            const pipelinePath = path.join(SRC_DIR, 'metrics/MetricsPipeline.ts');
            const content = readFile(pipelinePath);

            expect(content).toContain('export function computeMetric');
            expect(content).toContain('export function computeAllMetrics');
            expect(content).toContain('export function getMetricHealth');
        });
    });

    describe('Seeded Random Utility (Phase 10)', () => {
        it('seededRandom.ts should exist and export utility functions', () => {
            const seededPath = path.join(SRC_DIR, 'utils/seededRandom.ts');
            const content = readFile(seededPath);

            expect(content).toContain('export function seededRandom');
            expect(content).toContain('export function initGlobalRng');
        });
    });
});
