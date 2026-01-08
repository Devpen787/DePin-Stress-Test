
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceLine, ComposedChart, Bar, Cell } from 'recharts';
import {
  Play,
  Settings2,
  Activity,
  Database,
  Users,
  DollarSign,
  Info,
  RefreshCw,
  AlertTriangle,
  BrainCircuit,
  X,
  Scale,
  CheckCircle2,
  HeartPulse,
  ArrowDownUp,
  UserCheck,
  BookOpen,
  FileJson,
  Fingerprint,
  HelpCircle,
  Maximize2,
  Minimize2,
  ListOrdered,
  Layers,
  ShieldAlert,
  BarChart3,
  Search,
  CheckSquare,
  AlertCircle,
  FileText,
  GanttChartSquare,
  ShieldCheck,
  Zap,
  ShieldQuestion,
  TrendingDown,
  TrendingUp,
  Target,
  Waves,
  Library,
  Stethoscope,
  FlameKindling,
  Flame,
  Crosshair,
  GitCompare,
  LayoutGrid,
  Lock,
  Calculator,
  History,
  Binary,
  Variable,
  Download,
  FileDown,
  Share2,
  Gauge,
  TrendingUp as Trending,
  ChevronDown,
  ChevronRight,
  Sliders,
  Box,
  Wallet,
  Clock,
  UserMinus,
  Droplets,
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// Import new modular model
import {
  type SimulationParams as NewSimulationParams,
  type AggregateResult as NewAggregateResult,
  type DerivedMetrics,
  runSimulation as runNewSimulation,
  calculateDerivedMetrics,
  PARAM_DOCS,
  getParamTooltip,
  DEFAULT_PARAMS,
  type DemandType,
  type MacroCondition,
} from './src/model';
import { PROTOCOL_PROFILES, ProtocolProfileV1 } from './src/data/protocols';
import { ExplorerTab } from './src/components/explorer/ExplorerTab';
import { Settings } from './src/components/Settings';
import { MethodologyDrawer } from './src/components/MethodologyDrawer';
import { SectionLayout } from './src/components/SectionLayout';
import { MethodologySheet } from './src/components/MethodologySheet';
import { exportToCSV, exportToJSON, generateShareableURL, copyToClipboard } from './src/utils/export';
import { formatCompact as formatCompactUtil, formatPercent, formatChange } from './src/utils/format';
import {
  fetchAllProtocolData,
  fetchMultipleTokens,
  type TokenMarketData,
  type ProtocolLiveData,
  COINGECKO_TOKEN_IDS,
  DEPIN_TOKENS,
  loadFromLocalStorage,
  saveToLocalStorage,
  autoRefreshManager,
  getTimeUntilNextRefresh,
  ALL_DEPIN_TOKEN_IDS,
} from './src/services/coingecko';
import {
  getMockOnChainMetrics,
  isDuneConfigured,
  getDuneStatus,
  saveDuneApiKey,
  type OnChainMetrics,
} from './src/services/dune';

/**
 * Seedable Random Number Generator
 */
class SeededRNG {
  private state: number;
  constructor(seed: number) {
    this.state = seed || 42;
  }
  next() {
    this.state = (this.state * 1664525 + 1013904223) % 4294967296;
    return this.state / 4294967296;
  }
  normal() {
    let u = 0, v = 0;
    while (u === 0) u = this.next();
    while (v === 0) v = this.next();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }
}

// Types
// Types moved to model or data
type ViewMode = 'sandbox' | 'comparison' | 'explorer' | 'settings';




interface SimulationParams {
  T: number;
  initialSupply: number;
  initialPrice: number;
  maxMintWeekly: number;
  burnPct: number;

  // Liquidity & Investor Unlock (Module 3)
  initialLiquidity: number;
  investorUnlockWeek: number;
  investorSellPct: number;

  demandType: DemandType;
  macro: MacroCondition;
  nSims: number;
  seed: number;
  providerCostPerWeek: number;
  baseCapacityPerProvider: number;
  kDemandPrice: number;
  kMintPrice: number;
  rewardLagWeeks: number;
  churnThreshold: number;
}

interface SimResult {
  t: number;
  price: number;
  supply: number;
  demand: number;
  demand_served: number;
  providers: number;
  capacity: number;
  servicePrice: number;
  minted: number;
  burned: number;
  utilization: number;
  profit: number;
  scarcity: number;
  incentive: number;
  solvencyScore: number;
  netDailyLoss: number;
  dailyMintUsd: number;
  dailyBurnUsd: number;
  netFlow: number;
  churnCount: number;
  joinCount: number;
}

interface MetricStats {
  mean: number;
  p10: number;
  p90: number;
}

interface AggregateResult {
  t: number;
  price: MetricStats;
  supply: MetricStats;
  demand: MetricStats;
  demand_served: MetricStats;
  providers: MetricStats;
  capacity: MetricStats;
  servicePrice: MetricStats;
  minted: MetricStats;
  burned: MetricStats;
  utilization: MetricStats;
  profit: MetricStats;
  scarcity: MetricStats;
  incentive: MetricStats;
  solvencyScore: MetricStats;
  netDailyLoss: MetricStats;
  dailyMintUsd: MetricStats;
  dailyBurnUsd: MetricStats;
  netFlow: MetricStats;
  churnCount: MetricStats;
  joinCount: MetricStats;
}

interface ChartInterpretation {
  subtitle: string;
  question: string;
  formula: string;
  robust: string;
  fragile: string;
  failureMode: string;
}

const CHART_INTERPRETATIONS: Record<string, ChartInterpretation> = {
  "Capacity vs Demand": {
    subtitle: "Analysis of market clearing and service availability.",
    question: "Does the network maintain sufficient throughput to satisfy exogenous demand without extreme over-provisioning?",
    formula: "min(Demand_t, Providers_t * BaseCapacity)",
    robust: "Capacity remains slightly above demand; minimal unserved requests.",
    fragile: "Sustained service gaps or excessive idle hardware waste.",
    failureMode: "Supply-side bottleneck: The network cannot scale to meet utility needs."
  },
  "Provider Count": {
    subtitle: "Assessment of supply-side participation and node operator churn.",
    question: "Does the reward structure retain a minimum viable threshold of operators during macro stress?",
    formula: "Providers_{t+1} = Providers_t + (ROI_t * Sensitivity * ChurnFactor)",
    robust: "Stable or mean-reverting provider base; resilience to macro shocks.",
    fragile: "Sharp attrition leading to network security or availability collapse.",
    failureMode: "Network Death Spiral: Declining rewards trigger mass operator exit."
  },
  "Burn vs Emissions": {
    subtitle: "Evaluation of tokenomic sustainability and equilibrium.",
    question: "Is the protocol achieving a self-sustaining circulation equilibrium through real-world utility?",
    formula: "Sustainability = Burn_Rate - Mint_Rate",
    robust: "Burn rate periodically matches or exceeds emissions during growth.",
    fragile: "Chronic decoupling where emissions dwarf burn regardless of utility.",
    failureMode: "Structural Over-Subsidization: Network relies on infinite inflation to survive."
  },
  "Network Utilization (%)": {
    subtitle: "Measurement of capital efficiency and infrastructure load.",
    question: "What is the efficiency ratio of the hardware deployed within the network?",
    formula: "(Demand_Served / Total_Capacity) * 100",
    robust: "Stable utilization (40-80%); maintained operational headroom.",
    fragile: "Values below 10% (irrelevance) or 100% saturation (bottleneck).",
    failureMode: "Infrastructure Irrelevance: Physical assets are deployed but not utilized."
  },
  "Supply Trajectory": {
    subtitle: "Monitoring of issuance constraints and token mass predictability.",
    question: "Does the token issuance remain bounded and predictable over the horizon?",
    formula: "Supply_{t+1} = Supply_t + Minted_t - Burned_t",
    robust: "Controlled expansion or demand-responsive contraction.",
    fragile: "Exponential issuance growth leading to irreversible dilution.",
    failureMode: "Hyper-inflation: Token mass expansion outpaces value capture."
  },
  "Service Pricing Proxy": {
    subtitle: "Proxy for end-user cost stability and market competitiveness.",
    question: "Does the unit cost of service remain affordable and stable for end-users?",
    formula: "Price_{s,t+1} = Price_{s,t} * (1 + 0.6 * Scarcity)",
    robust: "Mean-reverting pricing; predictable cost basis for service buyers.",
    fragile: "Runaway cost spikes or hyper-volatility decoupling from market norms.",
    failureMode: "Pricing Collapse/Spike: The network becomes too expensive to use."
  },
  "Liquidity Shock Impact": {
    subtitle: "Impact of massive token unlock on price stability.",
    question: "Can the market absorb a supply shock without triggering a death spiral?",
    formula: "Price_{t} = k / (PoolTokens + UnlockAmount)",
    robust: "Price recovers within 4-8 weeks; Churn remains manageable.",
    fragile: "Price crashes > 60% and fails to recover; triggers mass exodus.",
    failureMode: "Liquidity Death Spiral: Price crash -> Miner Churn -> Service Fail -> Price Crash."
  }
};

const REGIME_KNOWLEDGE = {
  'LOW-INCENTIVE DOMINANT': {
    title: 'Low-Incentive Dominant',
    color: 'rose',
    icon: TrendingDown,
    definition: 'A state where reward velocity falls below the operational floor (OpEx) required for hardware maintenance and operator participation.',
    symptoms: [
      { metric: 'Provider Count', signal: 'Chronic attrition/downward step-trend' },
      { metric: 'Retention Ratio', signal: 'Drop below 75% threshold' },
      { metric: 'Profit Delta', signal: 'Mean value consistently below churn threshold' }
    ],
    risks: 'Irreversible capacity collapse, loss of geographic coverage, and system-level security failure.',
    mitigations: 'Emission schedule adjustment, operational cost subsidies, or burn-rate reallocation.'
  },
  'EQUILIBRIUM WINDOW': {
    title: 'Equilibrium Window',
    color: 'emerald',
    icon: Target,
    definition: 'The target mechanistic state where emission velocity is calibrated to real-world utility capture, sustaining stable participation.',
    symptoms: [
      { metric: 'Capacity vs Demand', signal: 'Tight coupling with positive headroom' },
      { metric: 'Burn vs Emissions', signal: 'Narrowing sustainability gap (1:1 target)' },
      { metric: 'Utilization', signal: 'Stability within the 40-70% bandwidth' }
    ],
    risks: 'Complacency bias, vulnerability to sudden macro shocks, and low resistance to black swan events.',
    mitigations: 'Dynamic parameter calibration, governance monitoring, and liquidity provisioning.'
  },
  'HIGH-INCENTIVE DOMINANT': {
    title: 'High-Incentive Dominant',
    color: 'amber',
    icon: TrendingUp,
    definition: 'A state of over-subsidization where reward velocity significantly exceeds utility, or infrastructure load reaches saturation ceilings.',
    symptoms: [
      { metric: 'Utilization', signal: 'Flat-top ceilings exceeding 90%' },
      { metric: 'Burn vs Emissions', signal: 'Chronic decoupling (Emissions >> Burn)' },
      { metric: 'Pricing Proxy', signal: 'Hyper-volatility or run-away pricing spikes' }
    ],
    risks: 'Speculative capital dominance, hardware congestion, and hyper-inflationary supply expansion.',
    mitigations: 'Burn-fraction scaling, saturation-based emission decays, or fee rebalancing.'
  }
};

// Protocols moved to src/data/protocols.ts

const MetricCard: React.FC<{
  title: string;
  value: string;
  subValue?: string;
  subColor?: string;
  icon?: any;
  tooltip?: string;
  formula?: string; // New prop for math formula
  source?: string;
  className?: string;
}> = ({ title, value, subValue, subColor, icon: Icon, tooltip, formula, source, className }) => (
  <div className={`bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm group relative flex flex-col justify-between h-full ${className || ''}`}>
    <div>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">{title}</div>
          {formula && (
            <div className="px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/30 rounded text-[8px] font-mono text-indigo-400 opacity-50 group-hover:opacity-100 transition-opacity cursor-help" title="Formula Available">
              ƒx
            </div>
          )}
        </div>
        {Icon && <Icon size={14} className="text-slate-700" />}
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
        {subValue && <div className={`text-[10px] font-bold ${subColor || 'text-rose-400'}`}>{subValue}</div>}
      </div>
    </div>
    {source && (
      <div className="mt-3 pt-2 border-t border-slate-800/50">
        <span className="text-[8px] text-slate-600 font-mono tracking-tight flex items-center gap-1">
          SRC: <span className="text-slate-500">{source}</span>
        </span>
      </div>
    )}

    {/* Combined Tooltip for Description & Formula */}
    {(tooltip || formula) && (
      <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[110] text-[10px] leading-relaxed font-medium">
        {tooltip && <div className="text-slate-400 mb-2">{tooltip}</div>}
        {formula && (
          <div className="bg-slate-900 p-2 rounded border border-slate-800 mt-1">
            <span className="text-[8px] text-indigo-400 font-bold uppercase block mb-1">Mathematical Model</span>
            <code className="text-indigo-200 font-mono text-[9px]">{formula}</code>
          </div>
        )}
      </div>
    )}
  </div>
);

const BaseChartBox: React.FC<{
  title: string;
  icon: any;
  color: string;
  onExpand?: () => void;
  isDriver?: boolean;
  driverColor?: string;
  tooltip?: string;
  source?: string;
  className?: string;
  heightClass?: string;
  children: React.ReactNode
}> = ({ title, icon: Icon, color, onExpand, isDriver, driverColor = 'indigo', source, heightClass = "h-[380px]", children }) => {
  const interp = CHART_INTERPRETATIONS[title];
  const [showInterp, setShowInterp] = useState(false);

  return (
    <div className={`bg-slate-900 border ${isDriver ? `border-${driverColor}-500/50 shadow-[0_0_20px_rgba(0,0,0,0.5),0_0_10px_rgba(var(--${driverColor}-rgb),0.2)]` : 'border-slate-800'} rounded-xl p-5 flex flex-col ${heightClass} shadow-sm relative overflow-hidden group transition-all duration-500`}>
      {isDriver && (
        <div className={`absolute top-0 right-0 px-3 py-1 bg-${driverColor}-500 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-lg shadow-lg z-20 animate-pulse flex items-center gap-1.5`}>
          <Waves size={10} />
          Primary Signal
        </div>
      )}

      <div className="flex flex-col mb-4 z-10">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg bg-slate-950/50 text-${color}-400`}>
              <Icon size={16} />
            </div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-tight">{title}</h3>
          </div>
          <div className="flex items-center gap-1.5">
            {interp && (
              <button
                onClick={() => setShowInterp(!showInterp)}
                className={`p-1 rounded-full transition-colors ${showInterp ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-600 hover:text-slate-400'}`}
                title="Academic Interpretation"
              >
                <HelpCircle size={14} />
              </button>
            )}
            {onExpand && (
              <button
                onClick={onExpand}
                className="p-1 rounded-full text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                title="Expand Focused View"
              >
                <Maximize2 size={14} />
              </button>
            )}
          </div>
        </div>
        <p className="text-[9px] text-slate-500 font-medium italic pl-8">{interp?.subtitle}</p>
      </div>

      <div className="flex-1 w-full min-h-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          {children as any}
        </ResponsiveContainer>
        {source && (
          <div className="absolute bottom-0 right-0 pointer-events-none">
            <span className="text-[8px] text-slate-600 font-mono bg-slate-900/80 px-1 py-0.5 rounded backdrop-blur">
              SRC: {source}
            </span>
          </div>
        )}
      </div>

      {showInterp && interp && (
        <div className="absolute inset-0 bg-slate-950 border-t border-slate-800 p-6 z-20 animate-in fade-in slide-in-from-bottom-2 duration-200 flex flex-col justify-start">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest bg-indigo-400/10 px-2 py-0.5 rounded">Research Context</span>
            <button onClick={() => setShowInterp(false)} className="text-slate-600 hover:text-white bg-slate-800/50 p-1 rounded-full transition-colors"><X size={12} /></button>
          </div>
          <div className="space-y-5 overflow-y-auto custom-scrollbar pr-2">
            <div>
              <p className="text-[11px] text-slate-100 font-bold leading-relaxed mb-1">{interp.question}</p>
              <div className="bg-slate-900 p-2 rounded-lg mb-3 border border-slate-800 flex items-center gap-2">
                <Binary size={10} className="text-indigo-400" />
                <code className="text-[9px] text-slate-400 font-mono">{interp.formula}</code>
              </div>
              <div className="flex items-center gap-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                <ShieldAlert size={12} className="text-rose-500 shrink-0" />
                <span className="text-[9px] font-bold uppercase text-rose-400">System Risk: {interp.failureMode}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-5 pt-3 border-t border-slate-800">
              <div>
                <span className="text-[9px] font-bold text-emerald-500 uppercase block mb-1.5">Robust Signal</span>
                <p className="text-[10px] text-slate-400 leading-normal">{interp.robust}</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-rose-500 uppercase block mb-1.5">Fragile Signal</span>
                <p className="text-[10px] text-slate-400 leading-normal">{interp.fragile}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function getDemandSeries(T: number, base: number, type: DemandType, rng: SeededRNG): number[] {
  const series: number[] = [];
  for (let t = 0; t < T; t++) {
    let d = 0;
    if (type === 'consistent') d = base * (1 + 0.03 * rng.normal());
    else if (type === 'high-to-decay') d = base * (1.6 * Math.exp(-t / 10) + 0.6) * (1 + 0.05 * rng.normal());
    else if (type === 'growth') d = base * (0.8 + 0.02 * t) * (1 + 0.05 * rng.normal());
    else if (type === 'volatile') d = base * (1 + 0.20 * rng.normal());
    series.push(Math.max(0, d));
  }
  return series;
}

function simulateOne(params: SimulationParams, simSeed: number): SimResult[] {
  const rng = new SeededRNG(simSeed);
  const { T, initialSupply, initialPrice, maxMintWeekly, burnPct, demandType, macro,
    providerCostPerWeek, baseCapacityPerProvider, kDemandPrice, kMintPrice, rewardLagWeeks, churnThreshold,
    initialLiquidity, investorUnlockWeek, investorSellPct
  } = params;

  let mu = 0.002, sigma = 0.05;
  if (macro === 'bearish') { mu = -0.01; sigma = 0.06; }
  else if (macro === 'bullish') { mu = 0.015; sigma = 0.06; }

  const demands = getDemandSeries(T, 12000, demandType, rng);
  const results: SimResult[] = [];

  let currentSupply = initialSupply;
  let currentPrice = initialPrice;
  let currentProviders = 30;
  let currentServicePrice = 0.5;

  let poolUsd = initialLiquidity;
  let poolTokens = poolUsd / currentPrice;
  const kAmm = poolUsd * poolTokens;

  let consecutiveLowProfitWeeks = 0;
  const rewardHistory: number[] = new Array(Math.max(1, rewardLagWeeks)).fill(params.providerCostPerWeek * 1.5);

  for (let t = 0; t < T; t++) {
    const demand = demands[t];
    const capacity = Math.max(0.001, currentProviders * baseCapacityPerProvider);
    const demand_served = Math.min(demand, capacity);
    const utilization = (demand_served / capacity) * 100;

    const scarcity = (demand - capacity) / capacity;
    currentServicePrice = Math.min(Math.max(currentServicePrice * (1 + 0.6 * scarcity), 0.05), 5.0);

    const safePrice = Math.max(currentPrice, 0.0001);
    const tokensSpent = (demand_served * currentServicePrice) / safePrice;

    const burnedRaw = burnPct * tokensSpent;
    const burned = Math.min(currentSupply * 0.95, burnedRaw);

    // Emissions sigmoid growth + saturation dampening
    const saturation = Math.min(1.0, currentProviders / 5000.0);
    const emissionFactor = 0.6 + 0.4 * Math.tanh(demand / 15000.0) - (0.2 * saturation);
    const minted = Math.max(0, Math.min(maxMintWeekly, maxMintWeekly * emissionFactor));
    currentSupply = Math.max(1000.0, currentSupply + minted - burned);

    const instantRewardValue = (minted / Math.max(currentProviders, 0.1)) * safePrice;
    rewardHistory.push(instantRewardValue);
    if (rewardHistory.length > Math.max(1, rewardLagWeeks)) rewardHistory.shift();

    const delayedReward = rewardHistory[0];
    const profit = delayedReward - providerCostPerWeek;
    const incentive = profit / providerCostPerWeek;

    if (profit < churnThreshold) {
      consecutiveLowProfitWeeks++;
    } else {
      consecutiveLowProfitWeeks = Math.max(0, consecutiveLowProfitWeeks - 1);
    }

    let churnMultiplier = 1.0;
    if (consecutiveLowProfitWeeks > 2) churnMultiplier = 1.8;
    if (consecutiveLowProfitWeeks > 5) churnMultiplier = 4.0;

    // Dampen provider growth (Max 15% growth per week to simulate hardware leads)
    const maxGrowth = currentProviders * 0.15;
    const rawDelta = (incentive * 4.5 * churnMultiplier) + rng.normal() * 0.5;
    let delta = Math.max(-currentProviders * 0.1, Math.min(maxGrowth, rawDelta));

    let netFlow = 0;
    let nextPrice = currentPrice;

    if (t === investorUnlockWeek) {
      // SHOCK EVENT
      const unlockAmount = currentSupply * investorSellPct;
      const newPoolTokens = poolTokens + unlockAmount;
      const newPoolUsd = kAmm / newPoolTokens;

      poolTokens = newPoolTokens;
      poolUsd = newPoolUsd;
      nextPrice = poolUsd / poolTokens;
      netFlow = -unlockAmount;

      // Massive panic churn (Dynamic V1 Approximation)
      // Instead of hardcoded 30%, scale by price drop magnitude * sensitivity (1.5x)
      const priceDropPct = Math.max(0, 1 - (nextPrice / currentPrice));
      const panicChurn = currentProviders * priceDropPct * 1.5;
      delta -= panicChurn;
    } else {
      const demandPressure = kDemandPrice * Math.tanh(scarcity);
      const dilutionPressure = -kMintPrice * (minted / currentSupply) * 100;
      const logRet = mu + demandPressure + dilutionPressure + sigma * rng.normal();
      nextPrice = Math.max(0.01, currentPrice * Math.exp(logRet));

      // Re-sync AMM pool depth to price
      poolUsd = Math.sqrt(kAmm * nextPrice);
      poolTokens = Math.sqrt(kAmm / nextPrice);
    }

    const dailyMintUsd = (minted / 7) * currentPrice;
    const dailyBurnUsd = (burned / 7) * currentPrice;
    const netDailyLoss = dailyBurnUsd - dailyMintUsd;
    const solvencyScore = dailyMintUsd > 0 ? dailyBurnUsd / dailyMintUsd : 10; // Default to healthy if no minting

    results.push({
      t, price: currentPrice, supply: currentSupply, demand, demand_served,
      providers: currentProviders, capacity, servicePrice: currentServicePrice,
      minted, burned, utilization, profit, scarcity, incentive,
      solvencyScore, netDailyLoss, dailyMintUsd, dailyBurnUsd,
      netFlow, churnCount: delta < 0 ? Math.abs(delta) : 0, joinCount: delta > 0 ? delta : 0
    } as any);

    currentPrice = nextPrice;
    currentProviders = Math.max(2, currentProviders + delta);
  }
  return results;
}

const FormulaDisplay: React.FC<{ label: string; formula: string }> = ({ label, formula }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 shadow-inner group transition-colors hover:border-indigo-500/50">
      <code className="text-[11px] text-slate-300 font-mono block overflow-x-auto whitespace-nowrap custom-scrollbar pb-1">{formula}</code>
    </div>
  </div>
);

/**
 * Parameter label with tooltip
 */
const ParamLabel: React.FC<{
  label: string;
  paramKey?: keyof NewSimulationParams;
  locked?: boolean;
  children?: React.ReactNode;
}> = ({ label, paramKey, locked, children }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipText = paramKey ? getParamTooltip(paramKey) : '';

  return (
    <div className="relative">
      <label className="flex items-center gap-2 text-[9px] font-bold text-slate-600 uppercase mb-4 tracking-widest">
        {label}
        {locked && <Lock size={10} className="text-slate-500" />}
        {paramKey && tooltipText && (
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="p-0.5 text-slate-600 hover:text-indigo-400 transition-colors"
          >
            <HelpCircle size={10} />
          </button>
        )}
        {children}
      </label>
      {showTooltip && tooltipText && (
        <div className="absolute left-0 top-6 z-50 w-64 p-3 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl text-[10px] text-slate-300 leading-relaxed whitespace-pre-wrap animate-in fade-in zoom-in-95 duration-150">
          {tooltipText}
        </div>
      )}
    </div>
  );
};

// Collapsible Section Component
interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  summary: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  isAdvanced?: boolean;
  showAdvanced?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  iconColor,
  summary,
  isOpen,
  onToggle,
  children,
  isAdvanced = false,
  showAdvanced = true,
}) => {
  if (isAdvanced && !showAdvanced) return null;

  return (
    <section className={`transition-all duration-300 ${isAdvanced ? 'opacity-80' : ''}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between mb-4 group cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className={iconColor}>{icon}</span>
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 group-hover:text-slate-400 transition-colors">
            {title}
          </h2>
          {isAdvanced && (
            <span className="text-[8px] px-1.5 py-0.5 bg-slate-800 text-slate-500 rounded uppercase">Adv</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!isOpen && (
            <span className="text-[9px] font-mono text-slate-600 truncate max-w-[120px]">{summary}</span>
          )}
          <ChevronDown
            size={12}
            className={`text-slate-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="space-y-6 pb-2">
          {children}
        </div>
      </div>
    </section>
  );
};

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('sandbox');
  const [selectedProtocolIds, setSelectedProtocolIds] = useState<string[]>([PROTOCOL_PROFILES[0].metadata.id]);
  const [activeProfile, setActiveProfile] = useState<ProtocolProfileV1>(PROTOCOL_PROFILES[0]);

  // Sidebar UI state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    stress: false,
    tokenomics: true,
    providers: true,
    simulation: true,
    scenarios: false,
  });

  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  // Comparison view state
  const [normalizeCharts, setNormalizeCharts] = useState(false);
  const [hiddenProtocols, setHiddenProtocols] = useState<Set<string>>(new Set());

  const toggleProtocolVisibility = (protocolId: string) => {
    setHiddenProtocols(prev => {
      const next = new Set(prev);
      if (next.has(protocolId)) {
        next.delete(protocolId);
      } else {
        next.add(protocolId);
      }
      return next;
    });
  };

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const [params, setParams] = useState<SimulationParams>({
    T: 52,
    initialSupply: PROTOCOL_PROFILES[0].parameters.supply.value,
    initialPrice: 3.0,
    maxMintWeekly: PROTOCOL_PROFILES[0].parameters.emissions.value,
    burnPct: PROTOCOL_PROFILES[0].parameters.burn_fraction.value,
    demandType: PROTOCOL_PROFILES[0].parameters.demand_regime.value,
    macro: 'bearish',
    nSims: 100,
    seed: 42,
    providerCostPerWeek: PROTOCOL_PROFILES[0].parameters.provider_economics.opex_weekly.value,
    baseCapacityPerProvider: 180.0,
    kDemandPrice: 0.15,
    kMintPrice: 0.35,
    rewardLagWeeks: PROTOCOL_PROFILES[0].parameters.adjustment_lag.value,
    churnThreshold: PROTOCOL_PROFILES[0].parameters.provider_economics.churn_threshold.value,
    initialLiquidity: 50000,
    investorUnlockWeek: 26,
    investorSellPct: 0.15,
  });

  const [aggregated, setAggregated] = useState<AggregateResult[]>([]);
  const [multiAggregated, setMultiAggregated] = useState<Record<string, AggregateResult[]>>({});
  const [loading, setLoading] = useState(false);
  const [playbackWeek, setPlaybackWeek] = useState(0);
  const [focusChart, setFocusChart] = useState<string | null>(null);
  const [showKnowledgeLayer, setShowKnowledgeLayer] = useState(false);
  const [showAuditPanel, setShowAuditPanel] = useState(false);
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [derivedMetrics, setDerivedMetrics] = useState<DerivedMetrics | null>(null);
  const [useNewModel, setUseNewModel] = useState(true); // Toggle for new vs old model

  // Live data state
  const [liveData, setLiveData] = useState<Record<string, TokenMarketData | null>>({});
  const [liveDataLoading, setLiveDataLoading] = useState(false);
  const [liveDataError, setLiveDataError] = useState<string | null>(null);
  const [lastLiveDataFetch, setLastLiveDataFetch] = useState<Date | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [timeUntilRefresh, setTimeUntilRefresh] = useState<string>('');
  const [allDePINData, setAllDePINData] = useState<Record<string, TokenMarketData>>({});
  const [showMethodology, setShowMethodology] = useState(false);
  const [showDePINBrowser, setShowDePINBrowser] = useState(false);
  const [onChainMetrics, setOnChainMetrics] = useState<Record<string, OnChainMetrics>>({});

  // Load from localStorage on mount
  useEffect(() => {
    const cached = loadFromLocalStorage();
    if (cached.data && cached.timestamp) {
      // Map cached data to protocol IDs
      const mappedData: Record<string, TokenMarketData | null> = {};
      for (const profile of PROTOCOL_PROFILES) {
        const coingeckoId = profile.metadata.coingeckoId;
        if (coingeckoId && cached.data[coingeckoId]) {
          mappedData[profile.metadata.id] = cached.data[coingeckoId];
        }
      }
      setLiveData(mappedData);
      setAllDePINData(cached.data);
      setLastLiveDataFetch(cached.timestamp);
    }

    // Load mock on-chain metrics
    setOnChainMetrics({
      'ono_v3_calibrated': getMockOnChainMetrics('onocoy'),
      'helium_bme_v1': getMockOnChainMetrics('helium'),
      'adaptive_elastic_v1': getMockOnChainMetrics('render'),
    });
  }, []);

  // Auto-refresh timer display
  useEffect(() => {
    if (!autoRefreshEnabled || !lastLiveDataFetch) return;

    const interval = setInterval(() => {
      setTimeUntilRefresh(getTimeUntilNextRefresh(lastLiveDataFetch));
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, lastLiveDataFetch]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefreshEnabled) {
      autoRefreshManager.start(fetchLiveData, 5 * 60 * 1000); // 5 minutes
    } else {
      autoRefreshManager.stop();
    }

    return () => autoRefreshManager.stop();
  }, [autoRefreshEnabled]);

  // Fetch live data from CoinGecko
  const fetchLiveData = async () => {
    setLiveDataLoading(true);
    setLiveDataError(null);

    try {
      // Fetch all DePIN tokens
      const data = await fetchMultipleTokens(ALL_DEPIN_TOKEN_IDS);
      setAllDePINData(data);

      // Map to protocol IDs
      const mappedData: Record<string, TokenMarketData | null> = {};
      for (const profile of PROTOCOL_PROFILES) {
        const coingeckoId = profile.metadata.coingeckoId;
        if (coingeckoId && data[coingeckoId]) {
          mappedData[profile.metadata.id] = data[coingeckoId];
        }
      }

      setLiveData(mappedData);
      setLastLiveDataFetch(new Date());
    } catch (error) {
      setLiveDataError('Failed to fetch live data. Rate limit may have been exceeded.');
      console.error('Live data fetch error:', error);
    } finally {
      setLiveDataLoading(false);
    }
  };

  const runSimulation = () => {
    setLoading(true);
    setPlaybackWeek(0);

    setTimeout(() => {
      const allResults: Record<string, AggregateResult[]> = {};

      const protocolsToSimulate = viewMode === 'comparison'
        ? PROTOCOL_PROFILES.filter(p => selectedProtocolIds.includes(p.metadata.id))
        : [activeProfile];

      protocolsToSimulate.forEach(profile => {
        // Build params compatible with new model
        // In sandbox mode, user controls override profile presets
        const isSandbox = viewMode === 'sandbox';

        const localParams: NewSimulationParams = {
          scenario: params.scenario,
          T: params.T,
          initialSupply: profile.parameters.supply.value,
          initialPrice: params.initialPrice,
          initialLiquidity: params.initialLiquidity,
          investorUnlockWeek: params.investorUnlockWeek,
          investorSellPct: params.investorSellPct,
          maxMintWeekly: profile.parameters.emissions.value,
          burnPct: isSandbox ? params.burnPct : profile.parameters.burn_fraction.value,
          demandType: isSandbox ? params.demandType : profile.parameters.demand_regime.value,
          baseDemand: 12000,
          demandVolatility: 0.05,
          macro: params.macro,
          initialProviders: 30,
          baseCapacityPerProvider: params.baseCapacityPerProvider,
          capacityStdDev: 0.2,
          providerCostPerWeek: isSandbox ? params.providerCostPerWeek : profile.parameters.provider_economics.opex_weekly.value,
          costStdDev: 0.15,
          hardwareLeadTime: 2,
          churnThreshold: isSandbox ? params.churnThreshold : profile.parameters.provider_economics.churn_threshold.value,
          profitThresholdToJoin: 15,
          maxProviderGrowthRate: 0.15,
          maxProviderChurnRate: 0.10,
          kBuyPressure: 0.08,
          kSellPressure: 0.12,
          kDemandPrice: params.kDemandPrice,
          kMintPrice: params.kMintPrice,
          baseServicePrice: 0.5,
          servicePriceElasticity: 0.6,
          minServicePrice: 0.05,
          maxServicePrice: 5.0,
          rewardLagWeeks: profile.parameters.adjustment_lag.value,
          nSims: params.nSims,
          seed: params.seed
        };

        let aggregate: AggregateResult[];

        if (useNewModel) {
          // Use new model with individual providers and sell pressure
          const newResults = runNewSimulation(localParams);
          // Map new results to old format for compatibility
          aggregate = newResults.map(r => ({
            t: r.t,
            price: r.price,
            supply: r.supply,
            demand: r.demand,
            demand_served: r.demandServed,
            providers: r.providers,
            capacity: r.capacity,
            servicePrice: r.servicePrice,
            minted: r.minted,
            burned: r.burned,
            utilization: r.utilisation,
            profit: r.profit,
            scarcity: r.scarcity,
            incentive: r.incentive,
            buyPressure: r.buyPressure,
            sellPressure: r.sellPressure,
            netFlow: r.netFlow,
            churnCount: r.churnCount,
            joinCount: r.joinCount,
            solvencyScore: r.solvencyScore,
            netDailyLoss: r.netDailyLoss,
            dailyMintUsd: r.dailyMintUsd,
            dailyBurnUsd: r.dailyBurnUsd,
            urbanCount: r.urbanCount,
            ruralCount: r.ruralCount,
            weightedCoverage: r.weightedCoverage
          })) as unknown as AggregateResult[];

          // Calculate derived metrics for active profile
          if (profile.metadata.id === activeProfile.metadata.id) {
            const metrics = calculateDerivedMetrics(newResults, localParams);
            setDerivedMetrics(metrics);
          }
        } else {
          // Use old model for comparison
          const allSims: SimResult[][] = [];
          for (let i = 0; i < params.nSims; i++) {
            allSims.push(simulateOne(localParams as unknown as SimulationParams, params.seed + i));
          }

          aggregate = [];
          const keys: (keyof SimResult)[] = ['price', 'supply', 'demand', 'demand_served', 'providers', 'capacity', 'servicePrice', 'minted', 'burned', 'utilization', 'profit', 'scarcity', 'incentive', 'solvencyScore', 'netDailyLoss', 'dailyMintUsd', 'dailyBurnUsd'];

          for (let tStep = 0; tStep < params.T; tStep++) {
            const step: any = { t: tStep };
            keys.forEach(key => {
              const values = allSims.map(sim => sim[tStep]?.[key] as number).filter(v => v !== undefined).sort((a, b) => a - b);
              if (values.length === 0) return;
              const mean = values.reduce((a, b) => a + b, 0) / values.length;
              const p10 = values[Math.floor(values.length * 0.1)] || 0;
              const p90 = values[Math.floor(values.length * 0.9)] || 0;
              step[key] = { mean, p10, p90 };
            });
            aggregate.push(step as AggregateResult);
          }
        }

        allResults[profile.metadata.id] = aggregate;
      });

      setMultiAggregated(allResults);
      if (allResults[activeProfile.metadata.id]) {
        setAggregated(allResults[activeProfile.metadata.id]);
      }
      setLoading(false);
      setPlaybackWeek(params.T);
    }, 100);
  };

  const loadProfile = (profile: ProtocolProfileV1) => {
    setActiveProfile(profile);
    if (!selectedProtocolIds.includes(profile.metadata.id)) {
      setSelectedProtocolIds([...selectedProtocolIds, profile.metadata.id]);
    }
    setParams({
      ...params,
      initialSupply: profile.parameters.supply.value,
      maxMintWeekly: profile.parameters.emissions.value,
      burnPct: profile.parameters.burn_fraction.value,
      rewardLagWeeks: profile.parameters.adjustment_lag.value,
      providerCostPerWeek: profile.parameters.provider_economics.opex_weekly.value,
      churnThreshold: profile.parameters.provider_economics.churn_threshold.value
    });
    setTimeout(runSimulation, 50);
  };

  const toggleProtocolSelection = (id: string) => {
    if (selectedProtocolIds.includes(id)) {
      if (selectedProtocolIds.length > 1) {
        setSelectedProtocolIds(selectedProtocolIds.filter(pid => pid !== id));
      }
    } else {
      setSelectedProtocolIds([...selectedProtocolIds, id]);
    }
  };

  useEffect(() => { runSimulation(); }, []);

  const displayedData = useMemo(() => aggregated.slice(0, playbackWeek), [aggregated, playbackWeek]);

  const protocolHealth = useMemo(() => {
    if (!aggregated.length) return { status: 'ROBUST', score: 100, dominance: 'Initial State' };
    const last = aggregated[aggregated.length - 1];
    if (!last || !last.utilization) return { status: 'ROBUST', score: 100, dominance: 'Initial State' };

    let score = 100;
    let impacts = [];

    if (last.utilization.mean < 15) { score -= 25; impacts.push('Low Utilization (-25)'); }
    if (last.utilization.mean > 95) { score -= 15; impacts.push('Congestion Stress (-15)'); }

    const supplyDiff = Math.abs(last.supply.mean - params.initialSupply) / params.initialSupply;
    if (supplyDiff > 0.5) { score -= 20; impacts.push('High Dilution (-20)'); }

    if (last.providers.mean < 10) { score -= 50; impacts.push('Critical Churn (-50)'); }

    score = Math.max(0, score);
    let status = score < 40 ? 'FRAGILE' : score < 70 ? 'STRESSED' : 'ROBUST';

    return {
      status,
      score,
      dominance: impacts.length > 0 ? impacts.join(', ') : 'No Critical Stressors'
    };
  }, [aggregated, params.initialSupply]);

  const calculateRegime = (data: AggregateResult[], profile: ProtocolProfileV1) => {
    if (!data.length) return { id: 'INITIALIZING', regime: 'INITIALIZING', color: 'slate', drivers: [], summary: 'N/A' };
    const last = data[data.length - 1];
    if (!last || !last.providers) return { id: 'INITIALIZING', regime: 'INITIALIZING', color: 'slate', drivers: [], summary: 'N/A' };

    const retention = (last.providers?.mean || 30) / 30;
    const burnRatio = (last.burned?.mean || 0) / Math.max(last.minted?.mean || 0, 0.0001);
    const utilization = last.utilization?.mean || 0;
    const profit = last.profit?.mean || 0;
    const churnThreshold = profile.parameters.provider_economics.churn_threshold.value;

    if (retention < 0.75 || profit < churnThreshold) {
      return {
        id: 'LOW-INCENTIVE DOMINANT',
        regime: 'LOW-INCENTIVE DOMINANT',
        color: 'rose',
        drivers: ['Provider Count'],
        summary: 'Operational attrition outpaces incentive velocity.'
      };
    }

    if ((burnRatio < 0.1 && utilization < 25) || utilization > 90) {
      const isSaturation = utilization > 90;
      return {
        id: 'HIGH-INCENTIVE DOMINANT',
        regime: 'HIGH-INCENTIVE DOMINANT',
        color: 'amber',
        drivers: isSaturation ? ['Network Utilization (%)', 'Service Pricing Proxy'] : ['Burn vs Emissions', 'Network Utilization (%)'],
        summary: isSaturation ? 'Infrastructure saturation limits scalability.' : 'Speculative issuance outstripping utility.'
      };
    }

    return {
      id: 'EQUILIBRIUM WINDOW',
      regime: 'EQUILIBRIUM WINDOW',
      color: 'emerald',
      drivers: ['Capacity vs Demand'],
      summary: 'Sustainable balance of utility capture and issuance.'
    };
  };

  const incentiveRegime = useMemo(() => calculateRegime(aggregated, activeProfile), [aggregated, activeProfile]);

  const counterfactualData = useMemo(() => {
    if (!aggregated.length) return [];
    return aggregated.map(d => ({
      t: d.t,
      capacityRef: (d.demand_served?.mean || 0) * 1.2,
      providersRef: 30,
      burnRef: d.minted?.mean || 0,
      utilizationRef: 60,
      pricingRef: params.initialPrice
    }));
  }, [aggregated, params.initialPrice]);

  const formatCompact = (n: number) => n.toLocaleString(undefined, { notation: 'compact', maximumFractionDigits: 1 });

  const renderFocusChart = () => {
    if (!focusChart) return null;
    const interp = CHART_INTERPRETATIONS[focusChart];
    const isDriver = incentiveRegime.drivers.includes(focusChart);
    const focusedCounterfactual = counterfactualData.slice(0, playbackWeek);

    const renderMainChart = () => {
      switch (focusChart) {
        case "Capacity vs Demand":
          return (
            <ComposedChart data={displayedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="t" fontSize={11} />
              <YAxis fontSize={11} tickFormatter={formatCompact} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
              <Area type="monotone" dataKey={(d: any) => d?.capacity?.mean} stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.15} name="Capacity" />
              {isDriver && <Line data={focusedCounterfactual} type="monotone" dataKey="capacityRef" stroke="#475569" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Equilibrium Reference" opacity={0.4} />}
              <Line type="monotone" dataKey={(d: any) => d?.demand_served?.mean} stroke="#fbbf24" strokeWidth={3} dot={false} name="Demand Served" />
              <Legend verticalAlign="top" height={36} iconType="circle" />
            </ComposedChart>
          );
        case "Provider Count":
          return (
            <LineChart data={displayedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="t" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
              <Line type="step" dataKey={(d: any) => d?.providers?.mean} stroke="#10b981" strokeWidth={3} dot={false} name="Providers" />
              {isDriver && <Line data={focusedCounterfactual} type="step" dataKey="providersRef" stroke="#475569" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Equilibrium Reference" opacity={0.4} />}
              <ReferenceLine y={10} stroke="#f43f5e" strokeDasharray="3 3" label={{ position: 'right', value: 'Threshold', fill: '#f43f5e', fontSize: 10 }} />
              <Legend verticalAlign="top" height={36} iconType="circle" />
            </LineChart>
          );
        case "Burn vs Emissions":
          return (
            <ComposedChart data={displayedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="t" fontSize={11} />
              <YAxis fontSize={11} tickFormatter={formatCompact} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
              <Line type="monotone" dataKey={(d: any) => d?.burned?.mean} stroke="#fbbf24" strokeWidth={3} dot={false} name="Tokens Burned" />
              {isDriver && <Line data={focusedCounterfactual} type="monotone" dataKey="burnRef" stroke="#475569" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Equilibrium Reference" opacity={0.4} />}
              <Line type="monotone" dataKey={(d: any) => d?.minted?.mean} stroke="#6366f1" strokeWidth={2} strokeDasharray="8 4" dot={false} name="Tokens Minted" />
              <Legend verticalAlign="top" height={36} iconType="circle" />
            </ComposedChart>
          );
        case "Network Utilization (%)":
          return (
            <AreaChart data={displayedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="t" fontSize={11} />
              <YAxis domain={[0, 100]} fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
              <Area type="monotone" dataKey={(d: any) => d?.utilization?.mean} stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.2} name="Utilization %" />
              {isDriver && <Line data={focusedCounterfactual} type="monotone" dataKey="utilizationRef" stroke="#475569" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Equilibrium Reference" opacity={0.4} />}
              <Legend verticalAlign="top" height={36} iconType="circle" />
            </AreaChart>
          );
        case "Supply Trajectory":
          return (
            <LineChart data={displayedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="t" fontSize={11} />
              <YAxis fontSize={11} tickFormatter={formatCompact} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
              <Line type="monotone" dataKey={(d: any) => d?.supply?.mean} stroke="#8b5cf6" strokeWidth={3} dot={false} name="Circ. Supply" />
              <Legend verticalAlign="top" height={36} iconType="circle" />
            </LineChart>
          );
        case "Service Pricing Proxy":
          return (
            <LineChart data={displayedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="t" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
              <Line type="monotone" dataKey={(d: any) => d?.servicePrice?.mean} stroke="#3b82f6" strokeWidth={3} dot={false} name="CHF / Unit" />
              <Legend verticalAlign="top" height={36} iconType="circle" />
            </LineChart>
          );
        default:
          return null;
      }
    };

    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-950/98 backdrop-blur-xl animate-in zoom-in-95 duration-200">
        <div className="bg-slate-900 border border-slate-700 w-full max-w-6xl rounded-3xl shadow-2xl flex flex-col h-[85vh] overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl"><Maximize2 size={20} /></div>
              <div>
                <h3 className="text-lg font-extrabold text-white uppercase tracking-tight">{focusChart}</h3>
                <p className="text-xs text-slate-500 font-medium italic">{interp.subtitle}</p>
              </div>
            </div>
            <button onClick={() => setFocusChart(null)} className="p-2 text-slate-500 hover:text-white bg-slate-800 rounded-full transition-colors"><X size={18} /></button>
          </div>

          <div className="flex-1 p-8 flex flex-col lg:flex-row gap-10 overflow-hidden">
            <div className="flex-[3] bg-slate-950/50 rounded-2xl p-6 border border-slate-800 relative">
              {isDriver && (
                <div className="absolute top-10 left-10 z-20 flex items-center gap-3 px-4 py-2 bg-slate-950/90 border border-slate-800 rounded-xl shadow-2xl">
                  <GitCompare size={14} className="text-slate-500" />
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Counterfactual Comparison</span>
                    <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Theoretical Equilibrium Baseline</span>
                  </div>
                </div>
              )}
              <ResponsiveContainer width="100%" height="100%">
                {renderMainChart() as any}
              </ResponsiveContainer>
            </div>

            <div className="flex-1 space-y-6 flex flex-col justify-start overflow-y-auto custom-scrollbar pr-2">
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
                <section>
                  <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-2">Academic Thesis</h4>
                  <p className="text-sm text-slate-100 font-medium leading-relaxed">"{interp.question}"</p>
                </section>

                <section>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">Governing Formula</h4>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center gap-2">
                    <Binary size={12} className="text-indigo-400" />
                    <code className="text-[10px] text-slate-400 font-mono">{interp.formula}</code>
                  </div>
                </section>

                <section className="pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-2 p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 mb-4">
                    <ShieldAlert size={16} className="text-rose-400 shrink-0" />
                    <div>
                      <span className="text-[9px] font-black text-rose-500 uppercase block">System Failure Mode</span>
                      <p className="text-[10px] font-bold text-rose-400 leading-tight">{interp.failureMode}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black text-emerald-500 uppercase flex items-center gap-1.5"><CheckSquare size={10} /> Robust Signal</span>
                      <p className="text-[10px] text-slate-400 leading-normal">{interp.robust}</p>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black text-rose-500 uppercase flex items-center gap-1.5"><AlertCircle size={10} /> Fragile Signal</span>
                      <p className="text-[10px] text-slate-400 leading-normal">{interp.fragile}</p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-950/50 border-t border-slate-800 flex justify-center">
            <button onClick={() => setFocusChart(null)} className="px-12 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition-all uppercase tracking-[0.2em] active:scale-95 shadow-xl shadow-indigo-600/20">Return to Sandbox</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 overflow-hidden">
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/80 backdrop-blur-xl shrink-0 z-[100]">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-2xl shadow-indigo-600/40 border border-indigo-400/20">
              <Scale className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-md font-extrabold tracking-tight">DePIN Stress Test</h1>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">CAS Thesis Architecture</p>
            </div>
          </div>

          <nav className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('explorer')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'explorer' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Search size={14} /> Explorer
            </button>
            <button
              onClick={() => {
                setViewMode('comparison');
                // Auto-select all protocols when entering comparison mode
                setSelectedProtocolIds(PROTOCOL_PROFILES.map(p => p.metadata.id));
              }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'comparison' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <GitCompare size={14} /> Comparison
            </button>
            <button
              onClick={() => setViewMode('sandbox')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'sandbox' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <LayoutGrid size={14} /> Sandbox
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMethodologyOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/20 transition-all text-[10px] font-bold uppercase tracking-widest"
          >
            <BookOpen size={14} /> Methodology
          </button>
          <button
            onClick={() => setViewMode('settings')}
            className={`flex items-center gap-2 text-[10px] font-bold transition-all px-4 py-2.5 rounded-xl border active:scale-95 ${viewMode === 'settings' ? 'bg-indigo-600 text-white border-indigo-400' : 'text-slate-400 border-slate-800 hover:bg-slate-900 hover:text-white'}`}
          >
            <Settings2 size={14} />
            <span>Settings</span>
          </button>
          <button
            onClick={() => setShowExportPanel(!showExportPanel)}
            className={`flex items-center gap-2 text-[10px] font-bold transition-all px-4 py-2.5 rounded-xl border active:scale-95 ${showExportPanel ? 'bg-emerald-600 text-white border-emerald-400' : 'text-slate-400 border-slate-800 hover:bg-slate-900 hover:text-emerald-400 hover:border-emerald-500/50'}`}
          >
            <Download size={14} />
            <span>Export</span>
          </button>
          <button
            onClick={() => setShowSpecModal(true)}
            className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-indigo-400 transition-all px-4 py-2.5 rounded-xl border border-slate-800 hover:border-indigo-500/50 bg-slate-950/50"
          >
            <Binary size={14} />
            <span>Math Spec</span>
          </button>
          <button
            onClick={() => setShowAuditPanel(!showAuditPanel)}
            className={`flex items-center gap-2 text-[10px] font-bold transition-all px-4 py-2.5 rounded-xl border active:scale-95 ${showAuditPanel ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'text-slate-400 border-slate-800 hover:bg-slate-900'}`}
          >
            <Calculator size={14} />
            <span>Audit</span>
          </button>
          <button
            onClick={() => setShowMethodology(true)}
            className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-indigo-400 transition-all px-4 py-2.5 rounded-xl border border-slate-800 hover:border-indigo-500/50 bg-slate-950/50"
          >
            <BookOpen size={14} />
            <span>Methodology</span>
          </button>
          <div className="h-6 w-px bg-slate-800" />
          <button
            onClick={() => setUseNewModel(!useNewModel)}
            className={`flex items-center gap-2 text-[9px] font-bold transition-all px-3 py-2 rounded-lg border ${useNewModel ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30' : 'text-slate-500 border-slate-800'}`}
            title={useNewModel ? 'Using V2 Model (with sell pressure)' : 'Using V1 Model (legacy)'}
          >
            {useNewModel ? 'V2' : 'V1'}
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={fetchLiveData}
              disabled={liveDataLoading}
              className={`flex items-center gap-2 text-xs font-bold transition-all px-4 py-2.5 rounded-l-xl border-y border-l ${Object.keys(liveData).length > 0
                ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/30'
                : 'text-amber-400 border-amber-500/30 bg-amber-600/10 hover:bg-amber-600/20'
                }`}
              title={lastLiveDataFetch ? `Last updated: ${lastLiveDataFetch.toLocaleTimeString()}` : 'Fetch live token data from CoinGecko'}
            >
              {liveDataLoading ? <RefreshCw className="animate-spin" size={14} /> : <Activity size={14} />}
              {liveDataLoading ? 'Fetching...' : Object.keys(liveData).length > 0 ? 'Live ✓' : 'Fetch Live'}
            </button>
            <button
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className={`flex items-center gap-1.5 text-[9px] font-bold transition-all px-2.5 py-2.5 rounded-r-xl border ${autoRefreshEnabled
                ? 'bg-emerald-600/30 text-emerald-400 border-emerald-500/30'
                : 'text-slate-500 border-slate-700 bg-slate-800/50 hover:bg-slate-800'
                }`}
              title={autoRefreshEnabled ? `Auto-refresh ON - Next: ${timeUntilRefresh}` : 'Enable auto-refresh (every 5 min)'}
            >
              <RefreshCw size={12} className={autoRefreshEnabled ? 'animate-spin-slow' : ''} />
              {autoRefreshEnabled ? timeUntilRefresh || '5m' : 'Auto'}
            </button>
          </div>
          <button
            onClick={() => setShowDePINBrowser(!showDePINBrowser)}
            className={`flex items-center gap-2 text-xs font-bold transition-all px-3 py-2.5 rounded-xl border ${showDePINBrowser
              ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30'
              : 'text-slate-500 border-slate-700 hover:text-slate-300'
              }`}
            title="Browse all DePIN tokens"
          >
            <Layers size={14} />
            DePIN
          </button>
          <button onClick={runSimulation} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 active:scale-95">
            {loading ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} fill="currentColor" />}
            Run Matrix
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {viewMode === 'settings' ? (
          <Settings onBack={() => setViewMode('sandbox')} />
        ) : viewMode === 'explorer' ? (
          <ExplorerTab
            profiles={PROTOCOL_PROFILES}
            onAnalyze={(id) => {
              // Switch to sandbox and load the profile
              const profile = PROTOCOL_PROFILES.find(p => p.metadata.id === id);
              if (profile) {
                loadProfile(profile);
                setViewMode('sandbox');
              }
            }}
            onCompare={(id) => {
              // Switch to comparison and ensure protocol is selected
              if (!selectedProtocolIds.includes(id)) {
                setSelectedProtocolIds(prev => [...prev, id]);
              }
              setViewMode('comparison');
            }}
          />
        ) : (
          <>
            <aside className="w-[340px] border-r border-slate-800 overflow-y-auto bg-slate-950 flex flex-col custom-scrollbar shrink-0">
              <div className="p-6 border-b border-slate-800/50">
                <div className="flex items-center gap-2 mb-6">
                  <Fingerprint size={14} className="text-emerald-500" />
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    {viewMode === 'sandbox' ? 'Active Archetype' : 'Select Protocols'}
                  </h2>
                </div>
                <div className="flex flex-col gap-2">
                  {PROTOCOL_PROFILES.map(p => {
                    const isSelected = selectedProtocolIds.includes(p.metadata.id);
                    const isActive = activeProfile.metadata.id === p.metadata.id;

                    return (
                      <button
                        key={p.metadata.id}
                        onClick={() => viewMode === 'sandbox' ? loadProfile(p) : toggleProtocolSelection(p.metadata.id)}
                        className={`p-4 rounded-xl text-left transition-all border group active:scale-[0.98] ${(viewMode === 'sandbox' && isActive) || (viewMode === 'comparison' && isSelected)
                          ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.1)]'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                          }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-[11px] font-extrabold uppercase tracking-tight ${(viewMode === 'sandbox' && isActive) || (viewMode === 'comparison' && isSelected) ? 'text-indigo-400' : 'text-slate-300'
                            }`}>{p.metadata.name}</span>
                          <div className="flex items-center gap-1">
                            {p.metadata.model_type === 'location_based' ?
                              <Fingerprint size={10} className="text-emerald-500" title="Category A: Location-Based (Physical Density)" /> :
                              <Database size={10} className="text-amber-500" title="Category B: Fungible Resource (Compute/Storage)" />
                            }
                            {((viewMode === 'sandbox' && isActive) || (viewMode === 'comparison' && isSelected)) && <CheckCircle2 size={12} className="text-indigo-400" />}
                          </div>
                        </div>
                        <div className="text-[9px] text-slate-500 font-medium leading-tight">{p.metadata.mechanism}</div>
                      </button>
                    );
                  })}
                </div>
              </div>


              <div className="p-6 flex flex-col gap-6">
                <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-800">

                  <div className="flex items-center gap-2">
                    <Sliders size={12} className="text-slate-500" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Mode</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-950 rounded-lg p-0.5">
                    <button
                      onClick={() => setShowAdvanced(false)}
                      className={`px-3 py-1.5 rounded-md text-[9px] font-bold uppercase transition-all ${!showAdvanced ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-400'
                        }`}
                    >
                      Simple
                    </button>
                    <button
                      onClick={() => setShowAdvanced(true)}
                      className={`px-3 py-1.5 rounded-md text-[9px] font-bold uppercase transition-all ${showAdvanced ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-400'
                        }`}
                    >
                      Advanced
                    </button>
                  </div>
                </div>


                <CollapsibleSection
                  title="Academic Scenarios"
                  icon={<BookOpen size={14} />}
                  iconColor="text-pink-500"
                  summary="Miner Revolt • Honey Bursts"
                  isOpen={!collapsedSections.scenarios}
                  onToggle={() => toggleSection('scenarios')}
                >
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => {
                        setParams({
                          ...params,
                          scenario: 'winter',
                          churnThreshold: 20,
                          macro: 'bearish',
                          providerCostPerWeek: params.providerCostPerWeek * 1.5,
                          costStdDev: 0.4,
                        });
                      }}
                      className={`p-3 rounded-xl border text-left transition-all group ${params.scenario === 'winter' ? 'bg-indigo-600/20 border-indigo-500 shadow-earthquake' : 'bg-indigo-500/10 border-indigo-500/30 hover:bg-indigo-500/20'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-bold uppercase ${params.scenario === 'winter' ? 'text-white' : 'text-indigo-400'}`}>Crypto Winter</span>
                        <TrendingDown size={12} className={params.scenario === 'winter' ? 'text-white' : 'text-indigo-400'} />
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Section 9.1: Testing resilience against a 2022-style market crash (-90% prices).
                      </p>
                    </button>

                    <button
                      onClick={() => {
                        setParams({
                          ...params,
                          scenario: 'saturation',
                          demandType: 'consistent',
                          maxMintWeekly: params.maxMintWeekly * 0.5,
                          macro: 'neutral',
                        });
                      }}
                      className={`p-3 rounded-xl border text-left transition-all group ${params.scenario === 'saturation' ? 'bg-amber-600/20 border-amber-500 shadow-earthquake' : 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-bold uppercase ${params.scenario === 'saturation' ? 'text-white' : 'text-amber-400'}`}>Hardware Saturation</span>
                        <Target size={12} className={params.scenario === 'saturation' ? 'text-white' : 'text-amber-400'} />
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Section 9.2: Simulating network density exceeding utility demand (3x Node Spike).
                      </p>
                    </button>

                    <button
                      onClick={() => {
                        setParams({
                          ...params,
                          scenario: 'utility',
                          demandType: 'growth',
                          macro: 'bullish',
                          kBuyPressure: 0.15,
                        });
                      }}
                      className={`p-3 rounded-xl border text-left transition-all group ${params.scenario === 'utility' ? 'bg-emerald-600/20 border-emerald-500 shadow-earthquake' : 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-bold uppercase ${params.scenario === 'utility' ? 'text-white' : 'text-emerald-400'}`}>Utility Validation</span>
                        <Activity size={12} className={params.scenario === 'utility' ? 'text-white' : 'text-emerald-400'} />
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Section 9.3: "Peace-time" growth where organic demand drives token burn (10% MoM).
                      </p>
                    </button>
                  </div>
                </CollapsibleSection>


                <CollapsibleSection
                  title="Stress Controls"
                  icon={<Settings2 size={14} />}
                  iconColor="text-slate-500"
                  summary={`${params.T}wk • ${params.demandType} • ${params.macro}`}
                  isOpen={!collapsedSections.stress}
                  onToggle={() => toggleSection('stress')}
                >
                  <div>
                    <ParamLabel label="Time Horizon" paramKey="T" locked={viewMode === 'comparison'} />
                    <input type="range" min="12" max="104" value={params.T} onChange={e => setParams({ ...params, T: parseInt(e.target.value) })} className="w-full accent-indigo-600 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer mb-2" />
                    <div className="flex justify-between text-[10px] font-mono text-slate-400"><span>Duration</span><span className="text-indigo-400 font-bold">{params.T} weeks</span></div>
                  </div>

                  <div className="space-y-3">
                    <ParamLabel label="Exogenous Load (Demand)" paramKey="demandType" locked={viewMode === 'comparison'} />
                    <div className="grid grid-cols-2 gap-2">
                      {['consistent', 'growth', 'volatile', 'high-to-decay'].map(d => (
                        <button key={d} onClick={() => setParams({ ...params, demandType: d as any })} className={`py-2 rounded-lg text-[9px] font-bold uppercase transition-all border active:scale-95 ${params.demandType === d ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>{d}</button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <ParamLabel label="Macro Condition" paramKey="macro" />
                    <div className="grid grid-cols-3 gap-2">
                      {(['bearish', 'sideways', 'bullish'] as const).map(m => (
                        <button key={m} onClick={() => setParams({ ...params, macro: m })} className={`py-2 rounded-lg text-[9px] font-bold uppercase transition-all border active:scale-95 ${params.macro === m ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>{m}</button>
                      ))}
                    </div>
                  </div>
                </CollapsibleSection>


                <CollapsibleSection
                  title="Tokenomics"
                  icon={<Database size={14} />}
                  iconColor="text-violet-500"
                  summary={`$${params.initialPrice} • ${(params.burnPct * 100).toFixed(0)}% burn`}
                  isOpen={!collapsedSections.tokenomics}
                  onToggle={() => toggleSection('tokenomics')}
                  isAdvanced={true}
                  showAdvanced={showAdvanced}
                >
                  <div>
                    <ParamLabel label="Initial Token Price" paramKey="initialPrice" />
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        step="0.1"
                        min="0.01"
                        max="100"
                        value={params.initialPrice}
                        onChange={e => setParams({ ...params, initialPrice: parseFloat(e.target.value) || 0.01 })}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-indigo-500 outline-none"
                      />
                      <span className="text-[10px] text-slate-500 font-bold">USD</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <ParamLabel label="Burn Percentage" paramKey="burnPct" />
                      <span className="text-indigo-400 text-[10px] font-mono font-bold">{(params.burnPct * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={params.burnPct}
                      onChange={e => setParams({ ...params, burnPct: parseFloat(e.target.value) })}
                      className="w-full accent-indigo-600 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-600 mt-1">
                      <span>0% (Inflationary)</span>
                      <span>100% (Deflationary)</span>
                    </div>
                  </div>
                </CollapsibleSection>


                <CollapsibleSection
                  title="Provider Economics"
                  icon={<Users size={14} />}
                  iconColor="text-emerald-500"
                  summary={`$${params.providerCostPerWeek}/wk OpEx • $${params.churnThreshold} churn`}
                  isOpen={!collapsedSections.providers}
                  onToggle={() => toggleSection('providers')}
                  isAdvanced={true}
                  showAdvanced={showAdvanced}
                >
                  <div>
                    <div className="flex justify-between mb-2">
                      <ParamLabel label="Weekly OpEx Cost" paramKey="providerCostPerWeek" />
                      <span className="text-emerald-400 text-[10px] font-mono font-bold">${params.providerCostPerWeek.toFixed(0)}</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="200"
                      step="5"
                      value={params.providerCostPerWeek}
                      onChange={e => setParams({ ...params, providerCostPerWeek: parseFloat(e.target.value) })}
                      className="w-full accent-emerald-600 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <ParamLabel label="Churn Threshold" paramKey="churnThreshold" />
                      <span className="text-amber-400 text-[10px] font-mono font-bold">${params.churnThreshold.toFixed(0)}/wk</span>
                    </div>
                    <input
                      type="range"
                      min="-20"
                      max="50"
                      step="5"
                      value={params.churnThreshold}
                      onChange={e => setParams({ ...params, churnThreshold: parseFloat(e.target.value) })}
                      className="w-full accent-amber-600 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-600 mt-1">
                      <span>Tolerant</span>
                      <span>Sensitive</span>
                    </div>
                  </div>
                </CollapsibleSection>


                <CollapsibleSection
                  title="Simulation"
                  icon={<BarChart3 size={14} />}
                  iconColor="text-blue-500"
                  summary={`${params.nSims} runs • seed ${params.seed}`}
                  isOpen={!collapsedSections.simulation}
                  onToggle={() => toggleSection('simulation')}
                >
                  <div>
                    <div className="flex justify-between mb-2">
                      <ParamLabel label="Monte Carlo Runs" paramKey="nSims" />
                      <span className="text-blue-400 text-[10px] font-mono font-bold">{params.nSims}</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="500"
                      step="20"
                      value={params.nSims}
                      onChange={e => setParams({ ...params, nSims: parseInt(e.target.value) })}
                      className="w-full accent-blue-600 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-600 mt-1">
                      <span>Faster</span>
                      <span>More Accurate</span>
                    </div>
                  </div>

                  <div>
                    <ParamLabel label="Random Seed" paramKey="seed" />
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="999999"
                        value={params.seed}
                        onChange={e => setParams({ ...params, seed: parseInt(e.target.value) || 42 })}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-indigo-500 outline-none"
                      />
                      <button
                        onClick={() => setParams({ ...params, seed: Math.floor(Math.random() * 999999) })}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-[9px] font-bold text-slate-400 transition-colors"
                        title="Randomise seed"
                      >
                        🎲
                      </button>
                    </div>
                  </div>
                </CollapsibleSection>

                {
                  viewMode === 'sandbox' && (
                    <section className={`bg-slate-900/80 border border-${incentiveRegime.color}-500/30 rounded-2xl p-5 space-y-4 transition-all duration-500`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <ShieldQuestion size={14} className={`text-${incentiveRegime.color}-400`} />
                          <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Incentive Regime</h3>
                        </div>
                        <Target size={12} className={`text-${incentiveRegime.color}-400 animate-pulse`} />
                      </div>
                      <div className="space-y-3">
                        <div className={`px-2 py-1.5 rounded-lg bg-${incentiveRegime.color}-500/10 border border-${incentiveRegime.color}-500/20 shadow-inner`}>
                          <span className={`text-[10px] font-extrabold uppercase tracking-widest text-${incentiveRegime.color}-400`}>{incentiveRegime.regime}</span>
                        </div>
                        <button onClick={() => setShowKnowledgeLayer(true)} className="w-full py-2 bg-slate-800/50 hover:bg-slate-800 rounded-xl text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
                          <Library size={12} /> Knowledge Layer
                        </button>
                      </div>
                    </section>
                  )
                }
              </div >
            </aside >

            <main className="flex-1 overflow-y-auto bg-slate-950 p-6 custom-scrollbar relative">
              <div className="max-w-[1600px] mx-auto">
                {viewMode === 'sandbox' ? (
                  <div className="space-y-20 pb-32">
                    {/* Hero Section */}
                    <section className="relative py-20 px-4 md:px-0">
                      <div className="max-w-4xl mx-auto text-center space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
                          <CheckCircle2 size={12} />
                          <span>Thesis Validation Framework 1.2</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase">
                          {activeProfile.metadata.name}
                          <span className="block text-slate-500 text-lg md:text-2xl font-bold tracking-widest mt-4">Stress Test Environment</span>
                        </h1>
                        <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
                          This dashboard subjects the protocol to the three canonical stress-tests defined in <strong>Chapter 9</strong> of the Thesis.
                          Scroll to explore the narrative impact of solvency, capitulation, and liquidity shocks.
                        </p>
                      </div>
                    </section>

                    {/* Module 1: Solvency */}
                    <SectionLayout
                      id="module-1"
                      title="The Solvency Test"
                      subtitle="Module 01 // Equilibrium"
                      description={
                        <div className="space-y-6">
                          <p>
                            <strong>The Burn-and-Mint Equilibrium (BME)</strong> model relies on a simple premise: for the token price to remain stable, the value of tokens burned (demand) must at least equal the value of tokens minted (supply).
                          </p>
                          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-indigo-300">
                            P_ono = (D_fiat) / (V * S_circ)
                          </div>
                          <p>
                            When <code>Ratio &lt; 1.0</code>, the protocol is subsidizing operations through inflation (Shareholder Dilution).
                          </p>
                        </div>
                      }
                    >
                      <div className="space-y-6">
                        {/* Solvency Score Header */}
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-black text-white uppercase tracking-widest">Solvency Metrics</h3>
                          <div className={`px-3 py-1 rounded-lg border flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${(aggregated[aggregated.length - 1]?.solvencyScore?.mean || 0) > 1.0 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                            {(aggregated[aggregated.length - 1]?.solvencyScore?.mean || 0) > 1.0 ? 'Deflationary' : 'Inflationary'}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <MetricCard
                            title="Solvency Score"
                            value={aggregated[aggregated.length - 1]?.solvencyScore?.mean > 0 ? formatCompact(aggregated[aggregated.length - 1]?.solvencyScore?.mean) : '-'}
                            subValue={(aggregated[aggregated.length - 1]?.solvencyScore?.mean || 0) < 1.0 ? 'Dilutive' : 'Solvent'}
                            subColor={(aggregated[aggregated.length - 1]?.solvencyScore?.mean || 0) < 1.0 ? 'text-amber-400' : 'text-emerald-400'}
                            icon={Activity}
                            tooltip="Ratio of Value Burned to Value Minted. >1.0 indicates deflationary sustainability."
                            formula="(Burned_USD / 7) / (Minted_USD / 7)"
                          />
                          <MetricCard
                            title="Net Daily Loss"
                            value={aggregated[aggregated.length - 1]?.netDailyLoss?.mean ? formatCompact(Math.abs(aggregated[aggregated.length - 1]?.netDailyLoss?.mean)) : '-'}
                            subValue="USD"
                            subColor="text-slate-500"
                            icon={DollarSign}
                            tooltip="Daily USD difference between Burn and Emissions. Negative values indicate subsidy."
                            formula="DailyBurn_USD - DailyMint_USD"
                          />
                        </div>

                        <BaseChartBox title="Net Daily Loss ($)" icon={TrendingDown} color="rose" source="Daily Burn ($) - Daily Mint ($)" heightClass="h-[300px]">
                          <ComposedChart data={displayedData} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="t" fontSize={9} />
                            <YAxis fontSize={9} tickFormatter={formatCompact} />
                            <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />
                            <Bar dataKey={(d: any) => d?.netDailyLoss?.mean} barSize={4}>
                              {displayedData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={(entry?.netDailyLoss?.mean || 0) >= 0 ? '#10b981' : '#f43f5e'} />
                              ))}
                            </Bar>
                            <Line type="monotone" dataKey={(d: any) => d?.netDailyLoss?.mean} stroke="#cbd5e1" strokeWidth={1} dot={false} opacity={0.5} />
                          </ComposedChart>
                        </BaseChartBox>
                      </div>
                    </SectionLayout>

                    {/* Module 2: Capitulation */}
                    <SectionLayout
                      id="module-2"
                      title="The Capitulation Test"
                      subtitle="Module 02 // Resilience"
                      description={
                        <div className="space-y-6">
                          <p>
                            <strong>The Miner's Dilemma.</strong> As token price crashes, miners with higher OPEX (Urban/Professional) become unprofitable first. They unplug, leading to a loss of redundancy.
                          </p>
                          <p>
                            This module tests the network's "Kill Switch" threshold—the price point where mass exodus occurs.
                          </p>
                        </div>
                      }
                    >
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800/50">
                            <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Urban Miners (Fragile)</div>
                            <div className="text-lg font-mono text-rose-400">{(aggregated[aggregated.length - 1]?.urbanCount?.mean || 0).toFixed(0)}</div>
                            <div className="h-1 mt-2 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-rose-500" style={{ width: `${((aggregated[aggregated.length - 1]?.urbanCount?.mean || 0) / (aggregated[aggregated.length - 1]?.providers?.mean || 1)) * 100}%` }}></div>
                            </div>
                          </div>
                          <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800/50">
                            <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Rural Miners (Resilient)</div>
                            <div className="text-lg font-mono text-emerald-400">{(aggregated[aggregated.length - 1]?.ruralCount?.mean || 0).toFixed(0)}</div>
                            <div className="h-1 mt-2 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500" style={{ width: `${((aggregated[aggregated.length - 1]?.ruralCount?.mean || 0) / (aggregated[aggregated.length - 1]?.providers?.mean || 1)) * 100}%` }}></div>
                            </div>
                          </div>
                        </div>
                        <BaseChartBox title="Miner Capitulation (Urban vs Rural)" icon={ShieldAlert} color="amber" source="Simulated Miner Churn by Tier" heightClass="h-[300px]">
                          <AreaChart data={displayedData} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                            <defs>
                              <linearGradient id="urbanGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="ruralGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="t" fontSize={9} />
                            <YAxis fontSize={9} tickFormatter={formatCompact} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '12px' }}
                              itemStyle={{ fontSize: '12px' }}
                              labelStyle={{ color: '#94a3b8', marginBottom: '0.5rem' }}
                            />
                            <Area type="monotone" dataKey="ruralCount.mean" name="Rural (Resilient)" stackId="1" stroke="#10b981" fill="url(#ruralGradient)" strokeWidth={2} />
                            <Area type="monotone" dataKey="urbanCount.mean" name="Urban (Fragile)" stackId="1" stroke="#f43f5e" fill="url(#urbanGradient)" strokeWidth={2} />
                          </AreaChart>
                        </BaseChartBox>
                      </div>
                    </SectionLayout>

                    {/* Module 3: Liquidity Shock */}
                    <SectionLayout
                      id="module-3"
                      title="The Liquidity Shock"
                      subtitle="Module 03 // Depth"
                      description={
                        <div className="space-y-6">
                          <p>
                            A stress test of the market's ability to absorb sell pressure.
                            We simulate a <strong>Liquid Investor Vesting Event</strong> where a percentage of supply is sold into the pool.
                          </p>
                          <p>
                            If the price crash is severe enough, it triggers the "Death Spiral": Price Crash → Miner Churn → Network Utility Drop → Further Price Crash.
                          </p>
                        </div>
                      }
                    >
                      <div className="space-y-8">
                        {/* Controls */}
                        <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                          <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-3">
                              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                                <span>Liquidity Depth</span>
                                <span className="text-purple-400">${formatCompact(params.initialLiquidity)}</span>
                              </div>
                              <input
                                type="range" min="10000" max="1000000" step="10000"
                                value={params.initialLiquidity}
                                onChange={(e) => setParams({ ...params, initialLiquidity: parseFloat(e.target.value) })}
                                className="w-full accent-purple-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                                <span>Sell Pressure (Dump)</span>
                                <span className="text-rose-400">{(params.investorSellPct * 100).toFixed(0)}%</span>
                              </div>
                              <input
                                type="range" min="0.01" max="0.30" step="0.01"
                                value={params.investorSellPct}
                                onChange={(e) => setParams({ ...params, investorSellPct: parseFloat(e.target.value) })}
                                className="w-full accent-rose-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Warning Logic */}
                        {(() => {
                          const crashPct = (1 - (params.initialLiquidity / (params.initialLiquidity + (params.initialSupply * params.investorSellPct * params.initialPrice))));
                          if (crashPct > 0.4) {
                            return (
                              <div className="p-4 bg-rose-950/20 border border-rose-500/30 rounded-xl flex items-center gap-4 animate-pulse">
                                <AlertTriangle className="text-rose-500 shrink-0" size={20} />
                                <div>
                                  <h4 className="text-rose-400 text-xs font-black uppercase tracking-widest">Warning: Recursive Feedback Loop Active</h4>
                                  <p className="text-[10px] text-rose-300/70 mt-1">Price impact {'>'} 40% triggers stochastic miner capitulation.</p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        <BaseChartBox title="Liquidity Shock Impact" icon={TrendingDown} color="purple" source="Token Price ($) vs Time" heightClass="h-[300px]">
                          <AreaChart data={displayedData} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                            <defs>
                              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="t" fontSize={9} tickFormatter={(val) => val === params.investorUnlockWeek ? `⚡ W${val}` : val} />
                            <YAxis fontSize={9} tickFormatter={(val) => `$${val.toFixed(2)}`} />
                            <Tooltip />
                            <ReferenceLine x={params.investorUnlockWeek} stroke="#f43f5e" strokeDasharray="3 3" />
                            <Area type="monotone" dataKey="price.mean" name="Price" stroke="#a855f7" fill="url(#priceGradient)" strokeWidth={2} />
                          </AreaChart>
                        </BaseChartBox>
                      </div>
                    </SectionLayout>
                    {showAuditPanel && (
                      <div className="p-6 bg-slate-900 border border-indigo-500/30 rounded-3xl animate-in zoom-in-95 duration-200 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <Calculator className="text-indigo-400" size={18} />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-white">System Calibration Audit (T={params.T})</h4>
                          </div>
                          <button onClick={() => setShowAuditPanel(false)} className="text-slate-600 hover:text-white transition-colors"><X size={14} /></button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
                          <div className="space-y-1 group">
                            <span className="text-[8px] font-bold text-slate-500 uppercase flex items-center gap-1.5">Provider ROI (Incentive) <Info size={10} className="opacity-30" /></span>
                            <div className="text-sm font-mono text-emerald-400 bg-emerald-400/5 px-2 py-1 rounded border border-emerald-400/20">{((aggregated[aggregated.length - 1]?.incentive?.mean || 0) * 100).toFixed(1)}%</div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[8px] font-bold text-slate-500 uppercase">System Scarcity</span>
                            <div className="text-sm font-mono text-amber-400 bg-amber-400/5 px-2 py-1 rounded border border-amber-400/20">{((aggregated[aggregated.length - 1]?.scarcity?.mean || 0) * 100).toFixed(1)}%</div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[8px] font-bold text-slate-500 uppercase">Weekly Emission Ratio</span>
                            <div className="text-sm font-mono text-indigo-400 bg-indigo-400/5 px-2 py-1 rounded border border-indigo-400/20">{((aggregated[aggregated.length - 1]?.minted?.mean || 0) / (params.initialSupply) * 100).toFixed(4)}%</div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[8px] font-bold text-slate-500 uppercase">Realized OpEx</span>
                            <div className="text-sm font-mono text-slate-300 bg-slate-300/5 px-2 py-1 rounded border border-slate-300/20">CHF {params.providerCostPerWeek.toFixed(2)} / unit</div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                      <BaseChartBox title="Capacity vs Demand" icon={Activity} color="indigo" onExpand={() => setFocusChart("Capacity vs Demand")} isDriver={incentiveRegime.drivers.includes('Capacity vs Demand')} driverColor={incentiveRegime.color} source="Market/Protocol Model V1.2">
                        <ComposedChart data={displayedData} margin={{ left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis dataKey="t" fontSize={9} />
                          <YAxis fontSize={9} tickFormatter={formatCompact} />
                          <Area type="monotone" dataKey={(d: any) => d?.capacity?.mean} stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.1} />
                          {incentiveRegime.drivers.includes('Capacity vs Demand') && (
                            <Line data={counterfactualData.slice(0, playbackWeek)} type="monotone" dataKey="capacityRef" stroke="#475569" strokeWidth={1} strokeDasharray="5 5" dot={false} opacity={0.3} />
                          )}
                          <Line type="monotone" dataKey={(d: any) => d?.demand_served?.mean} stroke="#fbbf24" strokeWidth={2} dot={false} />
                        </ComposedChart>
                      </BaseChartBox>
                      <BaseChartBox title="Provider Count" icon={Users} color="emerald" onExpand={() => setFocusChart("Provider Count")} isDriver={incentiveRegime.drivers.includes('Provider Count')} driverColor={incentiveRegime.color} source="Agent-Based Sim (Stochastic)">
                        <LineChart data={displayedData} margin={{ left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis dataKey="t" fontSize={9} />
                          <YAxis fontSize={9} />
                          <Line type="step" dataKey={(d: any) => d?.providers?.mean} stroke="#10b981" strokeWidth={2.5} dot={false} />
                          {incentiveRegime.drivers.includes('Provider Count') && (
                            <Line data={counterfactualData.slice(0, playbackWeek)} type="step" dataKey="providersRef" stroke="#475569" strokeWidth={1} strokeDasharray="5 5" dot={false} opacity={0.3} />
                          )}
                          <ReferenceLine y={10} stroke="#f43f5e" strokeDasharray="3 3" />
                        </LineChart>
                      </BaseChartBox>
                      <BaseChartBox title="Burn vs Emissions" icon={Scale} color="amber" onExpand={() => setFocusChart("Burn vs Emissions")} isDriver={incentiveRegime.drivers.includes('Burn vs Emissions')} driverColor={incentiveRegime.color} source="Protocol Parameters/Sim">
                        <ComposedChart data={displayedData} margin={{ left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis dataKey="t" fontSize={9} />
                          <YAxis fontSize={9} tickFormatter={formatCompact} />
                          <Line type="monotone" dataKey={(d: any) => d?.burned?.mean} stroke="#fbbf24" strokeWidth={2} dot={false} />
                          {incentiveRegime.drivers.includes('Burn vs Emissions') && (
                            <Line data={counterfactualData.slice(0, playbackWeek)} type="monotone" dataKey="burnRef" stroke="#475569" strokeWidth={1} strokeDasharray="5 5" dot={false} opacity={0.3} />
                          )}
                          <Line type="monotone" dataKey={(d: any) => d?.minted?.mean} stroke="#6366f1" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                        </ComposedChart>
                      </BaseChartBox>
                      <BaseChartBox title="Network Utilization (%)" icon={BarChart3} color="rose" onExpand={() => setFocusChart("Network Utilization (%)")} isDriver={incentiveRegime.drivers.includes('Network Utilization (%)')} driverColor={incentiveRegime.color} source="Derived Metric">
                        <AreaChart data={displayedData} margin={{ left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis dataKey="t" fontSize={9} />
                          <YAxis domain={[0, 100]} fontSize={9} />
                          <Area type="monotone" dataKey={(d: any) => d?.utilization?.mean} stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.1} />
                          {incentiveRegime.drivers.includes('Network Utilization (%)') && (
                            <Line data={counterfactualData.slice(0, playbackWeek)} type="monotone" dataKey="utilizationRef" stroke="#475569" strokeWidth={1} strokeDasharray="5 5" dot={false} opacity={0.3} />
                          )}
                        </AreaChart>
                      </BaseChartBox>
                      <BaseChartBox title="Supply Trajectory" icon={Database} color="violet" onExpand={() => setFocusChart("Supply Trajectory")} isDriver={incentiveRegime.drivers.includes('Supply Trajectory')} driverColor={incentiveRegime.color} source="Protocol Parameters">
                        <LineChart data={displayedData} margin={{ left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis dataKey="t" fontSize={9} />
                          <YAxis fontSize={9} tickFormatter={formatCompact} />
                          <Line type="monotone" dataKey={(d: any) => d?.supply?.mean} stroke="#8b5cf6" strokeWidth={2} dot={false} />
                        </LineChart>
                      </BaseChartBox>
                      <BaseChartBox title="Service Pricing Proxy" icon={DollarSign} color="blue" onExpand={() => setFocusChart("Service Pricing Proxy")} isDriver={incentiveRegime.drivers.includes('Service Pricing Proxy')} driverColor={incentiveRegime.color} source="Market Model (GBM)">
                        <LineChart data={displayedData} margin={{ left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis dataKey="t" fontSize={9} />
                          <YAxis fontSize={9} />
                          <Line type="monotone" dataKey={(d: any) => d?.servicePrice?.mean} stroke="#3b82f6" strokeWidth={2} dot={false} />
                        </LineChart>
                      </BaseChartBox>
                    </div>
                  </div >
                ) : (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    <div className="flex items-center justify-between p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl"><Lock size={18} /></div>
                        <div>
                          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Comparative Control Method</h3>
                          <p className="text-[10px] text-slate-500 font-medium italic">Locked stress parameters for structural comparability across all archetypes.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-500 font-bold">{selectedProtocolIds.length} of {PROTOCOL_PROFILES.length} selected</span>
                        <button
                          onClick={() => setSelectedProtocolIds(PROTOCOL_PROFILES.map(p => p.metadata.id))}
                          className="px-3 py-1.5 bg-indigo-600/20 text-indigo-400 text-[10px] font-bold rounded-lg hover:bg-indigo-600/30 transition-colors"
                        >
                          Select All
                        </button>
                      </div>
                    </div>


                    {Object.keys(liveData).length > 0 && (
                      <div className="p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-2xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                              <Activity size={16} className="text-emerald-400" />
                            </div>
                            <div>
                              <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider">Live Market Data</h3>
                              <p className="text-[9px] text-emerald-400/70">
                                From CoinGecko • Updated {lastLiveDataFetch?.toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={fetchLiveData}
                            disabled={liveDataLoading}
                            className="text-[9px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                          >
                            <RefreshCw size={12} className={liveDataLoading ? 'animate-spin' : ''} /> Refresh
                          </button>
                        </div>
                      </div>
                    )}


                    {selectedProtocolIds.length > 0 && (() => {
                      // Calculate metrics for all selected protocols
                      const protocolMetrics = PROTOCOL_PROFILES.filter(p => selectedProtocolIds.includes(p.metadata.id)).map(p => {
                        const data = multiAggregated[p.metadata.id] || [];
                        const last = data[data.length - 1];
                        const first = data[0];
                        const live = liveData[p.metadata.id];

                        // Price & Token metrics
                        // Note: price comes from sim params or live data, not protocol profile
                        const livePrice = live?.currentPrice || 0;
                        const defaultPrice = livePrice > 0 ? livePrice : params.initialPrice;
                        const finalPrice = last?.price?.mean || defaultPrice;
                        const initialPrice = first?.price?.mean || defaultPrice;
                        const priceChange = initialPrice > 0 ? ((finalPrice - initialPrice) / initialPrice) * 100 : 0;

                        // Calculate max drawdown
                        let peak = initialPrice;
                        let maxDrawdown = 0;
                        data.forEach(d => {
                          const price = d?.price?.mean || 0;
                          if (price > peak) peak = price;
                          const dd = peak > 0 ? ((peak - price) / peak) * 100 : 0;
                          if (dd > maxDrawdown) maxDrawdown = dd;
                        });

                        // Supply & Inflation
                        const defaultSupply = p.parameters?.supply?.value || 100_000_000;
                        const finalSupply = last?.supply?.mean || defaultSupply;
                        const initialSupply = first?.supply?.mean || defaultSupply;
                        const supplyChange = initialSupply > 0 ? ((finalSupply - initialSupply) / initialSupply) * 100 : 0;
                        const annualisedInflation = data.length > 0 ? supplyChange * (52 / data.length) : 0;

                        // Net emissions
                        const totalMinted = data.reduce((sum, d) => sum + (d?.minted?.mean || 0), 0);
                        const totalBurned = data.reduce((sum, d) => sum + (d?.burned?.mean || 0), 0);
                        const netEmissions = totalMinted - totalBurned;

                        // Provider metrics
                        const finalProviders = last?.providers?.mean || 30;
                        const initialProviders = first?.providers?.mean || 30;
                        const providerGrowth = initialProviders > 0 ? ((finalProviders - initialProviders) / initialProviders) * 100 : 0;
                        const totalChurn = data.reduce((sum, d) => sum + (d?.churnCount?.mean || 0), 0);
                        const totalJoins = data.reduce((sum, d) => sum + (d?.joinCount?.mean || 0), 0);
                        const churnRate = totalJoins > 0 ? (totalChurn / totalJoins) * 100 : 0;

                        // Utilisation
                        const avgUtilisation = data.length > 0
                          ? data.reduce((sum, d) => sum + (d?.utilization?.mean || 0), 0) / data.length
                          : 0;

                        // Unit Economics
                        const weeklyOpEx = p.parameters?.provider_economics?.opex_weekly?.value || 26;
                        const avgWeeklyReward = data.length > 0 && finalProviders > 0
                          ? (totalMinted / data.length) / finalProviders
                          : 0;
                        const avgRewardValue = avgWeeklyReward * finalPrice;
                        const weeklyProfit = avgRewardValue - weeklyOpEx;
                        const monthlyEarnings = weeklyProfit * 4.33;
                        const hardwareCost = p.metadata.id === 'ono_v3_calibrated' ? 650 :
                          p.metadata.id === 'helium_bme_v1' ? 500 :
                            p.metadata.id === 'hivemapper_map_v1' ? 549 :
                              p.metadata.id === 'dimo_vehicle_v1' ? 350 : 1000;
                        const paybackWeeks = weeklyProfit > 0 ? hardwareCost / weeklyProfit : Infinity;
                        const breakEvenPrice = avgWeeklyReward > 0 ? weeklyOpEx / avgWeeklyReward : 0;

                        // Risk metrics
                        const regime = calculateRegime(data, p);
                        const deathSpiralRisk = maxDrawdown > 80 ? 'HIGH' : maxDrawdown > 50 ? 'MEDIUM' : 'LOW';

                        // Sustainability ratio (real revenue vs emissions)
                        const totalRevenue = data.reduce((sum, d) => {
                          const served = d?.demandServed?.mean || 0;
                          const svcPrice = d?.servicePrice?.mean || 0;
                          return sum + (served * svcPrice);
                        }, 0);
                        const emissionValue = totalMinted * finalPrice;
                        const sustainabilityRatio = emissionValue > 0 ? (totalRevenue / emissionValue) * 100 : 0;

                        return {
                          protocol: p,
                          live,
                          regime,
                          // Token Performance
                          finalPrice,
                          priceChange,
                          annualisedInflation,
                          maxDrawdown,
                          // Network Health
                          finalProviders,
                          providerGrowth,
                          avgUtilisation,
                          churnRate,
                          netEmissions,
                          // Unit Economics
                          hardwareCost,
                          monthlyEarnings,
                          paybackWeeks,
                          breakEvenPrice,
                          weeklyProfit,
                          // Risk
                          deathSpiralRisk,
                          sustainabilityRatio,
                          finalSupply,
                        };
                      });

                      const baseline = protocolMetrics[0];

                      // Metric row component
                      const MetricRow = ({
                        icon,
                        iconColor,
                        label,
                        getValue,
                        format,
                        goodDirection,
                        getDelta,
                        hint
                      }: {
                        icon: React.ReactNode;
                        iconColor: string;
                        label: string;
                        getValue: (m: typeof protocolMetrics[0]) => number;
                        format: (v: number) => string;
                        goodDirection: 'up' | 'down' | 'neutral';
                        getDelta?: (m: typeof protocolMetrics[0], baseline: typeof protocolMetrics[0]) => number | null;
                        hint?: string;
                      }) => (
                        <tr className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors group">
                          <td className="p-3 text-[10px] font-bold text-slate-400 bg-slate-950/30 sticky left-0 z-10">
                            <div className="flex items-center gap-2">
                              <span className={iconColor}>{icon}</span>
                              <span>{label}</span>
                              {hint && (
                                <span className="opacity-0 group-hover:opacity-100 text-[8px] text-slate-600 transition-opacity">
                                  {hint}
                                </span>
                              )}
                            </div>
                          </td>
                          {protocolMetrics.map((m, idx) => {
                            const value = getValue(m);
                            const delta = getDelta && idx > 0 ? getDelta(m, baseline) : null;
                            const isGood = goodDirection === 'up' ? value > 0 :
                              goodDirection === 'down' ? value < 0 : true;

                            return (
                              <td key={m.protocol.metadata.id} className="p-3 text-center">
                                <div className={`text-sm font-mono font-bold ${goodDirection === 'neutral' ? 'text-white' :
                                  isGood ? 'text-emerald-400' : 'text-rose-400'
                                  }`}>
                                  {format(value)}
                                </div>
                                {delta !== null && (
                                  <div className={`text-[9px] mt-0.5 font-bold ${goodDirection === 'up' ? (delta >= 0 ? 'text-emerald-400' : 'text-rose-400') :
                                    goodDirection === 'down' ? (delta <= 0 ? 'text-emerald-400' : 'text-rose-400') :
                                      'text-slate-500'
                                    }`}>
                                    {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );

                      // Section header component
                      const SectionHeader = ({ icon, iconColor, title, hint }: { icon: React.ReactNode; iconColor: string; title: string; hint: string }) => (
                        <tr className="bg-slate-950/80">
                          <td colSpan={protocolMetrics.length + 1} className="p-3">
                            <div className="flex items-center gap-2">
                              <span className={iconColor}>{icon}</span>
                              <span className="text-[10px] font-black text-white uppercase tracking-widest">{title}</span>
                              <span className="text-[9px] text-slate-500 ml-2">{hint}</span>
                            </div>
                          </td>
                        </tr>
                      );

                      return (
                        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
                          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <BarChart3 size={16} className="text-indigo-400" />
                              <h3 className="text-xs font-black text-white uppercase tracking-widest">DePIN Protocol Scorecard</h3>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2 text-[9px]">
                                <span className="text-emerald-400">● Good</span>
                                <span className="text-rose-400">● Caution</span>
                              </div>
                              <div className="text-[9px] text-slate-500">
                                Baseline: <span className="text-indigo-400 font-bold">{baseline?.protocol.metadata.name}</span>
                              </div>
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-slate-800/50">
                                  <th className="p-3 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider bg-slate-950/30 sticky left-0 z-10 min-w-[160px]">
                                    Metric
                                  </th>
                                  {protocolMetrics.map((m, idx) => (
                                    <th key={m.protocol.metadata.id} className="p-3 text-center text-[9px] font-bold uppercase tracking-wider min-w-[120px]">
                                      <div className="flex flex-col items-center gap-1">
                                        <span className={idx === 0 ? 'text-indigo-400' : 'text-slate-400'}>{m.protocol.metadata.name}</span>
                                        {m.live && (
                                          <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">LIVE</span>
                                        )}
                                      </div>
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>

                                <SectionHeader
                                  icon={<DollarSign size={12} />}
                                  iconColor="text-emerald-500"
                                  title="Unit Economics"
                                  hint="🔧 For hardware operators"
                                />
                                <MetricRow
                                  icon={<Box size={12} />}
                                  iconColor="text-emerald-500"
                                  label="Hardware Cost"
                                  getValue={m => m.hardwareCost}
                                  format={v => `$${v.toLocaleString()}`}
                                  goodDirection="down"
                                  getDelta={(m, b) => b.hardwareCost > 0 ? ((m.hardwareCost - b.hardwareCost) / b.hardwareCost) * 100 : null}
                                />
                                <MetricRow
                                  icon={<Wallet size={12} />}
                                  iconColor="text-emerald-500"
                                  label="Monthly Earnings"
                                  getValue={m => m.monthlyEarnings}
                                  format={v => v > 0 ? `$${v.toFixed(0)}/mo` : `-$${Math.abs(v).toFixed(0)}/mo`}
                                  goodDirection="up"
                                  getDelta={(m, b) => Math.abs(b.monthlyEarnings) > 0 ? ((m.monthlyEarnings - b.monthlyEarnings) / Math.abs(b.monthlyEarnings)) * 100 : null}
                                />
                                <MetricRow
                                  icon={<Clock size={12} />}
                                  iconColor="text-emerald-500"
                                  label="Payback Period"
                                  getValue={m => m.paybackWeeks}
                                  format={v => v === Infinity ? '∞' : v > 52 ? `${(v / 52).toFixed(1)}yr` : `${v.toFixed(0)}wk`}
                                  goodDirection="down"
                                  hint="Shorter = better"
                                />
                                <MetricRow
                                  icon={<Target size={12} />}
                                  iconColor="text-emerald-500"
                                  label="Break-even Price"
                                  getValue={m => m.breakEvenPrice}
                                  format={v => v < 0.001 ? `$${v.toFixed(6)}` : `$${v.toFixed(4)}`}
                                  goodDirection="down"
                                  hint="Token floor to cover costs"
                                />


                                <SectionHeader
                                  icon={<TrendingUp size={12} />}
                                  iconColor="text-blue-500"
                                  title="Token Performance"
                                  hint="💰 For investors"
                                />
                                <MetricRow
                                  icon={<DollarSign size={12} />}
                                  iconColor="text-blue-500"
                                  label="Final Price"
                                  getValue={m => m.finalPrice}
                                  format={v => v < 0.01 ? `$${v.toFixed(6)}` : `$${v.toFixed(4)}`}
                                  goodDirection="neutral"
                                  getDelta={(m, b) => b.finalPrice > 0 ? ((m.finalPrice - b.finalPrice) / b.finalPrice) * 100 : null}
                                />
                                <MetricRow
                                  icon={<Trending size={12} />}
                                  iconColor="text-blue-500"
                                  label="Price Change"
                                  getValue={m => m.priceChange}
                                  format={v => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`}
                                  goodDirection="up"
                                />
                                <MetricRow
                                  icon={<Layers size={12} />}
                                  iconColor="text-blue-500"
                                  label="Inflation Rate"
                                  getValue={m => m.annualisedInflation}
                                  format={v => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%/yr`}
                                  goodDirection="down"
                                  hint="Lower = less dilution"
                                />
                                <MetricRow
                                  icon={<TrendingDown size={12} />}
                                  iconColor="text-blue-500"
                                  label="Max Drawdown"
                                  getValue={m => m.maxDrawdown}
                                  format={v => `-${v.toFixed(1)}%`}
                                  goodDirection="down"
                                  hint="Peak-to-trough loss"
                                />


                                <SectionHeader
                                  icon={<Zap size={12} />}
                                  iconColor="text-amber-500"
                                  title="Network Health"
                                  hint="⚙️ For protocol designers"
                                />
                                <MetricRow
                                  icon={<Users size={12} />}
                                  iconColor="text-amber-500"
                                  label="Final Providers"
                                  getValue={m => m.finalProviders}
                                  format={v => formatCompact(v)}
                                  goodDirection="up"
                                  getDelta={(m, b) => b.finalProviders > 0 ? ((m.finalProviders - b.finalProviders) / b.finalProviders) * 100 : null}
                                />
                                <MetricRow
                                  icon={<Gauge size={12} />}
                                  iconColor="text-amber-500"
                                  label="Avg Utilisation"
                                  getValue={m => m.avgUtilisation}
                                  format={v => `${v.toFixed(1)}%`}
                                  goodDirection="up"
                                />
                                <MetricRow
                                  icon={<UserMinus size={12} />}
                                  iconColor="text-amber-500"
                                  label="Churn Rate"
                                  getValue={m => m.churnRate}
                                  format={v => `${v.toFixed(1)}%`}
                                  goodDirection="down"
                                  hint="Providers leaving"
                                />
                                <MetricRow
                                  icon={<Flame size={12} />}
                                  iconColor="text-amber-500"
                                  label="Net Emissions"
                                  getValue={m => m.netEmissions}
                                  format={v => `${v >= 0 ? '+' : ''}${formatCompact(v)}`}
                                  goodDirection="down"
                                  hint="Minted - Burned"
                                />


                                <SectionHeader
                                  icon={<AlertTriangle size={12} />}
                                  iconColor="text-rose-500"
                                  title="Risk Indicators"
                                  hint="🎓 For researchers & VCs"
                                />
                                <MetricRow
                                  icon={<ShieldQuestion size={12} />}
                                  iconColor="text-rose-500"
                                  label="Death Spiral Risk"
                                  getValue={m => m.deathSpiralRisk === 'HIGH' ? 100 : m.deathSpiralRisk === 'MEDIUM' ? 50 : 10}
                                  format={v => v >= 100 ? '⚠️ HIGH' : v >= 50 ? '⚡ MEDIUM' : '✓ LOW'}
                                  goodDirection="down"
                                />
                                <MetricRow
                                  icon={<BarChart3 size={12} />}
                                  iconColor="text-rose-500"
                                  label="Sustainability"
                                  getValue={m => m.sustainabilityRatio}
                                  format={v => `${v.toFixed(0)}%`}
                                  goodDirection="up"
                                  hint="Revenue vs emissions"
                                />


                                <tr className="bg-slate-950/50 hover:bg-slate-800/20 transition-colors">
                                  <td className="p-3 text-[10px] font-bold text-white bg-slate-950/50 sticky left-0 z-10">
                                    <div className="flex items-center gap-2">
                                      <Activity size={12} className="text-violet-500" />
                                      <span>Overall Regime</span>
                                    </div>
                                  </td>
                                  {protocolMetrics.map(m => (
                                    <td key={m.protocol.metadata.id} className="p-3 text-center">
                                      <span className={`inline-block px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide
                                    ${m.regime.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                          m.regime.color === 'amber' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                            m.regime.color === 'rose' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                                              'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                                        }`}>
                                        {m.regime.regime.split(' ').slice(0, 2).join(' ')}
                                      </span>
                                    </td>
                                  ))}
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()}


                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {PROTOCOL_PROFILES.filter(p => selectedProtocolIds.includes(p.metadata.id)).map(p => {
                        const data = multiAggregated[p.metadata.id] || [];
                        const last = data[data.length - 1];
                        const regime = calculateRegime(data, p);
                        const finalSupply = last?.supply?.mean || p.parameters.supply.value;
                        const finalProviders = last?.providers?.mean || 30;
                        const avgUtilization = data.length > 0
                          ? data.reduce((sum, d) => sum + (d?.utilization?.mean || 0), 0) / data.length
                          : 0;

                        // Get live data for this protocol
                        const live = liveData[p.metadata.id];

                        return (
                          <div key={p.metadata.id} className={`p-5 bg-slate-900/80 border rounded-2xl ${selectedProtocolIds[0] === p.metadata.id ? 'border-indigo-500/50' : 'border-slate-800'}`}>
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xs font-black text-white uppercase tracking-wider">{p.metadata.name}</h4>
                                  {live && (
                                    <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                                      LIVE
                                    </span>
                                  )}
                                </div>
                                <p className="text-[9px] text-slate-500">{p.metadata.mechanism}</p>
                              </div>
                              <div className={`px-2 py-1 rounded-md bg-${regime.color}-500/10 border border-${regime.color}-500/20`}>
                                <span className={`text-[8px] font-black text-${regime.color}-400 uppercase`}>{regime.regime.split(' ')[0]}</span>
                              </div>
                            </div>


                            {live && (
                              <div className="mb-4 p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[9px] text-slate-500 uppercase">Live Price</span>
                                  <span className={`text-[9px] font-bold ${live.priceChangePercentage24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {live.priceChangePercentage24h >= 0 ? '↑' : '↓'} {Math.abs(live.priceChangePercentage24h).toFixed(2)}%
                                  </span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-lg font-bold text-white font-mono">
                                    ${live.currentPrice < 0.01 ? live.currentPrice.toFixed(6) : live.currentPrice.toFixed(4)}
                                  </span>
                                  <span className="text-[9px] text-slate-500">
                                    MCap: {formatCompact(live.marketCap)}
                                  </span>
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-3 gap-3">
                              <div className="text-center">
                                <p className="text-[9px] text-slate-500 uppercase mb-1">
                                  {live ? 'Real Supply' : 'Sim Supply'}
                                </p>
                                <p className="text-sm font-mono font-bold text-emerald-400">
                                  {formatCompact(live ? live.circulatingSupply : finalSupply)}
                                </p>
                                {live && data.length > 0 && (
                                  <p className="text-[8px] text-slate-600 mt-0.5">
                                    Sim: {formatCompact(finalSupply)}
                                  </p>
                                )}
                              </div>
                              <div className="text-center">
                                <p className="text-[9px] text-slate-500 uppercase mb-1">Providers</p>
                                <p className="text-sm font-mono font-bold text-blue-400">{Math.round(finalProviders)}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[9px] text-slate-500 uppercase mb-1">Util.</p>
                                <p className="text-sm font-mono font-bold text-amber-400">{avgUtilization.toFixed(0)}%</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>


                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <TrendingUp size={16} className="text-indigo-400" />
                          <h3 className="text-xs font-black text-white uppercase tracking-widest">Provider Count Overlay</h3>

                          <button
                            onClick={() => setNormalizeCharts(!normalizeCharts)}
                            className={`ml-2 px-3 py-1 rounded-lg text-[9px] font-bold uppercase transition-all border ${normalizeCharts
                              ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30'
                              : 'text-slate-500 border-slate-700 hover:border-slate-600'
                              }`}
                            title="Normalize all lines to start at 100 for shape comparison"
                          >
                            {normalizeCharts ? '📊 Indexed (100)' : '📈 Absolute'}
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          {PROTOCOL_PROFILES.filter(p => selectedProtocolIds.includes(p.metadata.id)).map((p, i) => {
                            const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
                            const isHidden = hiddenProtocols.has(p.metadata.id);
                            return (
                              <button
                                key={p.metadata.id}
                                onClick={() => toggleProtocolVisibility(p.metadata.id)}
                                className={`flex items-center gap-2 px-2 py-1 rounded transition-all ${isHidden ? 'opacity-40 hover:opacity-60' : 'hover:bg-slate-800/50'
                                  }`}
                                title={isHidden ? `Show ${p.metadata.name}` : `Hide ${p.metadata.name}`}
                              >
                                <div
                                  className={`w-3 h-0.5 rounded transition-all ${isHidden ? 'bg-slate-600' : ''}`}
                                  style={{ backgroundColor: isHidden ? undefined : colors[i % colors.length] }}
                                />
                                <span className={`text-[9px] font-bold uppercase ${isHidden ? 'text-slate-600 line-through' : 'text-slate-400'}`}>
                                  {p.metadata.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>


                      {normalizeCharts && (
                        <div className="mb-3 px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                          <p className="text-[9px] text-indigo-400">
                            <strong>Indexed view:</strong> All protocols start at 100 (week 0). Compare <em>shapes</em> and <em>trends</em>, not absolute values. Hover for actual numbers.
                          </p>
                        </div>
                      )}

                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis
                              dataKey="t"
                              fontSize={9}
                              tick={{ fill: '#64748b' }}
                              allowDuplicatedCategory={false}
                            />
                            <YAxis
                              fontSize={9}
                              tick={{ fill: '#64748b' }}
                              domain={normalizeCharts ? [0, 'auto'] : ['auto', 'auto']}
                              tickFormatter={(val) => normalizeCharts ? `${val}` : val}
                            />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                              labelStyle={{ color: '#94a3b8', fontSize: 10 }}
                              formatter={(value: number, name: string, props: any) => {
                                if (normalizeCharts) {
                                  // Find actual value from original data
                                  const protocolId = PROTOCOL_PROFILES.find(p => p.metadata.name === name)?.metadata.id;
                                  const data = protocolId ? multiAggregated[protocolId] : [];
                                  const point = data.find((d: any) => d.t === props.payload?.t);
                                  const actual = point?.providers?.mean || 0;
                                  return [`Index: ${value.toFixed(1)} | Actual: ${Math.round(actual)}`, name];
                                }
                                return [Math.round(value as number), name];
                              }}
                            />
                            {PROTOCOL_PROFILES.filter(p => selectedProtocolIds.includes(p.metadata.id) && !hiddenProtocols.has(p.metadata.id)).map((p, i) => {
                              const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
                              const data = multiAggregated[p.metadata.id] || [];
                              const baselineValue = data[0]?.providers?.mean || 1;

                              // Normalize data if toggle is on
                              const chartData = normalizeCharts
                                ? data.map((d: any) => ({
                                  ...d,
                                  normalizedProviders: ((d?.providers?.mean || 0) / baselineValue) * 100
                                }))
                                : data;

                              return (
                                <Line
                                  key={p.metadata.id}
                                  data={chartData}
                                  type="monotone"
                                  dataKey={normalizeCharts ? 'normalizedProviders' : (d: any) => d?.providers?.mean}
                                  stroke={colors[i % colors.length]}
                                  strokeWidth={2}
                                  dot={false}
                                  name={p.metadata.name}
                                />
                              );
                            })}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>


                      {normalizeCharts && (
                        <div className="mt-4 pt-4 border-t border-slate-800">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[9px] text-slate-500 uppercase font-bold">Absolute Values (Week {params.T}):</span>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {PROTOCOL_PROFILES.filter(p => selectedProtocolIds.includes(p.metadata.id) && !hiddenProtocols.has(p.metadata.id)).map((p, i) => {
                              const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
                              const data = multiAggregated[p.metadata.id] || [];
                              const last = data[data.length - 1];
                              const first = data[0];
                              const finalValue = last?.providers?.mean || 0;
                              const startValue = first?.providers?.mean || 1;
                              const change = ((finalValue - startValue) / startValue) * 100;

                              return (
                                <div key={p.metadata.id} className="flex items-center gap-2 px-2 py-1 bg-slate-800/50 rounded">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                                  <span className="text-[9px] text-slate-400 font-bold">{p.metadata.name}:</span>
                                  <span className="text-[10px] font-mono text-white">{Math.round(finalValue)}</span>
                                  <span className={`text-[9px] font-bold ${change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    ({change >= 0 ? '+' : ''}{change.toFixed(0)}%)
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>


                    <div className="overflow-x-auto custom-scrollbar pb-4">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="text-left">
                            <th className="p-4 bg-slate-950 sticky left-0 z-10 w-48">
                              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Metric</span>
                            </th>
                            {PROTOCOL_PROFILES.filter(p => selectedProtocolIds.includes(p.metadata.id)).map(p => (
                              <th key={p.metadata.id} className="p-4 min-w-[280px]">
                                <div className="flex flex-col gap-1">
                                  <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">{p.metadata.name}</span>
                                  <span className="text-[9px] text-slate-500 font-bold uppercase">{p.metadata.mechanism}</span>
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">

                          <tr className="hover:bg-slate-900/30 transition-colors">
                            <td className="p-5 bg-slate-950/50 sticky left-0 z-10">
                              <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <ShieldQuestion size={14} /> Regime
                              </div>
                            </td>
                            {PROTOCOL_PROFILES.filter(p => selectedProtocolIds.includes(p.metadata.id)).map(p => {
                              const regime = calculateRegime(multiAggregated[p.metadata.id] || [], p);
                              return (
                                <td key={p.metadata.id} className="p-5">
                                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-${regime.color}-500/10 border border-${regime.color}-500/20`}>
                                    <div className={`w-1.5 h-1.5 rounded-full bg-${regime.color}-500 animate-pulse`} />
                                    <span className={`text-[10px] font-black text-${regime.color}-400 uppercase tracking-widest`}>{regime.regime}</span>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>


                          <tr className="hover:bg-slate-900/30 transition-colors">
                            <td className="p-5 bg-slate-950/50 sticky left-0 z-10">
                              <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <Database size={14} /> Supply
                              </div>
                            </td>
                            {PROTOCOL_PROFILES.filter(p => selectedProtocolIds.includes(p.metadata.id)).map(p => (
                              <td key={p.metadata.id} className="p-5 h-28">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={multiAggregated[p.metadata.id] || []}>
                                    <defs>
                                      <linearGradient id={`supply-${p.metadata.id}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                      </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey={(d: any) => d?.supply?.mean} stroke="#8b5cf6" fill={`url(#supply-${p.metadata.id})`} strokeWidth={2} isAnimationActive={false} />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </td>
                            ))}
                          </tr>


                          <tr className="hover:bg-slate-900/30 transition-colors">
                            <td className="p-5 bg-slate-950/50 sticky left-0 z-10">
                              <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <Users size={14} /> Providers
                              </div>
                            </td>
                            {PROTOCOL_PROFILES.filter(p => selectedProtocolIds.includes(p.metadata.id)).map(p => (
                              <td key={p.metadata.id} className="p-5 h-28">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={multiAggregated[p.metadata.id] || []}>
                                    <defs>
                                      <linearGradient id={`providers-${p.metadata.id}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                      </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey={(d: any) => d?.providers?.mean} stroke="#10b981" fill={`url(#providers-${p.metadata.id})`} strokeWidth={2} isAnimationActive={false} />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </td>
                            ))}
                          </tr>


                          <tr className="hover:bg-slate-900/30 transition-colors">
                            <td className="p-5 bg-slate-950/50 sticky left-0 z-10">
                              <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <Activity size={14} /> Utilization
                              </div>
                            </td>
                            {PROTOCOL_PROFILES.filter(p => selectedProtocolIds.includes(p.metadata.id)).map(p => (
                              <td key={p.metadata.id} className="p-5 h-28">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={multiAggregated[p.metadata.id] || []}>
                                    <defs>
                                      <linearGradient id={`util-${p.metadata.id}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                      </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey={(d: any) => d?.utilization?.mean} stroke="#f59e0b" fill={`url(#util-${p.metadata.id})`} strokeWidth={2} isAnimationActive={false} />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </td>
                            ))}
                          </tr>


                          <tr className="hover:bg-slate-900/30 transition-colors">
                            <td className="p-5 bg-slate-950/50 sticky left-0 z-10">
                              <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <Flame size={14} /> Burn/Mint
                              </div>
                            </td>
                            {PROTOCOL_PROFILES.filter(p => selectedProtocolIds.includes(p.metadata.id)).map(p => (
                              <td key={p.metadata.id} className="p-5 h-28">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={multiAggregated[p.metadata.id] || []}>
                                    <Area type="monotone" dataKey={(d: any) => d?.minted?.mean} stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} strokeWidth={1.5} isAnimationActive={false} />
                                    <Area type="monotone" dataKey={(d: any) => d?.burned?.mean} stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} strokeWidth={1.5} isAnimationActive={false} />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </td>
                            ))}
                          </tr>


                          <tr className="hover:bg-slate-900/30 transition-colors">
                            <td className="p-5 bg-slate-950/50 sticky left-0 z-10">
                              <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <Settings2 size={14} /> Parameters
                              </div>
                            </td>
                            {PROTOCOL_PROFILES.filter(p => selectedProtocolIds.includes(p.metadata.id)).map(p => (
                              <td key={p.metadata.id} className="p-5">
                                <div className="grid grid-cols-2 gap-3 text-[9px]">
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Supply:</span>
                                    <span className="text-white font-mono">{formatCompact(p.parameters.supply.value)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Max Mint:</span>
                                    <span className="text-white font-mono">{formatCompact(p.parameters.emissions.value)}/wk</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Burn %:</span>
                                    <span className="text-white font-mono">{(p.parameters.burn_fraction.value * 100).toFixed(0)}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">OpEx:</span>
                                    <span className="text-white font-mono">${p.parameters.provider_economics.opex_weekly.value}/wk</span>
                                  </div>
                                </div>
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div >


              {renderFocusChart()}


              {
                showSpecModal && (
                  <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col h-[80vh] overflow-hidden">
                      <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                        <div className="flex items-center gap-3">
                          <Binary size={20} className="text-indigo-400" />
                          <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">Mathematical Specification</h3>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Logic V1.1 Verification</p>
                          </div>
                        </div>
                        <button onClick={() => setShowSpecModal(false)} className="p-2 text-slate-500 hover:text-white bg-slate-800 rounded-full transition-colors"><X size={18} /></button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="space-y-6">
                            <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest border-b border-slate-800 pb-2">Core Mechanics</h4>
                            <FormulaDisplay label="Market Clearing" formula="Utility_Served = min(Demand, Total_Capacity)" />
                            <FormulaDisplay label="System Capacity" formula="Capacity = Providers * Unit_Capability" />
                            <FormulaDisplay label="Capital Efficiency" formula="Utilization = (Served / Capacity) * 100" />
                            <FormulaDisplay label="Pricing Equilibrium" formula="Service_Price_{t+1} = Service_Price_t * (1 + 0.6 * Scarcity)" />
                          </div>
                          <div className="space-y-6">
                            <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest border-b border-slate-800 pb-2">Tokenomics</h4>
                            <FormulaDisplay label="Utility Value Burn" formula="Burn = (Served * Service_Price) / Token_Price" />
                            <FormulaDisplay label="Dynamic Emissions" formula="Mint = Max_Mint * (0.6 + 0.4 * tanh(Demand / 15000))" />
                            <FormulaDisplay label="Supply Conservation" formula="Supply_{t+1} = Supply_t + Mint_t - Burn_t" />
                          </div>
                        </div>
                        <div className="bg-slate-950/50 p-8 rounded-2xl border border-slate-800 space-y-4">
                          <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2"><Variable size={14} /> Feedback Sensitivity</h4>
                          <p className="text-[11px] text-slate-400 leading-relaxed italic">"Provider behavior follows a Proportional-Derivative growth model. Delta Providers is proportional to the ROI over OpEx, dampened by a 15% weekly growth ceiling to simulate physical hardware lead times."</p>
                          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                            <code className="text-xs text-indigo-400 font-mono">Delta_N = min(N * 0.15, (ROI * sensitivity * churn_capitulation))</code>
                          </div>
                        </div>
                      </div>
                      <div className="p-6 bg-slate-950/50 border-t border-slate-800 flex justify-center">
                        <button onClick={() => setShowSpecModal(false)} className="px-10 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Verified & Understood</button>
                      </div>
                    </div>
                  </div>
                )
              }

              <div className={`fixed inset-y-0 right-0 w-[450px] bg-slate-900 border-l border-slate-800 shadow-2xl z-[500] transform transition-transform duration-500 ease-in-out ${showKnowledgeLayer ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="h-full flex flex-col p-6 space-y-8 overflow-y-auto custom-scrollbar">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-6">
                    <div className="flex items-center gap-3">
                      <Library className="text-indigo-400" size={20} />
                      <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Regime Taxonomy</h3>
                    </div>
                    <button onClick={() => setShowKnowledgeLayer(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={18} /></button>
                  </div>
                  {Object.entries(REGIME_KNOWLEDGE).map(([key, data]) => (
                    <section key={key} className={`p-6 rounded-2xl border ${incentiveRegime.id === key ? `bg-${data.color}-500/5 border-${data.color}-500/30` : 'bg-slate-950/40 border-slate-800'}`}>
                      <div className="flex items-center gap-3 mb-4">
                        <data.icon size={18} className={`text-${data.color}-400`} />
                        <h4 className={`text-xs font-black uppercase tracking-widest text-${data.color}-400`}>{data.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-200 leading-relaxed font-medium">{data.definition}</p>
                    </section>
                  ))}
                </div>
              </div>


              {
                showExportPanel && (
                  <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
                      <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                        <div className="flex items-center gap-3">
                          <Download size={20} className="text-emerald-400" />
                          <h3 className="text-lg font-black text-white uppercase tracking-tight">Export Data</h3>
                        </div>
                        <button onClick={() => setShowExportPanel(false)} className="p-2 text-slate-500 hover:text-white bg-slate-800 rounded-full transition-colors"><X size={18} /></button>
                      </div>
                      <div className="p-8 space-y-6">

                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => {
                              exportToCSV(aggregated as unknown as NewAggregateResult[]);
                              setShowExportPanel(false);
                            }}
                            className="p-6 bg-slate-950 border border-slate-800 rounded-2xl hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group"
                          >
                            <FileDown size={32} className="text-slate-500 group-hover:text-emerald-400 mb-3 transition-colors" />
                            <h4 className="text-sm font-bold text-white mb-1">Export CSV</h4>
                            <p className="text-[10px] text-slate-500">Time series data for analysis</p>
                          </button>
                          <button
                            onClick={() => {
                              if (derivedMetrics) {
                                exportToJSON(aggregated as unknown as NewAggregateResult[], params as unknown as NewSimulationParams, derivedMetrics);
                              }
                              setShowExportPanel(false);
                            }}
                            className="p-6 bg-slate-950 border border-slate-800 rounded-2xl hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group"
                          >
                            <FileJson size={32} className="text-slate-500 group-hover:text-indigo-400 mb-3 transition-colors" />
                            <h4 className="text-sm font-bold text-white mb-1">Export JSON</h4>
                            <p className="text-[10px] text-slate-500">Full data with parameters</p>
                          </button>
                        </div>


                        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                          <div className="flex items-center gap-3 mb-3">
                            <Share2 size={16} className="text-slate-500" />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Shareable Link</span>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              readOnly
                              value={generateShareableURL(params as unknown as NewSimulationParams)}
                              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-[10px] font-mono text-slate-400 truncate"
                            />
                            <button
                              onClick={() => copyToClipboard(generateShareableURL(params as unknown as NewSimulationParams))}
                              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] font-bold text-slate-300 transition-colors"
                            >
                              Copy
                            </button>
                          </div>
                        </div>


                        {derivedMetrics && (
                          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                            <div className="flex items-center gap-3 mb-4">
                              <Gauge size={16} className="text-amber-500" />
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Risk Metrics (V2 Model)</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-[10px]">
                              <div>
                                <span className="text-slate-500 block mb-1">Max Drawdown</span>
                                <span className={`font-bold ${derivedMetrics.maxDrawdown > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                  {derivedMetrics.maxDrawdown.toFixed(1)}%
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 block mb-1">Death Spiral Risk</span>
                                <span className={`font-bold ${derivedMetrics.deathSpiralProbability > 20 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                  {derivedMetrics.deathSpiralProbability.toFixed(1)}%
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 block mb-1">Sharpe Ratio</span>
                                <span className={`font-bold ${derivedMetrics.sharpeRatio < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                  {derivedMetrics.sharpeRatio.toFixed(2)}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 block mb-1">Provider Retention</span>
                                <span className={`font-bold ${derivedMetrics.retentionRate < 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                  {derivedMetrics.retentionRate.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-6 bg-slate-950/50 border-t border-slate-800 flex justify-center">
                        <button onClick={() => setShowExportPanel(false)} className="px-10 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Close</button>
                      </div>
                    </div>
                  </div>
                )
              }


              {
                showDePINBrowser && (
                  <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                      <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                        <div className="flex items-center gap-3">
                          <Layers size={20} className="text-indigo-400" />
                          <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">DePIN Token Browser</h3>
                            <p className="text-[10px] text-slate-500">
                              {Object.keys(allDePINData).length} tokens tracked •
                              {lastLiveDataFetch ? ` Updated ${lastLiveDataFetch.toLocaleTimeString()}` : ' Click Fetch Live to load data'}
                            </p>
                          </div>
                        </div>
                        <button onClick={() => setShowDePINBrowser(false)} className="p-2 text-slate-500 hover:text-white bg-slate-800 rounded-full transition-colors"><X size={18} /></button>
                      </div>

                      <div className="flex-1 overflow-auto p-6 custom-scrollbar">
                        {Object.keys(allDePINData).length === 0 ? (
                          <div className="text-center py-12">
                            <Layers size={48} className="text-slate-700 mx-auto mb-4" />
                            <p className="text-slate-500 mb-4">No live data loaded yet</p>
                            <button
                              onClick={fetchLiveData}
                              disabled={liveDataLoading}
                              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all"
                            >
                              {liveDataLoading ? 'Fetching...' : 'Fetch Live Data'}
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {Object.entries(DEPIN_TOKENS).map(([tokenId, info]) => {
                                const data = allDePINData[tokenId];
                                if (!data) return null;

                                return (
                                  <div key={tokenId} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-indigo-500/30 transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                      <div>
                                        <h4 className="text-sm font-bold text-white">{info.name}</h4>
                                        <p className="text-[9px] text-indigo-400 uppercase">{info.category}</p>
                                      </div>
                                      <span className="text-[9px] font-mono text-slate-500">{info.symbol}</span>
                                    </div>

                                    <div className="flex items-baseline justify-between mb-3">
                                      <span className="text-lg font-bold text-white font-mono">
                                        ${data.currentPrice < 0.01 ? data.currentPrice.toFixed(6) : data.currentPrice.toFixed(4)}
                                      </span>
                                      <span className={`text-[10px] font-bold ${data.priceChangePercentage24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {data.priceChangePercentage24h >= 0 ? '↑' : '↓'} {Math.abs(data.priceChangePercentage24h).toFixed(2)}%
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-[9px]">
                                      <div>
                                        <span className="text-slate-500 block">Market Cap</span>
                                        <span className="text-slate-300 font-mono">{formatCompact(data.marketCap)}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block">Supply</span>
                                        <span className="text-slate-300 font-mono">{formatCompact(data.circulatingSupply)}</span>
                                      </div>
                                    </div>


                                    {data.sparkline7d && data.sparkline7d.length > 0 && (
                                      <div className="mt-3 h-8 flex items-end gap-px">
                                        {data.sparkline7d.slice(-30).map((price, i, arr) => {
                                          const min = Math.min(...arr);
                                          const max = Math.max(...arr);
                                          const height = max > min ? ((price - min) / (max - min)) * 100 : 50;
                                          const isUp = i > 0 && price > arr[i - 1];
                                          return (
                                            <div
                                              key={i}
                                              className={`flex-1 rounded-t ${isUp ? 'bg-emerald-500/50' : 'bg-slate-700'}`}
                                              style={{ height: `${Math.max(height, 5)}%` }}
                                            />
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>


                            <div className="p-4 bg-slate-950 border border-amber-500/20 rounded-2xl">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <Database size={16} className="text-amber-400" />
                                  <div>
                                    <h4 className="text-sm font-bold text-white">On-Chain Analytics</h4>
                                    <p className="text-[9px] text-slate-500">Powered by Dune Analytics (coming soon)</p>
                                  </div>
                                </div>
                                <span className={`text-[9px] px-2 py-1 rounded ${isDuneConfigured() ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                  {isDuneConfigured() ? 'Connected' : 'Not Configured'}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 mb-3">
                                {getDuneStatus().message}
                              </p>
                              {!isDuneConfigured() && (
                                <div className="flex gap-2">
                                  <input
                                    type="password"
                                    placeholder="Enter Dune API Key"
                                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-[10px] text-slate-300"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const input = e.target as HTMLInputElement;
                                        if (input.value) {
                                          saveDuneApiKey(input.value);
                                          input.value = '';
                                        }
                                      }
                                    }}
                                  />
                                  <button className="px-4 py-2 bg-amber-600/20 text-amber-400 rounded-lg text-[10px] font-bold hover:bg-amber-600/30 transition-colors">
                                    Save
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={autoRefreshEnabled}
                              onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                              className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-[10px] text-slate-400">Auto-refresh every 5 min</span>
                          </label>
                          {autoRefreshEnabled && timeUntilRefresh && (
                            <span className="text-[9px] text-emerald-400">Next: {timeUntilRefresh}</span>
                          )}
                        </div>
                        <button onClick={() => setShowDePINBrowser(false)} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-bold transition-all">Close</button>
                      </div>
                    </div>
                  </div>
                )
              }
            </main >
          </>
        )}
      </div >

      <style>{`
        :root {
          --rose-rgb: 244, 63, 94;
          --amber-rgb: 251, 191, 36;
          --emerald-rgb: 16, 185, 129;
          --indigo-rgb: 99, 102, 241;
          --slate-rgb: 71, 85, 105;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
        input[type="range"] { -webkit-appearance: none; background: transparent; }
        input[type="range"]::-webkit-slider-thumb {
          height: 18px; width: 18px; border-radius: 50%; background: #6366f1;
          border: 3px solid #0f172a; -webkit-appearance: none; margin-top: -7px;
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.4); cursor: pointer;
        }
        input[type="range"]::-webkit-slider-runnable-track {
          width: 100%; height: 4px; cursor: pointer; background: #1e293b; border-radius: 2px;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
      <MethodologySheet isOpen={isMethodologyOpen} onClose={() => setIsMethodologyOpen(false)} />
    </div >
  );
};

createRoot(document.getElementById('root')!).render(<App />);
