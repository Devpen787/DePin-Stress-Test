import numpy as np
import math
from dataclasses import dataclass, field
from typing import List, Literal, Optional

# Constants matching JS implementation
DEMAND_TYPES = Literal['consistent', 'high-to-decay', 'growth', 'volatile']
MACRO_TYPES = Literal['neutral', 'bullish', 'bearish']
EMISSION_MODELS = Literal['fixed', 'kpi']
REVENUE_STRATEGIES = Literal['burn', 'reserve']

@dataclass
class SimulationParams:
    T: int
    initialSupply: float
    initialPrice: float
    initialProviders: float
    maxMintWeekly: float
    burnPct: float
    
    # Module 3
    initialLiquidity: float
    investorUnlockWeek: int
    investorSellPct: float
    
    demandType: DEMAND_TYPES
    macro: MACRO_TYPES
    nSims: int
    seed: int
    providerCostPerWeek: float
    baseCapacityPerProvider: float
    kDemandPrice: float
    kMintPrice: float
    rewardLagWeeks: int
    churnThreshold: float
    hardwareCost: float
    
    # Module 4
    competitorYield: float
    emissionModel: EMISSION_MODELS
    revenueStrategy: REVENUE_STRATEGIES
    
    # Module 5
    growthCallEventWeek: Optional[int] = None
    growthCallEventPct: Optional[float] = None

@dataclass
class SimResult:
    t: int
    price: float
    supply: float
    demand: float
    demand_served: float
    providers: float
    capacity: float
    servicePrice: float
    minted: float
    burned: float
    utilization: float
    profit: float
    scarcity: float
    incentive: float
    solvencyScore: float
    netDailyLoss: float
    dailyMintUsd: float
    dailyBurnUsd: float
    netFlow: float
    churnCount: float
    joinCount: float
    treasuryBalance: float
    vampireChurn: float

def get_demand_series(T: int, base: float, type: DEMAND_TYPES, rng: np.random.Generator) -> np.ndarray:
    t_vals = np.arange(T)
    noise = rng.normal(0, 1, T)
    
    if type == 'consistent':
        d = base * (1 + 0.03 * noise)
    elif type == 'high-to-decay':
        d = base * (1.6 * np.exp(-t_vals / 10) + 0.6) * (1 + 0.05 * noise)
    elif type == 'growth':
        d = base * (0.8 + 0.02 * t_vals) * (1 + 0.05 * noise)
    elif type == 'volatile':
        d = base * (1 + 0.20 * noise)
    else:
        d = np.full(T, base)
        
    return np.maximum(0, d)

