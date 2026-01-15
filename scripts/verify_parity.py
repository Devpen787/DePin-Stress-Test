#!/usr/bin/env python3
"""
TS↔Python Parity Verification Script
DePIN Stress Test Simulator

This script implements the core simulation logic in Python to verify
that the TypeScript implementation produces consistent results.

Usage: python scripts/verify_parity.py
"""

import json
import math
import sys
from dataclasses import dataclass
from typing import List, Tuple

# ============================================================================
# CONFIGURATION
# ============================================================================

TOLERANCE = 0.05  # 5% relative tolerance for parity checks
SEED = 42  # Fixed seed for reproducibility

# ============================================================================
# SEEDED RNG (Matching TypeScript implementation)
# ============================================================================

class SeededRNG:
    """Linear Congruential Generator matching TypeScript SeededRNG"""
    def __init__(self, seed: int):
        self.seed = seed
    
    def next(self) -> float:
        self.seed = (self.seed * 1664525 + 1013904223) % (2 ** 32)
        return self.seed / (2 ** 32)
    
    def normal(self, mean: float = 0, std: float = 1) -> float:
        # Box-Muller transform
        u1 = max(self.next(), 1e-10)
        u2 = self.next()
        z = math.sqrt(-2 * math.log(u1)) * math.cos(2 * math.pi * u2)
        return mean + std * z

# ============================================================================
# SIMULATION PARAMETERS (Matching TypeScript defaults)
# ============================================================================

@dataclass
class SimulationParams:
    T: int = 52
    initialSupply: float = 1_000_000_000
    initialPrice: float = 0.05
    maxMintWeekly: float = 10_000_000
    burnPct: float = 0.3
    initialLiquidity: float = 500_000
    baseDemand: float = 10_000
    demandVolatility: float = 0.1
    initialProviders: int = 100
    baseCapacityPerProvider: float = 100
    providerCostPerWeek: float = 50
    churnThreshold: float = -100
    nSims: int = 1
    seed: int = SEED

# ============================================================================
# CORE SIMULATION LOGIC
# ============================================================================

def run_single_simulation(params: SimulationParams) -> List[dict]:
    """Run a single simulation trajectory matching TypeScript logic."""
    rng = SeededRNG(params.seed)
    results = []
    
    token_price = params.initialPrice
    token_supply = params.initialSupply
    liquidity = params.initialLiquidity
    active_providers = params.initialProviders
    
    for t in range(params.T):
        # Demand with noise
        demand = params.baseDemand * (1 + rng.normal(0, params.demandVolatility))
        demand = max(0, demand)
        
        # Capacity
        capacity = active_providers * params.baseCapacityPerProvider
        
        # Demand served (capped by capacity)
        demand_served = min(demand, capacity)
        
        # Utilization
        utilization = (demand_served / capacity * 100) if capacity > 0 else 0
        
        # Minting (emissions)
        minted = min(params.maxMintWeekly, demand_served * 100)
        
        # Burning
        burned = minted * params.burnPct
        
        # Token economics
        token_supply = token_supply + minted - burned
        
        # Simple price model (AMM-inspired)
        # Price = Liquidity / Supply (simplified constant product)
        if token_supply > 0:
            token_price = liquidity / (token_supply * 0.01)  # Scaling factor
            token_price = max(0.001, min(token_price, 100))  # Clamp
        
        # Provider economics
        provider_revenue = (minted / active_providers) * token_price if active_providers > 0 else 0
        provider_profit = provider_revenue - params.providerCostPerWeek
        
        # Churn (simplified)
        if provider_profit < params.churnThreshold:
            churn_rate = 0.05  # 5% churn when unprofitable
        else:
            churn_rate = 0.01  # 1% baseline churn
        
        churned = int(active_providers * churn_rate)
        active_providers = max(1, active_providers - churned)
        
        # Solvency score
        solvency_score = (burned / minted) if minted > 0 else 0
        
        results.append({
            't': t,
            'price': token_price,
            'supply': token_supply,
            'demand': demand,
            'demand_served': demand_served,
            'providers': active_providers,
            'capacity': capacity,
            'minted': minted,
            'burned': burned,
            'utilization': utilization,
            'profit': provider_profit,
            'solvencyScore': solvency_score
        })
    
    return results

# ============================================================================
# PARITY VERIFICATION
# ============================================================================

def verify_parity(python_results: List[dict], ts_results: List[dict]) -> Tuple[bool, List[str]]:
    """Compare Python and TypeScript results within tolerance."""
    errors = []
    
    if len(python_results) != len(ts_results):
        errors.append(f"Length mismatch: Python={len(python_results)}, TS={len(ts_results)}")
        return False, errors
    
    for i, (py, ts) in enumerate(zip(python_results, ts_results)):
        for key in ['price', 'supply', 'demand', 'providers', 'solvencyScore']:
            py_val = py.get(key, 0)
            ts_val = ts.get(key, 0)
            
            if ts_val == 0:
                if py_val != 0:
                    errors.append(f"t={i}, {key}: Python={py_val}, TS={ts_val} (TS is zero)")
            else:
                rel_error = abs(py_val - ts_val) / abs(ts_val)
                if rel_error > TOLERANCE:
                    errors.append(f"t={i}, {key}: Python={py_val:.4f}, TS={ts_val:.4f}, error={rel_error:.2%}")
    
    return len(errors) == 0, errors

# ============================================================================
# MAIN
# ============================================================================

def main():
    print("=" * 60)
    print("DePIN Stress Test - Python Parity Verification")
    print("=" * 60)
    
    params = SimulationParams()
    print(f"\nRunning Python simulation with seed={params.seed}...")
    python_results = run_single_simulation(params)
    
    print(f"Completed. {len(python_results)} timesteps generated.")
    
    # Output sample results
    print("\n--- Sample Python Results (t=0, t=25, t=51) ---")
    for t in [0, 25, 51]:
        r = python_results[t]
        print(f"t={t}: price={r['price']:.4f}, providers={r['providers']}, solvency={r['solvencyScore']:.2f}")
    
    # Save to JSON for external comparison
    output_path = "scripts/parity_python_output.json"
    with open(output_path, 'w') as f:
        json.dump(python_results, f, indent=2)
    print(f"\nResults saved to: {output_path}")
    
    # Load TS results if available
    ts_output_path = "scripts/parity_ts_output.json"
    try:
        with open(ts_output_path, 'r') as f:
            ts_results = json.load(f)
        
        print(f"\nComparing with TypeScript results from: {ts_output_path}")
        passed, errors = verify_parity(python_results, ts_results)
        
        if passed:
            print("\n✅ PARITY CHECK PASSED")
            print("Python and TypeScript implementations produce consistent results.")
            return 0
        else:
            print("\n❌ PARITY CHECK FAILED")
            print(f"Found {len(errors)} discrepancies (tolerance={TOLERANCE*100}%):")
            for err in errors[:10]:  # Show first 10
                print(f"  - {err}")
            if len(errors) > 10:
                print(f"  ... and {len(errors) - 10} more")
            return 1
    except FileNotFoundError:
        print(f"\n⚠️  No TypeScript output found at: {ts_output_path}")
        print("To complete parity check:")
        print("  1. Run: node scripts/generate_parity_ts.js")
        print("  2. Re-run this script")
        return 0

if __name__ == "__main__":
    sys.exit(main())
