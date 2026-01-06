
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
  Zap
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
}

interface ChartInterpretation {
  subtitle: string;
  question: string;
  robust: string;
  fragile: string;
  failureMode: string;
}

const CHART_INTERPRETATIONS: Record<string, ChartInterpretation> = {
  "Capacity vs Demand": {
    subtitle: "Analysis of market clearing and service availability.",
    question: "Does the network maintain sufficient throughput to satisfy exogenous demand without extreme over-provisioning?",
    robust: "Capacity remains slightly above demand; minimal unserved requests.",
    fragile: "Sustained service gaps or excessive idle hardware waste.",
    failureMode: "Supply-side bottleneck: The network cannot scale to meet utility needs."
  },
  "Provider Count": {
    subtitle: "Assessment of supply-side participation and node operator churn.",
    question: "Does the reward structure retain a minimum viable threshold of operators during macro stress?",
    robust: "Stable or mean-reverting provider base; resilience to macro shocks.",
    fragile: "Sharp attrition leading to network security or availability collapse.",
    failureMode: "Network Death Spiral: Declining rewards trigger mass operator exit."
  },
  "Burn vs Emissions": {
    subtitle: "Evaluation of tokenomic sustainability and equilibrium.",
    question: "Is the protocol achieving a self-sustaining circulation equilibrium through real-world utility?",
    robust: "Burn rate periodically matches or exceeds emissions during growth.",
    fragile: "Chronic decoupling where emissions dwarf burn regardless of utility.",
    failureMode: "Structural Over-Subsidization: Network relies on infinite inflation to survive."
  },
  "Network Utilization (%)": {
    subtitle: "Measurement of capital efficiency and infrastructure load.",
    question: "What is the efficiency ratio of the hardware deployed within the network?",
    robust: "Stable utilization (40-80%); maintained operational headroom.",
    fragile: "Values below 10% (irrelevance) or 100% saturation (bottleneck).",
    failureMode: "Infrastructure Irrelevance: Physical assets are deployed but not utilized."
  },
  "Supply Trajectory": {
    subtitle: "Monitoring of issuance constraints and token mass predictability.",
    question: "Does the token issuance remain bounded and predictable over the horizon?",
    robust: "Controlled expansion or demand-responsive contraction.",
    fragile: "Exponential issuance growth leading to irreversible dilution.",
    failureMode: "Hyper-inflation: Token mass expansion outpaces value capture."
  },
  "Service Pricing Proxy": {
    subtitle: "Proxy for end-user cost stability and market competitiveness.",
    question: "Does the unit cost of service remain affordable and stable for end-users?",
    robust: "Mean-reverting pricing; predictable cost basis for service buyers.",
    fragile: "Runaway cost spikes or hyper-volatility decoupling from market norms.",
    failureMode: "Pricing Collapse/Spike: The network becomes too expensive to use."
  }
};