def simulate_one(params: SimulationParams, sim_seed: int) -> List[SimResult]:
    rng = np.random.default_rng(sim_seed)
    
    # Macro Settings
    mu, sigma = 0.002, 0.05
    if params.macro == 'bearish':
        mu, sigma = -0.01, 0.06
    elif params.macro == 'bullish':
        mu, sigma = 0.015, 0.06
        
    demands = get_demand_series(params.T, 12000, params.demandType, rng)
    results = []
    
    state = {
        'supply': params.initialSupply,
        'price': params.initialPrice,
        'providers': params.initialProviders or 30,
        'servicePrice': 0.5,
        'treasuryBalance': 0,
        'rewardHistory': [params.providerCostPerWeek * 1.5] * max(1, params.rewardLagWeeks),
        'consecutiveLowProfitWeeks': 0
    }
    
    # AMM Initial
    pool_usd = params.initialLiquidity
    pool_tokens = pool_usd / state['price']
    k_amm = pool_usd * pool_tokens
    
    for t in range(params.T):
        demand = demands[t]
        capacity = max(0.001, state['providers'] * params.baseCapacityPerProvider)
        demand_served = min(demand, capacity)
        utilization = (demand_served / capacity) * 100
        
        scarcity = (demand - capacity) / capacity
        state['servicePrice'] = min(max(state['servicePrice'] * (1 + 0.6 * scarcity), 0.05), 5.0)
        
        safe_price = max(state['price'], 0.0001)
        tokens_spent = (demand_served * state['servicePrice']) / safe_price
        
        burned_raw = params.burnPct * tokens_spent
        burned = min(state['supply'] * 0.95, burned_raw)
        
        # Emissions
        saturation = min(1.0, state['providers'] / 5000.0)
        emission_factor = 0.6 + 0.4 * math.tanh(demand / 15000.0) - (0.2 * saturation)
        
        if params.emissionModel == 'kpi':
            utilization_ratio = min(1, demand_served / capacity)
            emission_factor *= max(0.3, utilization_ratio)
            if state['price'] < params.initialPrice * 0.8:
                emission_factor *= 0.6
                
        minted = max(0, min(params.maxMintWeekly, params.maxMintWeekly * emission_factor))
        state['supply'] = max(1000.0, state['supply'] + minted - burned)
        
        # Rewards
        instant_reward_value = (minted / max(state['providers'], 0.1)) * safe_price
        state['rewardHistory'].append(instant_reward_value)
        if len(state['rewardHistory']) > max(1, params.rewardLagWeeks):
            state['rewardHistory'].pop(0)
            
        delayed_reward = state['rewardHistory'][0]
        profit = delayed_reward - params.providerCostPerWeek
        incentive = profit / params.providerCostPerWeek
        
        if profit < params.churnThreshold:
            state['consecutiveLowProfitWeeks'] += 1
        else:
            state['consecutiveLowProfitWeeks'] = max(0, state['consecutiveLowProfitWeeks'] - 1)
            
        churn_multiplier = 1.0
        if state['consecutiveLowProfitWeeks'] > 2: churn_multiplier = 1.8
        if state['consecutiveLowProfitWeeks'] > 5: churn_multiplier = 4.0
        
        # Provider Growth/Churn
        max_growth = state['providers'] * 0.15
        raw_delta = (incentive * 4.5 * churn_multiplier) + rng.normal() * 0.5
        delta = max(-state['providers'] * 0.1, min(max_growth, raw_delta))
        
        # Vampire Attack
        vampire_churn_amount = 0
        if params.competitorYield > 0.2:
            vampire_churn_amount = state['providers'] * params.competitorYield * 0.025
            delta -= vampire_churn_amount
            
        # ROI Churn
        weekly_reward_usd = instant_reward_value
        payback_months = params.hardwareCost / (weekly_reward_usd * 4.33) if weekly_reward_usd > 0 else 999
        if payback_months > 24: delta -= state['providers'] * 0.0125
        if payback_months > 36: delta -= state['providers'] * 0.025
        
        net_flow = 0
        next_price = state['price']
        
        # Price Model
        if t == params.investorUnlockWeek:
            unlock_amount = state['supply'] * params.investorSellPct
            new_pool_tokens = pool_tokens + unlock_amount
            new_pool_usd = k_amm / new_pool_tokens
            
            pool_tokens = new_pool_tokens
            pool_usd = new_pool_usd
            next_price = pool_usd / pool_tokens
            net_flow = -unlock_amount
            
            price_drop_pct = max(0, 1 - (next_price / state['price']))
            panic_churn = state['providers'] * price_drop_pct * 1.5
            delta -= panic_churn
        else:
            demand_pressure = params.kDemandPrice * math.tanh(scarcity)
            dilution_pressure = -params.kMintPrice * (minted / state['supply']) * 100
            log_ret = mu + demand_pressure + dilution_pressure + sigma * rng.normal()
            next_price = max(0.01, state['price'] * math.exp(log_ret))
            
            # Re-sync AMM
            pool_usd = math.sqrt(k_amm * next_price)
            pool_tokens = math.sqrt(k_amm / next_price)
            
        # Treasury / Sinking Fund
        daily_mint_usd = (minted / 7) * state['price']
        daily_burn_usd = (burned / 7) * state['price']
        net_daily_loss = daily_burn_usd - daily_mint_usd
        solvency_score = daily_burn_usd / daily_mint_usd if daily_mint_usd > 0 else 10
        
        if params.revenueStrategy == 'reserve':
            state['treasuryBalance'] += minted * state['price'] * 0.1
            if next_price < state['price']:
                price_drop = state['price'] - next_price
                next_price = state['price'] - (price_drop * 0.5)
        else:
            next_price = next_price * 1.001
            
        results.append(SimResult(
            t=t, price=state['price'], supply=state['supply'], demand=demand,
            demand_served=demand_served, providers=state['providers'], capacity=capacity,
            servicePrice=state['servicePrice'], minted=minted, burned=burned,
            utilization=utilization, profit=profit, scarcity=scarcity, incentive=incentive,
            solvencyScore=solvency_score, netDailyLoss=net_daily_loss,
            dailyMintUsd=daily_mint_usd, dailyBurnUsd=daily_burn_usd, netFlow=net_flow,
            churnCount=abs(delta) if delta < 0 else 0,
            joinCount=delta if delta > 0 else 0,
            treasuryBalance=state['treasuryBalance'],
            vampireChurn=vampire_churn_amount
        ))
        
        state['price'] = next_price
        state['providers'] = max(2, state['providers'] + delta)
        
    return results
