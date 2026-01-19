import time
import numpy as np
import pandas as pd
from multiprocessing import Pool, cpu_count
from engine import SimulationParams, simulate_one, SimResult

def run_simulation_batch(args):
    """Wrapper for multiprocessing"""
    params, seed = args
    return simulate_one(params, seed)

def run_monte_carlo(base_params: SimulationParams, n_sims: int = 1000):
    print(f"Starting {n_sims} Monte Carlo Simulations...")
    start_time = time.time()
    
    # Generate random seeds
    seeds = np.random.randint(0, 1000000, n_sims)
    tasks = [(base_params, seed) for seed in seeds]
    
    # Parallel Execution
    with Pool(processes=cpu_count()) as pool:
        results = pool.map(run_simulation_batch, tasks)
        
    duration = time.time() - start_time
    print(f"Completed in {duration:.2f} seconds ({n_sims / duration:.0f} sims/sec)")
    
    return results

def aggregate_results(results: list[list[SimResult]], T: int):
    # Extract time series for key metrics
    # Shape: (n_sims, T)
    prices = np.zeros((len(results), T))
    providers = np.zeros((len(results), T))
    revenues = np.zeros((len(results), T))
    
    for i, res in enumerate(results):
        for t in range(T):
            prices[i, t] = res[t].price
            providers[i, t] = res[t].providers
            revenues[i, t] = res[t].demand_served * res[t].servicePrice
            
    # Calculate Percentiles
    agg = {
        'price': {
            'mean': np.mean(prices, axis=0),
            'p05': np.percentile(prices, 5, axis=0),
            'p95': np.percentile(prices, 95, axis=0)
        },
        'providers': {
            'mean': np.mean(providers, axis=0),
            'p05': np.percentile(providers, 5, axis=0),
            'p95': np.percentile(providers, 95, axis=0)
        },
        'revenue': {
            'mean': np.mean(revenues, axis=0) * 52, # Annualized
            'p05': np.percentile(revenues, 5, axis=0) * 52,
            'p95': np.percentile(revenues, 95, axis=0) * 52
        }
    }
    
    return agg

if __name__ == "__main__":
    # Define Baseline Parameters (Onocoy V3 Calibrated)
    # Source: src/data/protocols.ts [ono_v3_calibrated]
    params = SimulationParams(
        T=52,
        initialSupply=410_000_000,
        initialPrice=0.10,
        initialProviders=3200,
        maxMintWeekly=5_000_000,
        burnPct=0.65,
        initialLiquidity=10_000_000,
        investorUnlockWeek=24,
        investorSellPct=0.10,
        demandType='growth',
        macro='neutral',
        nSims=1,
        seed=42,
        providerCostPerWeek=5.0,
        baseCapacityPerProvider=100.0,
        kDemandPrice=0.15,
        kMintPrice=0.10,  # Reduced dilution impact for stronger token
        rewardLagWeeks=4,
        churnThreshold=10.0,
        hardwareCost=150.0,
        competitorYield=0.0,
        emissionModel='fixed',
        revenueStrategy='burn'
    )
    
    # Run
    sim_results = run_monte_carlo(params, n_sims=1000)
    stats = aggregate_results(sim_results, params.T)
    
    # Report Final Week Stats
    final_price = stats['price']['mean'][-1]
    final_nodes = stats['providers']['mean'][-1]
    final_rev = stats['revenue']['mean'][-1]
    
    print("\n=== RESEARCH REPORT (Week 52) ===")
    print(f"Price:       ${final_price:.2f} (90% CI: ${stats['price']['p05'][-1]:.2f} - ${stats['price']['p95'][-1]:.2f})")
    print(f"Active Nodes:{final_nodes:.0f} (90% CI: {stats['providers']['p05'][-1]:.0f} - {stats['providers']['p95'][-1]:.0f})")
    print(f"Annual Rev:  ${final_rev/1e6:.2f}M")
    print("=================================")
