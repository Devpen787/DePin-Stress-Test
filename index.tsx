
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
  ComposedChart
} from 'recharts';
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
  Crosshair,
  GitCompare,
  LayoutGrid,
  Lock,
  Calculator,
  History,
  Binary,
  Variable
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

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
    while(u === 0) u = this.next();
    while(v === 0) v = this.next();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }
}

// Types
type DemandType = 'consistent' | 'high-to-decay' | 'growth' | 'volatile';
type MacroCondition = 'bearish' | 'bullish' | 'sideways';
type ViewMode = 'sandbox' | 'comparison';

interface ProtocolProfileV1 {
  version: string;
  metadata: {
    id: string;
    name: string;
    notes: string;
    mechanism: string;
    source: 'Interview-Derived' | 'Placeholder-Derived';
  };
  parameters: {
    supply: { value: number; unit: string };
    emissions: { value: number; unit: string };
    burn_fraction: { value: number; unit: string };
    adjustment_lag: { value: number; unit: string };
    demand_regime: { value: DemandType; unit: string };
    provider_economics: {
      opex_weekly: { value: number; unit: string };
      churn_threshold: { value: number; unit: string };
    };
  };
}

interface SimulationParams {
  T: number;
  initialSupply: number;
  initialPrice: number;
  maxMintWeekly: number;
  burnPct: number;
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

const PROTOCOL_PROFILES: ProtocolProfileV1[] = [
  {
    version: "1.1",
    metadata: {
      id: "ono_v3_calibrated",
      name: "ONO",
      mechanism: "Fixed Emissions w/ Partial Burn",
      notes: "Expert calibrated based on 2024 interviews. Low node count target (30-100).",
      source: "Interview-Derived"
    },
    parameters: {
      supply: { value: 100000000, unit: "tokens" },
      emissions: { value: 250000, unit: "tokens/week" },
      burn_fraction: { value: 0.65, unit: "decimal" },
      adjustment_lag: { value: 6, unit: "weeks" },
      demand_regime: { value: "growth", unit: "category" },
      provider_economics: {
        opex_weekly: { value: 25.96, unit: "chf/week" },
        churn_threshold: { value: 10, unit: "chf/week_profit" }
      }
    }
  },
  {
    version: "1.1",
    metadata: {
      id: "helium_bme_v1",
      name: "Helium-like",
      mechanism: "Burn-and-Mint Equilibrium",
      notes: "Modeled after BME structures. High node count capability. 100% burn of service fees.",
      source: "Placeholder-Derived"
    },
    parameters: {
      supply: { value: 100000000, unit: "tokens" },
      emissions: { value: 1250000, unit: "tokens/week" },
      burn_fraction: { value: 1.0, unit: "decimal" },
      adjustment_lag: { value: 0, unit: "weeks" },
      demand_regime: { value: "consistent", unit: "category" },
      provider_economics: {
        opex_weekly: { value: 50.00, unit: "chf/week" },
        churn_threshold: { value: 5.00, unit: "chf/week_profit" }
      }
    }
  },
  {
    version: "1.1",
    metadata: {
      id: "adaptive_elastic_v1",
      name: "Adaptive",
      mechanism: "Algorithmic Supply Adjustment",
      notes: "Elastic supply protocol. Low opex threshold node operations.",
      source: "Placeholder-Derived"
    },
    parameters: {
      supply: { value: 50000000, unit: "tokens" },
      emissions: { value: 100000, unit: "tokens/week" },
      burn_fraction: { value: 0.50, unit: "decimal" },
      adjustment_lag: { value: 2, unit: "weeks" },
      demand_regime: { value: "volatile", unit: "category" },
      provider_economics: {
        opex_weekly: { value: 15.00, unit: "chf/week" },
        churn_threshold: { value: 15.00, unit: "chf/week_profit" }
      }
    }
  }
];

const MetricCard: React.FC<{ 
  title: string; 
  value: string; 
  subValue?: string; 
  subColor?: string;
  icon?: any;
  tooltip?: string;
}> = ({ title, value, subValue, subColor, icon: Icon, tooltip }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm group relative">
    <div className="flex justify-between items-start mb-2">
      <div className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">{title}</div>
      {Icon && <Icon size={14} className="text-slate-700" />}
    </div>
    <div className="flex items-baseline gap-2">
      <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
      {subValue && <div className={`text-[10px] font-bold ${subColor || 'text-rose-400'}`}>{subValue}</div>}
    </div>
    {tooltip && (
      <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[110] text-[10px] text-slate-400 leading-relaxed font-medium">
        {tooltip}
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
  children: React.ReactNode 
}> = ({ title, icon: Icon, color, onExpand, isDriver, driverColor = 'indigo', children }) => {
  const interp = CHART_INTERPRETATIONS[title];
  const [showInterp, setShowInterp] = useState(false);

  return (
    <div className={`bg-slate-900 border ${isDriver ? `border-${driverColor}-500/50 shadow-[0_0_20px_rgba(0,0,0,0.5),0_0_10px_rgba(var(--${driverColor}-rgb),0.2)]` : 'border-slate-800'} rounded-xl p-5 flex flex-col h-[380px] shadow-sm relative overflow-hidden group transition-all duration-500`}>
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
      
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {children as any}
        </ResponsiveContainer>
      </div>

      {showInterp && interp && (
        <div className="absolute inset-0 bg-slate-950 border-t border-slate-800 p-6 z-20 animate-in fade-in slide-in-from-bottom-2 duration-200 flex flex-col justify-start">
          <div className="flex justify-between items-start mb-4">
             <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest bg-indigo-400/10 px-2 py-0.5 rounded">Research Context</span>
             <button onClick={() => setShowInterp(false)} className="text-slate-600 hover:text-white bg-slate-800/50 p-1 rounded-full transition-colors"><X size={12}/></button>
          </div>
          <div className="space-y-5 overflow-y-auto custom-scrollbar pr-2">
            <div>
              <p className="text-[11px] text-slate-100 font-bold leading-relaxed mb-1">{interp.question}</p>
              <div className="bg-slate-900 p-2 rounded-lg mb-3 border border-slate-800 flex items-center gap-2">
                 <Binary size={10} className="text-indigo-400" />
                 <code className="text-[9px] text-slate-400 font-mono">{interp.formula}</code>
              </div>
              <div className="flex items-center gap-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                <ShieldAlert size={12} className="text-rose-500 shrink-0"/>
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
          providerCostPerWeek, baseCapacityPerProvider, kDemandPrice, kMintPrice, rewardLagWeeks, churnThreshold } = params;

  let mu = 0.002, sigma = 0.05;
  if (macro === 'bearish') { mu = -0.01; sigma = 0.06; }
  else if (macro === 'bullish') { mu = 0.015; sigma = 0.06; }

  const demands = getDemandSeries(T, 12000, demandType, rng);
  const results: SimResult[] = [];

  let currentSupply = initialSupply;
  let currentPrice = initialPrice;
  let currentProviders = 30;
  let currentServicePrice = 0.5;
  
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
    const delta = Math.max(-currentProviders * 0.1, Math.min(maxGrowth, rawDelta));
    
    const demandPressure = kDemandPrice * Math.tanh(scarcity);
    const dilutionPressure = -kMintPrice * (minted / currentSupply) * 100;
    const logRet = mu + demandPressure + dilutionPressure + sigma * rng.normal();
    const nextPrice = Math.max(0.01, currentPrice * Math.exp(logRet));

    results.push({
      t, price: currentPrice, supply: currentSupply, demand, demand_served,
      providers: currentProviders, capacity, servicePrice: currentServicePrice,
      minted, burned, utilization, profit, scarcity, incentive
    });

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

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('sandbox');
  const [selectedProtocolIds, setSelectedProtocolIds] = useState<string[]>([PROTOCOL_PROFILES[0].metadata.id]);
  const [activeProfile, setActiveProfile] = useState<ProtocolProfileV1>(PROTOCOL_PROFILES[0]);
  
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
    churnThreshold: PROTOCOL_PROFILES[0].parameters.provider_economics.churn_threshold.value
  });

  const [aggregated, setAggregated] = useState<AggregateResult[]>([]);
  const [multiAggregated, setMultiAggregated] = useState<Record<string, AggregateResult[]>>({});
  const [loading, setLoading] = useState(false);
  const [playbackWeek, setPlaybackWeek] = useState(0);
  const [focusChart, setFocusChart] = useState<string | null>(null);
  const [showKnowledgeLayer, setShowKnowledgeLayer] = useState(false);
  const [showAuditPanel, setShowAuditPanel] = useState(false);
  const [showSpecModal, setShowSpecModal] = useState(false);

  const runSimulation = () => {
    setLoading(true);
    setPlaybackWeek(0);

    setTimeout(() => {
      const allResults: Record<string, AggregateResult[]> = {};

      const protocolsToSimulate = viewMode === 'comparison' 
        ? PROTOCOL_PROFILES.filter(p => selectedProtocolIds.includes(p.metadata.id))
        : [activeProfile];

      protocolsToSimulate.forEach(profile => {
        const localParams = {
          ...params,
          initialSupply: profile.parameters.supply.value,
          maxMintWeekly: profile.parameters.emissions.value,
          burnPct: profile.parameters.burn_fraction.value,
          rewardLagWeeks: profile.parameters.adjustment_lag.value,
          providerCostPerWeek: profile.parameters.provider_economics.opex_weekly.value,
          churnThreshold: profile.parameters.provider_economics.churn_threshold.value
        };

        const allSims: SimResult[][] = [];
        for (let i = 0; i < params.nSims; i++) {
          allSims.push(simulateOne(localParams, params.seed + i));
        }

        const aggregate: AggregateResult[] = [];
        const keys: (keyof SimResult)[] = ['price', 'supply', 'demand', 'demand_served', 'providers', 'capacity', 'servicePrice', 'minted', 'burned', 'utilization', 'profit', 'scarcity', 'incentive'];
        
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
      switch(focusChart) {
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
              <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl"><Maximize2 size={20}/></div>
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
                        <span className="text-[9px] font-black text-emerald-500 uppercase flex items-center gap-1.5"><CheckSquare size={10}/> Robust Signal</span>
                        <p className="text-[10px] text-slate-400 leading-normal">{interp.robust}</p>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-black text-rose-500 uppercase flex items-center gap-1.5"><AlertCircle size={10}/> Fragile Signal</span>
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
              onClick={() => setViewMode('sandbox')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'sandbox' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <LayoutGrid size={14} /> Sandbox
            </button>
            <button 
              onClick={() => setViewMode('comparison')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'comparison' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <GitCompare size={14} /> Comparison
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
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
          <button onClick={runSimulation} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 active:scale-95">
            {loading ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} fill="currentColor" />}
            Run Matrix
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
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
                    className={`p-4 rounded-xl text-left transition-all border group active:scale-[0.98] ${
                      (viewMode === 'sandbox' && isActive) || (viewMode === 'comparison' && isSelected)
                        ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.1)]' 
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-[11px] font-extrabold uppercase tracking-tight ${
                        (viewMode === 'sandbox' && isActive) || (viewMode === 'comparison' && isSelected) ? 'text-indigo-400' : 'text-slate-300'
                      }`}>{p.metadata.name}</span>
                      {((viewMode === 'sandbox' && isActive) || (viewMode === 'comparison' && isSelected)) && <CheckCircle2 size={12} className="text-indigo-400" />}
                    </div>
                    <div className="text-[9px] text-slate-500 font-medium leading-tight">{p.metadata.mechanism}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6 flex flex-col gap-8">
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Settings2 size={14} className="text-slate-500" />
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Stress Controls</h2>
              </div>
              <div className="space-y-7">
                <div>
                  <label className="block text-[9px] font-bold text-slate-600 uppercase mb-4 tracking-widest flex items-center gap-2">
                    Time Horizon {viewMode === 'comparison' && <Lock size={10} className="text-slate-500" />}
                  </label>
                  <input type="range" min="12" max="104" value={params.T} onChange={e => setParams({...params, T: parseInt(e.target.value)})} className="w-full accent-indigo-600 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer mb-2" />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400"><span>Duration</span><span className="text-indigo-400 font-bold">{params.T} weeks</span></div>
                </div>

                <div className="space-y-4">
                  <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                    Exogenous Load {viewMode === 'comparison' && <Lock size={10} className="text-slate-500" />}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['consistent', 'growth', 'volatile', 'high-to-decay'].map(d => (
                      <button key={d} onClick={() => setParams({...params, demandType: d as any})} className={`py-2 rounded-lg text-[9px] font-bold uppercase transition-all border active:scale-95 ${params.demandType === d ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>{d}</button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
            
            {viewMode === 'sandbox' && (
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
            )}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-slate-950 p-8 custom-scrollbar relative">
          <div className="max-w-7xl mx-auto">
            {viewMode === 'sandbox' ? (
              <div className="space-y-10">
                <div className="flex items-center justify-between p-5 bg-indigo-600/5 border border-indigo-500/20 rounded-2xl backdrop-blur-sm">
                  <div className="flex items-center gap-5">
                    <div className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(79,70,229,0.2)]">Sandbox Mode</div>
                    <span className="text-sm font-extrabold text-white uppercase tracking-tight">{activeProfile.metadata.name} <span className="text-slate-500 ml-2 font-medium opacity-50">V{activeProfile.version}</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
                    <History size={12} />
                    <span>LATEST RUN: {new Date().toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-5">
                  <MetricCard 
                    title="Robustness Index" 
                    value={protocolHealth.score.toString()} 
                    icon={HeartPulse} 
                    subValue={protocolHealth.status} 
                    subColor={protocolHealth.score > 70 ? 'text-emerald-400' : 'text-rose-400'} 
                  />
                  <MetricCard title="Circulating Mass" value={formatCompact(aggregated[aggregated.length-1]?.supply?.mean || 0)} icon={Database} />
                  <MetricCard title="Sustainability Gap" value={formatCompact((aggregated[aggregated.length-1]?.burned?.mean || 0) - (aggregated[aggregated.length-1]?.minted?.mean || 0))} icon={ArrowDownUp} />
                  <MetricCard title="Retention Ratio" value={aggregated.length ? `${(((aggregated[aggregated.length-1]?.providers?.mean || 30) / 30) * 100).toFixed(0)}%` : '100%'} icon={UserCheck} />
                </div>

                {showAuditPanel && (
                  <div className="p-6 bg-slate-900 border border-indigo-500/30 rounded-3xl animate-in zoom-in-95 duration-200 shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <Calculator className="text-indigo-400" size={18} />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white">System Calibration Audit (T={params.T})</h4>
                      </div>
                      <button onClick={() => setShowAuditPanel(false)} className="text-slate-600 hover:text-white transition-colors"><X size={14}/></button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
                      <div className="space-y-1 group">
                        <span className="text-[8px] font-bold text-slate-500 uppercase flex items-center gap-1.5">Provider ROI (Incentive) <Info size={10} className="opacity-30"/></span>
                        <div className="text-sm font-mono text-emerald-400 bg-emerald-400/5 px-2 py-1 rounded border border-emerald-400/20">{((aggregated[aggregated.length-1]?.incentive?.mean || 0) * 100).toFixed(1)}%</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] font-bold text-slate-500 uppercase">System Scarcity</span>
                        <div className="text-sm font-mono text-amber-400 bg-amber-400/5 px-2 py-1 rounded border border-amber-400/20">{((aggregated[aggregated.length-1]?.scarcity?.mean || 0) * 100).toFixed(1)}%</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] font-bold text-slate-500 uppercase">Weekly Emission Ratio</span>
                        <div className="text-sm font-mono text-indigo-400 bg-indigo-400/5 px-2 py-1 rounded border border-indigo-400/20">{( (aggregated[aggregated.length-1]?.minted?.mean || 0) / (params.initialSupply) * 100).toFixed(4)}%</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] font-bold text-slate-500 uppercase">Realized OpEx</span>
                        <div className="text-sm font-mono text-slate-300 bg-slate-300/5 px-2 py-1 rounded border border-slate-300/20">CHF {params.providerCostPerWeek.toFixed(2)} / unit</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                  <BaseChartBox title="Capacity vs Demand" icon={Activity} color="indigo" onExpand={() => setFocusChart("Capacity vs Demand")} isDriver={incentiveRegime.drivers.includes('Capacity vs Demand')} driverColor={incentiveRegime.color}>
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
                  <BaseChartBox title="Provider Count" icon={Users} color="emerald" onExpand={() => setFocusChart("Provider Count")} isDriver={incentiveRegime.drivers.includes('Provider Count')} driverColor={incentiveRegime.color}>
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
                  <BaseChartBox title="Burn vs Emissions" icon={Scale} color="amber" onExpand={() => setFocusChart("Burn vs Emissions")} isDriver={incentiveRegime.drivers.includes('Burn vs Emissions')} driverColor={incentiveRegime.color}>
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
                  <BaseChartBox title="Network Utilization (%)" icon={BarChart3} color="rose" onExpand={() => setFocusChart("Network Utilization (%)")} isDriver={incentiveRegime.drivers.includes('Network Utilization (%)')} driverColor={incentiveRegime.color}>
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
                  <BaseChartBox title="Supply Trajectory" icon={Database} color="violet" onExpand={() => setFocusChart("Supply Trajectory")} isDriver={incentiveRegime.drivers.includes('Supply Trajectory')} driverColor={incentiveRegime.color}>
                    <LineChart data={displayedData} margin={{ left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="t" fontSize={9} />
                      <YAxis fontSize={9} tickFormatter={formatCompact} />
                      <Line type="monotone" dataKey={(d: any) => d?.supply?.mean} stroke="#8b5cf6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </BaseChartBox>
                  <BaseChartBox title="Service Pricing Proxy" icon={DollarSign} color="blue" onExpand={() => setFocusChart("Service Pricing Proxy")} isDriver={incentiveRegime.drivers.includes('Service Pricing Proxy')} driverColor={incentiveRegime.color}>
                    <LineChart data={displayedData} margin={{ left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="t" fontSize={9} />
                      <YAxis fontSize={9} />
                      <Line type="monotone" dataKey={(d: any) => d?.servicePrice?.mean} stroke="#3b82f6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </BaseChartBox>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Comparison View implementation... */}
                <div className="flex items-center justify-between p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-lg">
                   <div className="flex items-center gap-4">
                     <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl"><Lock size={18} /></div>
                     <div>
                       <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Comparative Control Method</h3>
                       <p className="text-[10px] text-slate-500 font-medium italic">Locked stress parameters for structural comparability across all archetypes.</p>
                     </div>
                   </div>
                </div>
                {/* Comparison table... */}
                <div className="overflow-x-auto custom-scrollbar pb-4">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="text-left">
                        <th className="p-4 bg-slate-950 sticky left-0 z-10 w-48"></th>
                        {PROTOCOL_PROFILES.filter(p => selectedProtocolIds.includes(p.metadata.id)).map(p => (
                          <th key={p.metadata.id} className="p-4 min-w-[320px]">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">{p.metadata.name}</span>
                              <span className="text-[9px] text-slate-500 font-bold uppercase">{p.metadata.mechanism}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {/* Comparison rows same as current... */}
                      <tr>
                        <td className="p-6 bg-slate-950/50 sticky left-0 z-10">
                          <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <ShieldQuestion size={14} /> Regime
                          </div>
                        </td>
                        {PROTOCOL_PROFILES.filter(p => selectedProtocolIds.includes(p.metadata.id)).map(p => {
                          const regime = calculateRegime(multiAggregated[p.metadata.id] || [], p);
                          return (
                            <td key={p.metadata.id} className="p-6">
                              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-${regime.color}-500/10 border border-${regime.color}-500/20`}>
                                <div className={`w-1.5 h-1.5 rounded-full bg-${regime.color}-500 animate-pulse`} />
                                <span className={`text-[10px] font-black text-${regime.color}-400 uppercase tracking-widest`}>{regime.regime}</span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                      {/* More rows... */}
                      <tr>
                        <td className="p-6 bg-slate-950/50 sticky left-0 z-10">
                          <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <Users size={14} /> Retention
                          </div>
                        </td>
                        {PROTOCOL_PROFILES.filter(p => selectedProtocolIds.includes(p.metadata.id)).map(p => (
                          <td key={p.metadata.id} className="p-6 h-32">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={multiAggregated[p.metadata.id] || []}>
                                <Area type="monotone" dataKey={(d: any) => d?.providers?.mean} stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} isAnimationActive={false} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Render Focus Modal */}
          {renderFocusChart()}

          {/* Spec Modal */}
          {showSpecModal && (
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
                        <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-slate-800 pb-2">Core Mechanics</h4>
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
                     <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2"><Variable size={14}/> Feedback Sensitivity</h4>
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
          )}

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
        </main>
      </div>

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
      `}</style>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
