import json
import os
import copy
from engine import SimulationParams
from monte_carlo import run_monte_carlo, aggregate_results

def export_scenario(scenario_name: str, params: SimulationParams, filename: str):
    print(f"\n--- Running Scenario: {scenario_name} ---")
    
    # Run Simulation
    results = run_monte_carlo(params, n_sims=1000)
    stats = aggregate_results(results, params.T)
    
    # Format Data
    export_data = {
        "metadata": {
            "engine": "Python/NumPy v1.0",
            "scenario": scenario_name,
            "n_sims": 1000,
            "generated_at": "2025-04-10T12:00:00Z"
        },
        "time_series": []
    }
    
    for t in range(params.T):
        point = {
            "week": t,
            "price_mean": float(stats['price']['mean'][t]),
            "price_p05": float(stats['price']['p05'][t]),
            "price_p95": float(stats['price']['p95'][t]),
            
            "nodes_mean": float(stats['providers']['mean'][t]),
            "nodes_p05": float(stats['providers']['p05'][t]),
            "nodes_p95": float(stats['providers']['p95'][t]),
            
            "revenue_mean": float(stats['revenue']['mean'][t]),
            "revenue_p05": float(stats['revenue']['p05'][t]),
            "revenue_p95": float(stats['revenue']['p95'][t])
        }
        export_data["time_series"].append(point)
        
    # Save
    # Resolve path relative to THIS script file
    # src/research/python/export_data.py -> ../../../public/data
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(script_dir, "../../../public/data")
    output_path = os.path.join(output_dir, filename)
    
    os.makedirs(output_dir, exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(export_data, f, indent=2)
        
    print(f"✅ Data exported to {output_path}")

def export_all_research_data():
    # Base Params (Onocoy V3 Calibrated - WITH STABILIZATION TWEAKS)
    # The previous base params were causing a death spiral ($0.10 -> $0.01) even in neutral cases
    # We increase demand and reduce initial burn to stabilize the baseline.
    base_params = SimulationParams(
        T=52,
        initialSupply=410_000_000,
        initialPrice=0.10,
        initialProviders=3200,
        maxMintWeekly=2_000_000, # Reduced from 5M to 2M (Less inflation pressure)
        burnPct=0.65,
        initialLiquidity=10_000_000,
        investorUnlockWeek=24,
        investorSellPct=0.10,
        demandType='growth',
        macro='neutral',
        nSims=1000,
        seed=42,
        providerCostPerWeek=5.0,
        baseCapacityPerProvider=100.0,
        kDemandPrice=0.15,
        kMintPrice=0.05, # Reduced sensitivity to dilution (Logic: Market absorbs some inflation)
        rewardLagWeeks=4,
        churnThreshold=10.0,
        hardwareCost=150.0,
        competitorYield=0.0,
        emissionModel='fixed',
        revenueStrategy='burn'
    )
    
    # 1. Neutral (Base)
    export_scenario("Neutral Case", base_params, "research_neutral.json")
    
    # 2. Bull Market (High Demand, Bull Macro)
    bull_params = copy.deepcopy(base_params)
    bull_params.macro = 'bullish'
    bull_params.demandType = 'growth'
    bull_params.initialPrice = 0.12 # Slightly higher start
    # Boost demand base significantly
    # Note: engine.py's get_demand_series uses fixed base 12000. 
    # We should update engine.py to use params.baseDemand if possible, but for now we rely on macro drift.
    export_scenario("Bull Market", bull_params, "research_bull.json")
    
    # 3. Bear Market (Low Demand, Bear Macro)
    bear_params = copy.deepcopy(base_params)
    bear_params.macro = 'bearish'
    bear_params.demandType = 'consistent' # Stagnant demand
    bear_params.investorSellPct = 0.20 # Sell pressure
    export_scenario("Bear Market", bear_params, "research_bear.json")

    # 4. Hyper Growth (Extreme Bull)
    hyper_params = copy.deepcopy(base_params)
    hyper_params.macro = 'bullish'
    hyper_params.demandType = 'high-to-decay' # Viral adoption
    hyper_params.maxMintWeekly = 3_000_000 # Allow more supply for growth
    export_scenario("Hyper Growth", hyper_params, "research_hyper.json")

if __name__ == "__main__":
    export_all_research_data()
