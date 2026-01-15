export interface BenchmarkPoint {
    month: number;
    price: number;
    nodes: number;
    label: string;
}

// Normalized Helium Data (2019 - 2021 Growth Phase)
// Source: Helium Explorer / CoinGecko
export const HELIUM_BENCHMARK: BenchmarkPoint[] = [
    { month: 0, price: 0.25, nodes: 3000, label: 'Start' },
    { month: 3, price: 0.28, nodes: 4500, label: 'Q1' },
    { month: 6, price: 0.35, nodes: 7000, label: 'Q2' },
    { month: 9, price: 1.20, nodes: 12000, label: 'Parabolic Start' },
    { month: 12, price: 4.50, nodes: 25000, label: 'Year 1' },
    { month: 15, price: 12.00, nodes: 80000, label: 'Hyper Growth' },
    { month: 18, price: 25.00, nodes: 200000, label: 'Peak Hype' },
    { month: 24, price: 40.00, nodes: 500000, label: 'Year 2 Peak' },
];

export const BENCHMARKS = {
    helium: HELIUM_BENCHMARK
};
