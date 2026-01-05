
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
  ReferenceLine
} from 'recharts';
import { 
  Play, 
  Settings2, 
  TrendingUp, 
  Activity, 
  Database, 
  Users, 
  Zap, 
  DollarSign, 
  Info,
  RefreshCw,
  AlertTriangle,
  BrainCircuit,
  Menu,
  X,
  ShieldCheck,
  ZapOff,
  Plus,
  Trash2,
  Save,
  Clock,
  ChevronDown,
  LayoutDashboard
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
type EventType = 'demand_shock' | 'price_shock' | 'burn_change';

interface ProtocolEvent {
  id: string;
  week: number;
  type: EventType;
  value: number; 
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
  events: ProtocolEvent[];
}

interface SimResult {
  t: number;
  price: number;
  supply: number;
  demand: number;
  providers: number;
  capacity: number;
  servicePrice: number;
  minted: number;
  burned: number;
}

interface AggregateResult {
  t: number;
  price: { mean: number; p10: number; p90: number };
  supply: { mean: number; p10: number; p90: number };
  demand: { mean: number; p10: number; p90: number };
  providers: { mean: number; p10: number; p90: number };
  capacity: { mean: number; p10: number; p90: number };
  servicePrice: { mean: number; p10: number; p90: number };
  minted: { mean: number };
  burned: { mean: number };
}

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
          providerCostPerWeek, baseCapacityPerProvider, kDemandPrice, kMintPrice, events } = params;

  let mu = 0.002, sigma = 0.05;
  if (macro === 'bearish') { mu = -0.01; sigma = 0.06; }
  else if (macro === 'bullish') { mu = 0.015; sigma = 0.06; }

  const demands = getDemandSeries(T, 12000, demandType, rng);
  const results: SimResult[] = [];

  let currentSupply = initialSupply;
  let currentPrice = initialPrice;
  let currentProviders = 20;
  let currentServicePrice = 0.5;
  let effectiveBurnPct = burnPct;

  for (let t = 0; t < T; t++) {
    const activeEvents = events.filter(e => e.week === t);
    activeEvents.forEach(e => {
      if (e.type === 'demand_shock') demands[t] *= e.value;
      if (e.type === 'price_shock') currentPrice *= e.value;
      if (e.type === 'burn_change') effectiveBurnPct = e.value;
    });

    const demand = demands[t];
    const capacity = currentProviders * baseCapacityPerProvider;
    const scarcity = (demand - capacity) / Math.max(capacity, 1.0);
    
    currentServicePrice = Math.min(Math.max(currentServicePrice * (1 + 0.8 * scarcity), 0.05), 5.0);
    const tokensSpent = (demand * currentServicePrice) / Math.max(currentPrice, 1e-9);
    const burned = effectiveBurnPct * tokensSpent;
    const demandFactor = Math.tanh(demand / 15000.0);
    const minted = Math.min(maxMintWeekly, maxMintWeekly * (0.6 + 0.6 * demandFactor));

    currentSupply = Math.max(1.0, currentSupply + minted - burned);
    const rewardPerProviderValue = (minted / Math.max(currentProviders, 1.0)) * currentPrice;
    const joinProb = 1 / (1 + Math.exp(-(rewardPerProviderValue - providerCostPerWeek) / 5));
    const delta = (joinProb - 0.5) * 6 + rng.normal() * 0.6;
    
    const demandPressure = kDemandPrice * Math.tanh(scarcity);
    const dilutionPressure = -kMintPrice * (minted / Math.max(currentSupply, 1.0)) * 100;
    const logRet = mu + demandPressure + dilutionPressure + sigma * rng.normal();
    const nextPrice = Math.max(0.01, currentPrice * Math.exp(logRet));

    results.push({
      t, price: currentPrice, supply: currentSupply, demand,
      providers: currentProviders, capacity, servicePrice: currentServicePrice,
      minted, burned
    });

    currentPrice = nextPrice;
    currentProviders = Math.max(1, currentProviders + delta);
  }
  return results;
}