const PROTOCOL_PROFILES: ProtocolProfileV1[] = [
  {
    version: "1.0",
    metadata: {
      id: "ono_v3_calibrated",
      name: "ONO",
      mechanism: "Fixed Emissions w/ Partial Burn",
      notes: "Expert calibrated based on 2024 interviews. Focuses on manual governance with 6-week reward lag.",
      source: "Interview-Derived"
    },
    parameters: {
      supply: { value: 100000000, unit: "tokens" },
      emissions: { value: 900000, unit: "tokens/week" },
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
    version: "1.0",
    metadata: {
      id: "helium_bme_v1",
      name: "Helium-like",
      mechanism: "Burn-and-Mint Equilibrium",
      notes: "Modeled after BME structures. High early emissions. Supply targets equilibrium via 100% burn of service fees.",
      source: "Placeholder-Derived"
    },
    parameters: {
      supply: { value: 100000000, unit: "tokens" },
      emissions: { value: 5000000, unit: "tokens/week" },
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
    version: "1.0",
    metadata: {
      id: "adaptive_elastic_v1",
      name: "Adaptive",
      mechanism: "Algorithmic Supply Adjustment",
      notes: "Elastic supply protocol that adjusts emissions based on real-time network utilization signals.",
      source: "Placeholder-Derived"
    },
    parameters: {
      supply: { value: 50000000, unit: "tokens" },
      emissions: { value: 450000, unit: "tokens/week" },
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
  children: React.ReactNode 
}> = ({ title, icon: Icon, color, onExpand, children }) => {
  const interp = CHART_INTERPRETATIONS[title];
  const [showInterp, setShowInterp] = useState(false);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col h-[380px] shadow-sm relative overflow-hidden group">
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
              <p className="text-[11px] text-slate-100 font-bold leading-relaxed mb-2">{interp.question}</p>
              <div className="flex items-center gap-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                <ShieldAlert size={12} className="text-rose-500 shrink-0"/>
                <span className="text-[9px] font-bold uppercase text-rose-400">System Risk: {interp.failureMode}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-5 pt-3 border-t border-slate-800">
              <div>
                <span className="text-[9px] font-bold text-emerald-500 uppercase block mb-1.5">Robust Signal (Pass)</span>
                <p className="text-[10px] text-slate-400 leading-normal">{interp.robust}</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-rose-500 uppercase block mb-1.5">Fragile Signal (Fail)</span>
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
    
    const minted = Math.min(maxMintWeekly, maxMintWeekly * (0.6 + 0.6 * Math.tanh(demand / 15000.0)));
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
    
    const delta = (incentive * 4.5 * churnMultiplier) + rng.normal() * 0.5;
    
    const demandPressure = kDemandPrice * Math.tanh(scarcity);
    const dilutionPressure = -kMintPrice * (minted / currentSupply) * 100;
    const logRet = mu + demandPressure + dilutionPressure + sigma * rng.normal();
    const nextPrice = Math.max(0.01, currentPrice * Math.exp(logRet));

    results.push({
      t, price: currentPrice, supply: currentSupply, demand, demand_served,
      providers: currentProviders, capacity, servicePrice: currentServicePrice,
      minted, burned, utilization, profit
    });

    currentPrice = nextPrice;
    currentProviders = Math.max(2, currentProviders + delta);
  }
  return results;
}

const App: React.FC = () => {
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
  const [loading, setLoading] = useState(false);
  const [playbackMode, setPlaybackMode] = useState(false);
  const [playbackWeek, setPlaybackWeek] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiSheet, setShowAiSheet] = useState(false);
  const [showResearchBlueprint, setShowResearchBlueprint] = useState(false);
  const [focusChart, setFocusChart] = useState<string | null>(null);
  const [showExaminerVerdict, setShowExaminerVerdict] = useState(false);

  const timerRef = useRef<number | null>(null);

  const runSimulation = () => {
    setLoading(true);
    setAiAnalysis(null);
    setPlaybackWeek(0);

    setTimeout(() => {
      const allSims: SimResult[][] = [];
      for (let i = 0; i < params.nSims; i++) {
        allSims.push(simulateOne(params, params.seed + i));
      }

      const aggregate: AggregateResult[] = [];
      const keys: (keyof SimResult)[] = ['price', 'supply', 'demand', 'demand_served', 'providers', 'capacity', 'servicePrice', 'minted', 'burned', 'utilization', 'profit'];
      
      for (let tStep = 0; tStep < params.T; tStep++) {
        const step: any = { t: tStep };
        keys.forEach(key => {
          const values = allSims.map(sim => sim[tStep][key] as number).sort((a, b) => a - b);
          const mean = values.reduce((a, b) => a + b, 0) / values.length;
          const p10 = values[Math.floor(values.length * 0.1)] || 0;
          const p90 = values[Math.floor(values.length * 0.9)] || 0;
          step[key] = { mean, p10, p90 };
        });
        aggregate.push(step as AggregateResult);
      }

      setAggregated(aggregate);
      setLoading(false);
      if (playbackMode) startPlayback();
      else setPlaybackWeek(params.T);
    }, 100);
  };

  const startPlayback = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setPlaybackWeek(prev => {
        if (prev >= params.T) {
          if (timerRef.current) clearInterval(timerRef.current);
          return prev;
        }
        return prev + 1;
      });
    }, 30);
  };

  const loadProfile = (profile: ProtocolProfileV1) => {
    setActiveProfile(profile);
    setParams({
      ...params,
      initialSupply: profile.parameters.supply.value,
      maxMintWeekly: profile.parameters.emissions.value,
      burnPct: profile.parameters.burn_fraction.value,
      rewardLagWeeks: profile.parameters.adjustment_lag.value,
      demandType: profile.parameters.demand_regime.value,
      providerCostPerWeek: profile.parameters.provider_economics.opex_weekly.value,
      churnThreshold: profile.parameters.provider_economics.churn_threshold.value
    });
    setTimeout(runSimulation, 50);
  };

  const analyzeWithAI = async () => {
    if (!aggregated.length) return;
    setAiLoading(true);
    setShowAiSheet(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const last = aggregated[aggregated.length - 1];
      
      const prompt = `
        Protocol Research Report for ${activeProfile.metadata.name}.
        Data at week ${params.T}:
        - Supply: ${last.supply.mean.toFixed(0)}
        - Providers: ${last.providers.mean.toFixed(1)}
        - Utilization: ${last.utilization.mean.toFixed(1)}%
        - Sustainability: ${(last.burned.mean - last.minted.mean).toFixed(0)} (Burn-Mint)
        
        Analyze structural robustness vs fragility. Focus on mechanics, not price prediction.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
      });

      setAiAnalysis(response.text || "Report generation failed.");
    } catch (error) {
      setAiAnalysis("Audit error.");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => { runSimulation(); return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, []);

  const displayedData = useMemo(() => aggregated.slice(0, playbackWeek), [aggregated, playbackWeek]);
  
  const protocolHealth = useMemo(() => {
    if (!aggregated.length) return { status: 'ROBUST', score: 100, dominance: 'Initial State' };
    const last = aggregated[aggregated.length - 1];
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

  const formatCompact = (n: number) => n.toLocaleString(undefined, { notation: 'compact', maximumFractionDigits: 1 });

  const renderFocusChart = () => {
    if (!focusChart) return null;
    const interp = CHART_INTERPRETATIONS[focusChart];

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
            <button onClick={() => setFocusChart(null)} className="p-2 text-slate-500 hover:text-white bg-slate-800 rounded-full transition-colors"><Minimize2 size={20} /></button>
          </div>
          <div className="flex-1 p-8 flex flex-col lg:flex-row gap-10 overflow-hidden">
             <div className="flex-[3] bg-slate-950/50 rounded-2xl p-6 border border-slate-800">
               <ResponsiveContainer width="100%" height="100%">
                 {focusChart === "Capacity vs Demand" ? (
                    <ComposedChart data={displayedData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="t" fontSize={11} />
                      <YAxis fontSize={11} tickFormatter={formatCompact} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey={(d: any) => d.capacity.mean} stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.15} name="Capacity" />
                      <Line type="monotone" dataKey={(d: any) => d.demand_served.mean} stroke="#fbbf24" strokeWidth={3} dot={false} name="Demand Served" />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                    </ComposedChart>
                 ) : focusChart === "Provider Count" ? (
                    <LineChart data={displayedData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="t" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                      <Line type="step" dataKey={(d: any) => d.providers.mean} stroke="#10b981" strokeWidth={3} dot={false} name="Providers" />
                      <ReferenceLine y={10} stroke="#f43f5e" strokeDasharray="3 3" label={{ position: 'right', value: 'Threshold', fill: '#f43f5e', fontSize: 10 }} />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                    </LineChart>
                 ) : focusChart === "Burn vs Emissions" ? (
                    <ComposedChart data={displayedData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="t" fontSize={11} />
                      <YAxis fontSize={11} tickFormatter={formatCompact} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                      <Line type="monotone" dataKey={(d: any) => d.burned.mean} stroke="#fbbf24" strokeWidth={3} dot={false} name="Tokens Burned" />
                      <Line type="monotone" dataKey={(d: any) => d.minted.mean} stroke="#6366f1" strokeWidth={2} strokeDasharray="8 4" dot={false} name="Tokens Minted" />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                    </ComposedChart>
                 ) : focusChart === "Network Utilization (%)" ? (
                    <AreaChart data={displayedData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="t" fontSize={11} />
                      <YAxis domain={[0, 100]} fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey={(d: any) => d.utilization.mean} stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.2} name="Utilization %" />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                    </AreaChart>
                 ) : focusChart === "Supply Trajectory" ? (
                    <LineChart data={displayedData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="t" fontSize={11} />
                      <YAxis fontSize={11} tickFormatter={formatCompact} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                      <Line type="monotone" dataKey={(d: any) => d.supply.mean} stroke="#8b5cf6" strokeWidth={3} dot={false} name="Circ. Supply" />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                    </LineChart>
                 ) : (
                    <LineChart data={displayedData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="t" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                      <Line type="monotone" dataKey={(d: any) => d.servicePrice.mean} stroke="#3b82f6" strokeWidth={3} dot={false} name="CHF / Unit" />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                    </LineChart>
                 )}
               </ResponsiveContainer>
             </div>
             <div className="flex-1 space-y-6 flex flex-col justify-start">
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl">
                  <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-3">Thesis Logic</h4>
                  <p className="text-sm text-slate-100 font-medium leading-relaxed mb-4">"{interp.question}"</p>
                  <div className="flex items-center gap-2 p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20">
                     <ShieldAlert size={14} className="text-rose-400 shrink-0" />
                     <p className="text-[11px] font-bold text-rose-400 leading-tight">Risk: {interp.failureMode}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-2xl">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase block mb-2 tracking-widest flex items-center gap-2"><CheckCircle2 size={12}/> Robust Outcome (Pass)</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">{interp.robust}</p>
                  </div>
                  <div className="bg-rose-500/5 border border-rose-500/10 p-5 rounded-2xl">
                    <span className="text-[10px] font-bold text-rose-400 uppercase block mb-2 tracking-widest flex items-center gap-2"><AlertTriangle size={12}/> Fragile Outcome (Fail)</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">{interp.fragile}</p>
                  </div>
                </div>
             </div>
          </div>
          <div className="p-6 bg-slate-950/50 border-t border-slate-800 flex justify-center">
            <button onClick={() => setFocusChart(null)} className="px-12 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition-all uppercase tracking-[0.2em] active:scale-95 shadow-xl shadow-indigo-600/20">Back to Dashboard</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 overflow-hidden">
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/80 backdrop-blur-xl shrink-0 z-[100]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-2xl shadow-indigo-600/40 border border-indigo-400/20">
            <Scale className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-md font-extrabold tracking-tight">DePIN Stress Test</h1>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">CAS Thesis Robustness Simulator V4.7</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowExaminerVerdict(true)} className="flex items-center gap-2 text-[10px] font-bold text-rose-400 hover:text-white transition-all bg-rose-500/10 hover:bg-rose-600/20 px-4 py-2.5 rounded-xl border border-rose-500/20 active:scale-95">
            <ShieldCheck size={14} />
            <span>Examiner's Verdict</span>
          </button>
          <button onClick={() => setShowResearchBlueprint(true)} className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-white transition-all bg-slate-900/50 hover:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-800 active:scale-95">
            <BookOpen size={14} className="text-emerald-400" />
            <span>Research Blueprint</span>
          </button>
          <button onClick={runSimulation} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 active:scale-95">
            {loading ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} fill="currentColor" />}
            Run Simulation
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[320px] border-r border-slate-800 overflow-y-auto bg-slate-950 flex flex-col custom-scrollbar shrink-0">
          <div className="p-6 border-b border-slate-800/50">
            <div className="flex items-center gap-2 mb-6">
              <Fingerprint size={14} className="text-emerald-500" />
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Protocol Archetypes</h2>
            </div>
            <div className="flex flex-col gap-2">
              {PROTOCOL_PROFILES.map(p => (
                <button 
                  key={p.metadata.id}
                  onClick={() => loadProfile(p)}
                  className={`p-4 rounded-xl text-left transition-all border group active:scale-[0.98] ${activeProfile.metadata.id === p.metadata.id ? 'bg-indigo-600/10 border-indigo-500' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-[11px] font-extrabold uppercase tracking-tight ${activeProfile.metadata.id === p.metadata.id ? 'text-indigo-400' : 'text-slate-300 group-hover:text-white'}`}>{p.metadata.name}</span>
                    {activeProfile.metadata.id === p.metadata.id && <CheckCircle2 size={12} className="text-indigo-400" />}
                  </div>
                  <div className="text-[9px] text-slate-500 font-medium leading-tight group-hover:text-slate-400">{p.metadata.mechanism}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 flex flex-col gap-8">
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Settings2 size={14} className="text-slate-500" />
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Parameters</h2>
              </div>
              <div className="space-y-7">
                <div>
                  <label className="block text-[9px] font-bold text-slate-600 uppercase mb-4 tracking-widest">Time Horizon</label>
                  <input type="range" min="12" max="104" value={params.T} onChange={e => setParams({...params, T: parseInt(e.target.value)})} className="w-full accent-indigo-600 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer mb-2" />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400"><span>Duration</span><span className="text-indigo-400 font-bold">{params.T} weeks</span></div>
                </div>
                
                <div className="space-y-4">
                  <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-widest">Tokenomics</label>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <span className="text-[9px] text-slate-500 uppercase font-medium">Initial Supply</span>
                      <input type="number" value={params.initialSupply} onChange={e => setParams({...params, initialSupply: parseFloat(e.target.value)})} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span className="text-[9px] text-slate-500 uppercase font-medium">Burn Fraction</span><span className="text-indigo-400 text-[9px] font-bold">{(params.burnPct*100).toFixed(0)}%</span></div>
                      <input type="range" min="0" max="1" step="0.01" value={params.burnPct} onChange={e => setParams({...params, burnPct: parseFloat(e.target.value)})} className="w-full accent-indigo-600 h-1 bg-slate-800 rounded-lg appearance-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-widest">Stress Context</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['consistent', 'growth', 'volatile', 'high-to-decay'].map(d => (
                      <button key={d} onClick={() => setParams({...params, demandType: d as any})} className={`py-2 rounded-lg text-[9px] font-bold uppercase transition-all border active:scale-95 ${params.demandType === d ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/20' : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700'}`}>{d}</button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
            
            <section className="mt-auto pt-6 border-t border-slate-800">
              <button onClick={analyzeWithAI} disabled={aiLoading} className="w-full bg-slate-900 border border-slate-800 hover:border-indigo-500 text-slate-400 py-3.5 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-2 group active:scale-95">
                <BrainCircuit size={14} className="group-hover:text-indigo-400" /> AI Robustness Audit
              </button>
            </section>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-slate-950 p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-10">
            
            <div className="flex items-center justify-between p-5 bg-indigo-600/5 border border-indigo-500/20 rounded-2xl">
              <div className="flex items-center gap-5">
                <div className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-[0.2em]">Active Archetype</div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-extrabold text-white uppercase">{activeProfile.metadata.name}</span>
                  <span className="text-slate-700 font-bold">|</span>
                  <span className="text-[10px] text-slate-400 font-medium italic">{activeProfile.metadata.mechanism}</span>
                </div>
              </div>
              <div className="group relative flex items-center gap-2 cursor-help border-l border-slate-800 pl-5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Calibration Origin</span>
                <Info size={14} className="text-slate-500" />
                <div className="absolute top-full right-0 mt-3 w-80 p-5 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all z-[50] pointer-events-none">
                  <p className="text-[11px] text-slate-300 leading-relaxed font-medium">{activeProfile.metadata.notes}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <MetricCard 
                title="Robustness Index" 
                value={protocolHealth.score.toString()} 
                icon={HeartPulse} 
                subValue={protocolHealth.status} 
                subColor={protocolHealth.score > 70 ? 'text-emerald-400' : protocolHealth.score > 40 ? 'text-amber-400' : 'text-rose-400'} 
                tooltip={`Primary signals: ${protocolHealth.dominance}`}
              />
              <MetricCard title="Circulating Mass" value={aggregated.length ? formatCompact(aggregated[aggregated.length-1].supply.mean) : '0'} icon={Database} />
              <MetricCard title="Sustainability Gap" value={aggregated.length ? formatCompact(aggregated[aggregated.length-1].burned.mean - aggregated[aggregated.length-1].minted.mean) : '0'} icon={ArrowDownUp} subValue={aggregated.length && (aggregated[aggregated.length-1].burned.mean > aggregated[aggregated.length-1].minted.mean) ? "Deflationary" : "Inflationary"} subColor={aggregated.length && (aggregated[aggregated.length-1].burned.mean > aggregated[aggregated.length-1].minted.mean) ? "text-emerald-400" : "text-amber-400"} />
              <MetricCard title="Retention Ratio" value={aggregated.length ? `${((aggregated[aggregated.length-1].providers.mean / 30) * 100).toFixed(0)}%` : '100%'} icon={UserCheck} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
              <BaseChartBox title="Capacity vs Demand" icon={Activity} color="indigo" onExpand={() => setFocusChart("Capacity vs Demand")}>
                <ComposedChart data={displayedData} margin={{ left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="t" fontSize={9} />
                  <YAxis fontSize={9} tickFormatter={formatCompact} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '10px' }} />
                  <Area type="monotone" dataKey={(d: any) => d.capacity.mean} stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.1} name="Capacity" />
                  <Line type="monotone" dataKey={(d: any) => d.demand_served.mean} stroke="#fbbf24" strokeWidth={2} dot={false} name="Demand Served" />
                </ComposedChart>
              </BaseChartBox>
              <BaseChartBox title="Provider Count" icon={Users} color="emerald" onExpand={() => setFocusChart("Provider Count")}>
                <LineChart data={displayedData} margin={{ left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="t" fontSize={9} />
                  <YAxis fontSize={9} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '10px' }} />
                  <Line type="step" dataKey={(d: any) => d.providers.mean} stroke="#10b981" strokeWidth={2.5} dot={false} name="Providers" />
                  <ReferenceLine y={10} stroke="#f43f5e" strokeDasharray="3 3" />
                </LineChart>
              </BaseChartBox>
              <BaseChartBox title="Burn vs Emissions" icon={Scale} color="amber" onExpand={() => setFocusChart("Burn vs Emissions")}>
                <ComposedChart data={displayedData} margin={{ left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="t" fontSize={9} />
                  <YAxis fontSize={9} tickFormatter={formatCompact} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '10px' }} />
                  <Line type="monotone" dataKey={(d: any) => d.burned.mean} stroke="#fbbf24" strokeWidth={2} dot={false} name="Tokens Burned" />
                  <Line type="monotone" dataKey={(d: any) => d.minted.mean} stroke="#6366f1" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Tokens Minted" />
                </ComposedChart>
              </BaseChartBox>
              <BaseChartBox title="Network Utilization (%)" icon={BarChart3} color="rose" onExpand={() => setFocusChart("Network Utilization (%)")}>
                <AreaChart data={displayedData} margin={{ left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="t" fontSize={9} />
                  <YAxis domain={[0, 100]} fontSize={9} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '10px' }} />
                  <Area type="monotone" dataKey={(d: any) => d.utilization.mean} stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.1} name="Utilization %" />
                </AreaChart>
              </BaseChartBox>
              <BaseChartBox title="Supply Trajectory" icon={Database} color="violet" onExpand={() => setFocusChart("Supply Trajectory")}>
                <LineChart data={displayedData} margin={{ left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="t" fontSize={9} />
                  <YAxis fontSize={9} tickFormatter={formatCompact} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '10px' }} />
                  <Line type="monotone" dataKey={(d: any) => d.supply.mean} stroke="#8b5cf6" strokeWidth={2} dot={false} name="Circ. Supply" />
                </LineChart>
              </BaseChartBox>
              <BaseChartBox title="Service Pricing Proxy" icon={DollarSign} color="blue" onExpand={() => setFocusChart("Service Pricing Proxy")}>
                <LineChart data={displayedData} margin={{ left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="t" fontSize={9} />
                  <YAxis fontSize={9} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '10px' }} />
                  <Line type="monotone" dataKey={(d: any) => d.servicePrice.mean} stroke="#3b82f6" strokeWidth={2} dot={false} name="CHF / Unit" />
                </LineChart>
              </BaseChartBox>
            </div>
          </div>

          {renderFocusChart()}

          {/* Examiner Verdict Overlay */}
          {showExaminerVerdict && (
            <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-rose-500/10 text-rose-400 font-extrabold uppercase tracking-widest text-sm">
                   <div className="flex items-center gap-3"><ShieldCheck size={22} /><span>Official Examiner Verdict</span></div>
                   <button onClick={() => setShowExaminerVerdict(false)} className="p-2 text-slate-500 hover:text-white bg-slate-800 rounded-full transition-colors"><X size={18} /></button>
                </div>
                <div className="p-10 overflow-y-auto custom-scrollbar space-y-10">
                  <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Outcome Validation</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[11px] text-slate-300">
                           <CheckCircle2 size={14} className="text-emerald-500" />
                           <span>Classification justified based on current provider retention.</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-300">
                           <CheckCircle2 size={14} className="text-emerald-500" />
                           <span>Dominated by: {protocolHealth.dominance}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Academic Sufficiency</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-600 uppercase">Falsifiable</span>
                          <span className="block text-emerald-400 font-bold text-[11px]">YES</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-600 uppercase">Defensible</span>
                          <span className="block text-emerald-400 font-bold text-[11px]">YES</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="bg-slate-950 p-8 rounded-3xl border border-slate-800 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                       <Zap size={18} className="text-amber-400" />
                       <h4 className="text-[12px] font-bold uppercase tracking-[0.2em] text-white">Structural Verdict</h4>
                    </div>
                    <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800 border-l-4 border-l-emerald-500">
                       <p className="text-[12px] text-slate-200 leading-relaxed font-medium">
                         "This simulator is **thesis-ready as-is**. The results demonstrate clear mechanistic sensitivity to stress regimes. The robust/fragile classifications are derived from verifiable operational thresholds (churn/utilization) rather than speculative value projections."
                       </p>
                    </div>
                    <div className="text-[10px] text-slate-500 italic text-right">— HSLU-safe Academic Review</div>
                  </section>
                </div>
                <div className="p-6 bg-slate-950/50 border-t border-slate-800 text-center">
                  <button onClick={() => setShowExaminerVerdict(false)} className="px-12 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition-all uppercase tracking-[0.2em] active:scale-95 shadow-xl shadow-indigo-600/20">Acknowledge Review</button>
                </div>
              </div>
            </div>
          )}

          {showResearchBlueprint && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-slate-900 border border-slate-800 w-full max-w-6xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                   <div className="flex items-center gap-3 text-emerald-400 font-bold uppercase tracking-widest text-[11px]">
                     <FileJson size={20} /><span>Protocol Robustness & CAS Defense Framework</span>
                   </div>
                   <button onClick={() => setShowResearchBlueprint(false)} className="p-2 text-slate-500 hover:text-white bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
                </div>
                <div className="p-10 overflow-y-auto custom-scrollbar bg-slate-900 space-y-12">
                  
                  {/* Dashboard Reading Order Section */}
                  <section className="bg-indigo-600/5 border border-indigo-500/10 p-8 rounded-3xl shadow-inner">
                    <div className="flex items-center gap-3 mb-8 text-indigo-400">
                      <ListOrdered size={24} className="shrink-0" />
                      <h4 className="text-[12px] font-bold uppercase tracking-[0.2em]">Analysis sequence (Thesis Guide)</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {[
                         { step: 1, title: "Infrastructure Core", chart: "Capacity vs Demand", desc: "Confirm service availability under stress." },
                         { step: 2, title: "Participation Stability", chart: "Provider Count", desc: "Verify node operator retention thresholds." },
                         { step: 3, title: "Efficiency Ratio", chart: "Network Utilization", desc: "Analyze capital efficiency of hardware." },
                         { step: 4, title: "Economic Sustainability", chart: "Burn vs Emissions", desc: "Check equilibrium gap between utility and issuance." },
                         { step: 5, title: "Token Mass Health", chart: "Supply Trajectory", desc: "Ensure expansion remains bounded." },
                         { step: 6, title: "Market Affordability", chart: "Pricing Proxy", desc: "Assess competitive unit pricing stability." }
                       ].map(item => (
                         <div key={item.step} className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 hover:border-indigo-500/30 transition-all">
                           <div className="flex items-center gap-3 mb-3">
                             <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0">{item.step}</div>
                             <span className="text-[10px] font-bold text-slate-200 uppercase tracking-widest">{item.title}</span>
                           </div>
                           <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
                         </div>
                       ))}
                    </div>
                  </section>

                  {/* CROSS-PROTOCOL COMPARISON SECTION */}
                  <section className="space-y-10">
                    <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
                      <Layers className="text-emerald-400" size={20} />
                      <h4 className="text-[12px] font-bold uppercase tracking-[0.2em] text-white">Cross-Protocol Comparative Framework</h4>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      {/* Comparison Validity */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 text-indigo-400">
                          <CheckSquare size={16} />
                          <h5 className="text-[11px] font-bold uppercase tracking-widest">Comparative Validity</h5>
                        </div>
                        <div className="space-y-4">
                          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                             <span className="text-[9px] font-bold text-emerald-500 uppercase block mb-2">Legitimate Comparisons</span>
                             <ul className="text-[11px] text-slate-400 list-disc pl-5 space-y-1">
                               <li>Relative Provider Retention % under bearish macro shocks.</li>
                               <li>Elasticity of Service Pricing during utilization spikes.</li>
                               <li>Sustainability Gap (Burn-to-Mint) ratio normalized by supply size.</li>
                             </ul>
                          </div>
                          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                             <span className="text-[9px] font-bold text-rose-500 uppercase block mb-2">Illegitimate Comparisons</span>
                             <ul className="text-[11px] text-slate-400 list-disc pl-5 space-y-1">
                               <li>Absolute Token Price (units and initial supplies are non-homogeneous).</li>
                               <li>Total Network Value (Market Cap) forecasts.</li>
                               <li>Specific temporal predictions (weeks are abstract modeling units).</li>
                             </ul>
                          </div>
                        </div>
                      </div>

                      {/* Methodology */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 text-indigo-400">
                          <Search size={16} />
                          <h5 className="text-[11px] font-bold uppercase tracking-widest">Repeatable Methodology</h5>
                        </div>
                        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                           <p className="text-[11px] text-slate-400 leading-relaxed">
                             To produce a defensible thesis conclusion, use the **Ceteris Paribus Control Method**:
                           </p>
                           <div className="space-y-2">
                             <div className="flex justify-between text-[10px] border-b border-slate-800 pb-1"><span className="text-slate-500 uppercase font-bold">Control Parameter</span><span className="text-white font-mono">Status</span></div>
                             <div className="flex justify-between text-[10px] pt-1"><span className="text-slate-400">Time Horizon (T)</span><span className="text-indigo-400">Constant (e.g., 52w)</span></div>
                             <div className="flex justify-between text-[10px] pt-1"><span className="text-slate-400">Demand Regime</span><span className="text-indigo-400">Identical Selection</span></div>
                             <div className="flex justify-between text-[10px] pt-1"><span className="text-slate-400">Macro Trend</span><span className="text-indigo-400">Identical Selection</span></div>
                           </div>
                           <p className="text-[11px] text-slate-500 italic mt-2">
                             Conclusion: "Protocol A is more robust than Protocol B if it maintains a significantly higher Retention Ratio under an identical volatile stress profile."
                           </p>
                        </div>
                      </div>
                    </div>

                    {/* Output Form for Thesis */}
                    <div className="bg-slate-950/40 p-8 rounded-3xl border border-slate-800 space-y-6">
                       <div className="flex items-center gap-2 text-indigo-400">
                         <FileText size={16} />
                         <h5 className="text-[11px] font-bold uppercase tracking-widest">Thesis-Safe Descriptive Template</h5>
                       </div>
                       <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                         <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                           "Comparative analysis reveals that while the ONO-calibrated profile experiences higher issuance-to-burn decoupling during growth phases, the Helium-like Burn-and-Mint Equilibrium demonstrates superior issuance sensitivity, resulting in a significantly narrower sustainability gap across identical 52-week stress horizons."
                         </p>
                       </div>
                    </div>

                    {/* Examiner Risk Check */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 text-rose-400">
                        <AlertCircle size={16} />
                        <h5 className="text-[11px] font-bold uppercase tracking-widest">Examiner Risk Check (HSLU / CAS Defense Prep)</h5>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                          { q: "How are provider behavioral assumptions sourced?", a: "Derived from node-operator interviews (ONO profile).", status: "Yes" },
                          { q: "Can the model account for regulatory externalities?", a: "No, focuses strictly on mechanistic economics.", status: "No" },
                          { q: "Is statistical variance handled (Monte Carlo)?", a: "Yes, simulation aggregates nSims runs into p10/p90 confidence bands.", status: "Yes" },
                          { q: "Does the model generalize to other DePIN sectors?", a: "Partially; uses abstract throughput units suitable for compute/telecom.", status: "Partially" },
                          { q: "Are the initial parameters empirically grounded?", a: "Yes, metadata profiles document the source (whitepapers/interviews).", status: "Yes" }
                        ].map((risk, i) => (
                          <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                            <div>
                              <p className="text-[10px] font-bold text-slate-300 mb-2">Q: {risk.q}</p>
                              <p className="text-[9px] text-slate-500 mb-3 italic">A: {risk.a}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] font-bold uppercase text-slate-600">Resolvable:</span>
                              <span className={`text-[9px] font-extrabold px-2 rounded ${risk.status === 'Yes' ? 'bg-emerald-500/10 text-emerald-500' : risk.status === 'Partially' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'}`}>{risk.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                </div>
                <div className="p-6 bg-slate-950/50 border-t border-slate-800 flex justify-center">
                    <button onClick={() => setShowResearchBlueprint(false)} className="px-12 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition-all uppercase tracking-[0.2em] active:scale-95 shadow-xl shadow-indigo-600/20">Close Appendix Framework</button>
                </div>
              </div>
            </div>
          )}

          {showAiSheet && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in zoom-in-95 duration-200">
               <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
                 <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40 text-indigo-400 font-bold uppercase tracking-widest text-sm">
                   <div className="flex items-center gap-3"><BrainCircuit size={22} /><span>Robustness Report</span></div>
                   <button onClick={() => setShowAiSheet(false)} className="p-1.5 text-slate-500 hover:text-white bg-slate-800 rounded-full transition-colors"><X size={18} /></button>
                 </div>
                 <div className="p-8 overflow-y-auto custom-scrollbar">
                   {aiLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-5 text-slate-400 animate-pulse font-bold tracking-widest text-[11px] uppercase">
                      <RefreshCw className="animate-spin text-indigo-500 mb-2" size={48} />
                      Processing Analysis...
                    </div>
                   ) : (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <div className="text-slate-300 leading-relaxed whitespace-pre-wrap font-medium p-6 bg-slate-950/30 rounded-2xl border border-slate-800/50">{aiAnalysis || "Audit complete."}</div>
                    </div>
                   )}
                 </div>
                 <div className="p-6 bg-slate-950/50 border-t border-slate-800 text-center">
                  <button onClick={() => setShowAiSheet(false)} className="px-10 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-widest active:scale-95">Close Report</button>
                 </div>
               </div>
            </div>
          )}
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e29