const App: React.FC = () => {
  const [params, setParams] = useState<SimulationParams>({
    T: 52, initialSupply: 1000000, initialPrice: 3.0, maxMintWeekly: 3500, burnPct: 0.5,
    demandType: 'consistent', macro: 'bearish', nSims: 150, seed: 42,
    providerCostPerWeek: 15.0, baseCapacityPerProvider: 180.0, kDemandPrice: 0.15, kMintPrice: 0.35,
    events: []
  });

  const [aggregated, setAggregated] = useState<AggregateResult[]>([]);
  const [baseline, setBaseline] = useState<AggregateResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [playbackMode, setPlaybackMode] = useState(false);
  const [playbackWeek, setPlaybackWeek] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAiSheet, setShowAiSheet] = useState(false);

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
      const keys: (keyof SimResult)[] = ['price', 'supply', 'demand', 'providers', 'capacity', 'servicePrice', 'minted', 'burned'];
      
      for (let t = 0; t < params.T; t++) {
        const step: any = { t };
        keys.forEach(key => {
          const values = allSims.map(sim => sim[t][key] as number).sort((a, b) => a - b);
          const mean = values.reduce((a, b) => a + b, 0) / values.length;
          const p10 = values[Math.floor(values.length * 0.1)];
          const p90 = values[Math.floor(values.length * 0.9)];
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

  const analyzeWithAI = async () => {
    if (!aggregated.length) return;
    setAiLoading(true);
    setShowAiSheet(true);
    try {
      const last = aggregated[aggregated.length - 1];
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Protocol Analyst Report. Parameters: Initial Price $${params.initialPrice}, Burn ${params.burnPct*100}%. Resulting mean price $${last.price.mean.toFixed(2)}. Is this sustainable? Give a 'Protocol Health Score' (0-100) and identify key risks like 'Death Spiral' or 'Supply Hyperinflation'. Keep it professional.`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setAiAnalysis(response.text);
    } catch (e) {
      setAiAnalysis("Error: Check API connectivity.");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => { runSimulation(); return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, []);

  const displayedData = useMemo(() => aggregated.slice(0, playbackWeek), [aggregated, playbackWeek]);
  
  const protocolHealth = useMemo(() => {
    if (!aggregated.length) return { status: 'STABLE', score: 100 };
    const last = aggregated[aggregated.length - 1];
    const drop = last.price.mean / params.initialPrice;
    if (drop < 0.2) return { status: 'CRITICAL', score: 12 };
    if (drop < 0.6) return { status: 'AT RISK', score: 48 };
    return { status: 'STABLE', score: 88 };
  }, [aggregated, params]);

  const formatNum = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  const formatCompact = (n: number) => n.toLocaleString(undefined, { notation: 'compact', maximumFractionDigits: 1 });

  const MetricCard = ({ title, value, subValue, subColor }: { title: string; value: string; subValue?: string; subColor?: string }) => (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
      <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">{title}</div>
      <div className="flex items-baseline gap-2">
        <div className="text-3xl font-bold text-white">{value}</div>
        {subValue && <div className={`text-xs font-semibold ${subColor || 'text-rose-400'}`}>{subValue}</div>}
      </div>
    </div>
  );

  const ChartBox = ({ title, dataKey, icon: Icon, color }: { title: string; dataKey: keyof AggregateResult; icon: any; color: string }) => (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col h-[320px] shadow-sm relative overflow-hidden">
      <div className="flex items-center gap-2 mb-6 z-10">
        <div className={`p-2 rounded-lg bg-slate-950/50 text-${color}-400`}>
          <Icon size={18} />
        </div>
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      </div>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={displayedData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color === 'blue' ? '#3b82f6' : color === 'emerald' ? '#10b981' : color === 'rose' ? '#f43f5e' : color === 'amber' ? '#f59e0b' : color === 'violet' ? '#8b5cf6' : '#64748b'} stopOpacity={0.25}/>
                <stop offset="95%" stopColor={color === 'blue' ? '#3b82f6' : color === 'emerald' ? '#10b981' : color === 'rose' ? '#f43f5e' : color === 'amber' ? '#f59e0b' : color === 'violet' ? '#8b5cf6' : '#64748b'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="t" stroke="#334155" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#334155" fontSize={10} tickLine={false} axisLine={false} tickFormatter={formatCompact} />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
            {baseline && <Line type="monotone" data={baseline.slice(0, playbackWeek)} dataKey={(d: any) => d[dataKey].mean} stroke="#475569" strokeWidth={1} strokeDasharray="4 4" dot={false} />}
            <Area type="monotone" dataKey={(d: any) => d[dataKey].p90} stroke="none" fill={`url(#grad-${dataKey})`} baseLine={(d: any) => d[dataKey].p10} />
            <Line type="monotone" dataKey={(d: any) => d[dataKey].mean} stroke={color === 'blue' ? '#3b82f6' : color === 'emerald' ? '#10b981' : color === 'rose' ? '#f43f5e' : color === 'amber' ? '#f59e0b' : color === 'violet' ? '#8b5cf6' : '#64748b'} strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-[100]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Activity className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">DePIN Stress Test</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Protocol Simulator V2.7</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-900 px-4 py-2 rounded-full border border-slate-800">
            <Info size={14} className="text-blue-400" />
            <span>Illustrative stress-testing • Not financial advice</span>
          </div>
          <button onClick={runSimulation} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2">
            {loading ? <RefreshCw className="animate-spin" size={18} /> : <Play size={18} fill="currentColor" />}
            Run Simulation
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[300px] border-r border-slate-800 p-6 overflow-y-auto bg-slate-950 flex flex-col gap-8 custom-scrollbar">
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Settings2 size={16} className="text-slate-400" />
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Parameters</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-3">Time Horizon</label>
                <input type="range" min="12" max="104" value={params.T} onChange={e => setParams({...params, T: parseInt(e.target.value)})} className="w-full accent-blue-600 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer mb-2" />
                <div className="flex justify-between text-[11px] font-mono"><span className="text-slate-500">Duration</span><span className="text-blue-400">{params.T} weeks</span></div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-3">Tokenomics</label>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-600 uppercase">Initial Supply</span>
                    <input type="number" value={params.initialSupply} onChange={e => setParams({...params, initialSupply: parseFloat(e.target.value)})} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono focus:border-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-600 uppercase">Initial Price ($)</span>
                    <input type="number" value={params.initialPrice} onChange={e => setParams({...params, initialPrice: parseFloat(e.target.value)})} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono focus:border-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between"><span className="text-[10px] text-slate-600 uppercase">Burn Pct</span><span className="text-blue-400 text-[10px] font-mono">{(params.burnPct*100).toFixed(0)}%</span></div>
                    <input type="range" min="0" max="1" step="0.01" value={params.burnPct} onChange={e => setParams({...params, burnPct: parseFloat(e.target.value)})} className="w-full accent-blue-600 h-1 bg-slate-800 rounded-lg appearance-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-3">Environment</label>
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] text-slate-600 uppercase mb-2 block">Demand Regime</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {['consistent', 'growth', 'volatile', 'high-to-decay'].map(d => (
                        <button key={d} onClick={() => setParams({...params, demandType: d as any})} className={`py-2 rounded-lg text-[9px] font-bold uppercase transition-all ${params.demandType === d ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-300'}`}>{d.replace('-',' ')}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-600 uppercase mb-2 block">Macro Condition</span>
                    <div className="flex gap-1.5">
                      {['bearish', 'sideways', 'bullish'].map(m => (
                        <button key={m} onClick={() => setParams({...params, macro: m as any})} className={`flex-1 py-2 rounded-lg text-[9px] font-bold uppercase transition-all border ${params.macro === m ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}>{m}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-auto border-t border-slate-800 pt-6 space-y-4">
            <button onClick={analyzeWithAI} disabled={aiLoading} className="w-full bg-slate-900 border border-slate-800 hover:border-indigo-500 hover:bg-indigo-500/5 text-slate-400 hover:text-indigo-400 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
              <BrainCircuit size={16} /> AI RISK ASSESSMENT
            </button>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-3 text-center">Simulation Quality</label>
              <input type="range" min="50" max="500" step="50" value={params.nSims} onChange={e => setParams({...params, nSims: parseInt(e.target.value)})} className="w-full accent-blue-600 h-1 bg-slate-800 rounded-lg appearance-none" />
              <div className="text-center text-[10px] font-mono text-slate-500 mt-2">{params.nSims} Monte Carlo Runs</div>
            </div>
          </section>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-8 custom-scrollbar relative">
          
          {/* Top Metric Grid - RESTORED V2.4 LOOK */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <MetricCard 
              title="Final Price (Mean)" 
              value={`$${aggregated.length ? formatNum(aggregated[aggregated.length-1].price.mean) : '0.00'}`} 
              subValue={aggregated.length ? `${((aggregated[aggregated.length-1].price.mean/params.initialPrice-1)*100).toFixed(1)}%` : ''} 
              subColor={aggregated.length && aggregated[aggregated.length-1].price.mean >= params.initialPrice ? 'text-emerald-400' : 'text-rose-400'}
            />
            <MetricCard 
              title="Final Supply" 
              value={aggregated.length ? formatCompact(aggregated[aggregated.length-1].supply.mean) : '0'} 
            />
            <MetricCard 
              title="Network Capacity" 
              value={aggregated.length ? formatCompact(aggregated[aggregated.length-1].capacity.mean) : '0'} 
            />
            <MetricCard 
              title="Avg Service Price" 
              value={`$${aggregated.length ? formatNum(aggregated[aggregated.length-1].servicePrice.mean) : '0.00'}`} 
            />
          </div>

          {/* Feature Toolbar (v2.6) */}
          <div className="flex items-center justify-between mb-8 bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 border-r border-slate-800 pr-6">
                <span className="text-[10px] font-bold uppercase text-slate-500">Analysis</span>
                <div className={`px-2 py-1 rounded text-[10px] font-bold ${protocolHealth.status === 'STABLE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                   PROTOCOL {protocolHealth.status}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => setPlaybackMode(!playbackMode)} className={`flex items-center gap-2 text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg border transition-all ${playbackMode ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-800 text-slate-500 hover:text-slate-300'}`}>
                  <Clock size={12} /> Playback
                </button>
                <button onClick={() => setBaseline([...aggregated])} className="flex items-center gap-2 text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg border border-slate-800 text-slate-500 hover:text-slate-300 transition-all">
                  <Save size={12} /> Set Baseline
                </button>
              </div>
            </div>
            {playbackMode && (
              <div className="flex-1 max-w-xs mx-10">
                <div className="h-1 w-full bg-slate-800 rounded-full relative">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-75" style={{ width: `${(playbackWeek/params.T)*100}%` }} />
                </div>
              </div>
            )}
            <div className="text-[10px] font-mono text-slate-500">Week {playbackWeek} / {params.T}</div>
          </div>

          {/* Charts Grid - RESTORED V2.4 GRID */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <ChartBox title="Token Price Over Time" dataKey="price" icon={DollarSign} color="blue" />
            <ChartBox title="Token Supply Over Time" dataKey="supply" icon={Database} color="violet" />
            <ChartBox title="Service Demand Over Time" dataKey="demand" icon={TrendingUp} color="emerald" />
            <ChartBox title="Total Network Capacity" dataKey="capacity" icon={Zap} color="amber" />
          </div>

          {/* AI Assessment Overlay */}
          {showAiSheet && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
               <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
                 <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                   <div className="flex items-center gap-3 text-indigo-400">
                     <BrainCircuit size={24} />
                     <h3 className="text-lg font-bold">Gemini AI Protocol Audit</h3>
                   </div>
                   <button onClick={() => setShowAiSheet(false)} className="text-slate-500 hover:text-white transition-colors">
                     <X size={24} />
                   </button>
                 </div>
                 <div className="p-8 overflow-y-auto custom-scrollbar">
                   {aiLoading ? (
                     <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <RefreshCw className="animate-spin text-indigo-500" size={40} />
                        <p className="text-slate-400 animate-pulse font-medium">Gemini is processing network telemetry...</p>
                     </div>
                   ) : (
                     <div className="prose prose-invert prose-sm max-w-none">
                        <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{aiAnalysis || "Simulation complete. Request analysis to view audit."}</p>
                     </div>
                   )}
                 </div>
                 <div className="p-6 bg-slate-950/50 border-t border-slate-800 text-center">
                    <button onClick={() => setShowAiSheet(false)} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-bold transition-all">Close Report</button>
                 </div>
               </div>
            </div>
          )}

        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
        
        input[type="range"]::-webkit-slider-thumb {
          height: 18px; width: 18px; border-radius: 50%; background: #3b82f6;
          border: 3px solid #0f172a; box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          -webkit-appearance: none; margin-top: -7px; transition: all 0.2s;
        }
        input[type="range"]:active::-webkit-slider-thumb { transform: scale(1.1); }
      `}</style>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
