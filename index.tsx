
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceLine, ComposedChart, Bar, Cell, ReferenceArea } from 'recharts';
import { FlywheelWidget } from './src/components/FlywheelWidget';
import { TokenomicsStudy } from './src/components/CaseStudy/TokenomicsStudy';
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
  Zap,
  Power,
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
  ShieldQuestion,
  TrendingDown,
  TrendingUp,
  Target,
  Waves,
  Library,
  Stethoscope,
  FlameKindling,
  Flame,
  Shield,
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
  Swords,
  Infinity as InfinityIcon,
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { ThesisDashboard } from './src/components/ThesisDashboard';

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
import { SCENARIOS, SimulationScenario } from './src/data/scenarios';
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

// SeededRNG moved to src/model/rng.ts

// Types
// Types moved to model or data
// ViewMode imported from src/model/types

import { CHART_INTERPRETATIONS } from './src/data/chartInterpretations';
import { REGIME_KNOWLEDGE } from './src/data/regimeKnowledge';
import MetricCard from './src/components/ui/MetricCard';
import BaseChartBox from './src/components/ui/BaseChartBox';
import { SolanaVerifier, type NetworkStatus } from './src/model/solana';
import FormulaDisplay from './src/components/ui/FormulaDisplay';
import ParamLabel from './src/components/ui/ParamLabel';
import { HeaderDropdown, DropdownItem, DropdownToggle, DropdownDivider } from './src/components/ui/HeaderDropdown';
import { CollapsibleSection } from './src/components/ui/CollapsibleSection';
import { LegacySimulationParams as SimulationParams, LegacySimResult as SimResult, LegacyAggregateResult as AggregateResult, simulateOne, getDemandSeries } from './src/model/legacy/engine';
import { SeededRNG } from './src/model/rng';
// types
import { ViewMode, MetricStats } from './src/model/types';





// Extracted components and logic moved to src/components/ui and src/model/legacy

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('sandbox');
  const [selectedProtocolIds, setSelectedProtocolIds] = useState<string[]>([PROTOCOL_PROFILES[0].metadata.id]);
  const [activeProfile, setActiveProfile] = useState<ProtocolProfileV1>(PROTOCOL_PROFILES[0]);

  // Sidebar UI state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    stress: false,       // Primary control section - open by default
    competitive: false,  // Module 4: Competitive Resilience - open by default
    scenarios: true,     // Academic presets - collapsed
    tokenomics: true,    // Secondary - collapsed
    advanced: true,      // Combined Economics + Simulation - collapsed
    providers: true,     // Legacy key - keep for backwards compat
    simulation: true,    // Legacy key - keep for backwards compat
  });

  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  // Comparison view state
  const [normalizeCharts, setNormalizeCharts] = useState(false);
  const [comparisonMetric, setComparisonMetric] = useState<'providers' | 'price' | 'solvencyScore' | 'utilization' | 'minted' | 'burned'>('providers');
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
    nSims: 25,
    seed: 42,
    providerCostPerWeek: PROTOCOL_PROFILES[0].parameters.provider_economics.opex_weekly.value,
    baseCapacityPerProvider: 180.0,
    hardwareCost: 800, // Default to Prosumer
    kDemandPrice: 0.15,
    kMintPrice: 0.35,
    rewardLagWeeks: PROTOCOL_PROFILES[0].parameters.adjustment_lag.value,
    churnThreshold: PROTOCOL_PROFILES[0].parameters.provider_economics.churn_threshold.value,
    initialLiquidity: 50000,
    investorUnlockWeek: 26,
    investorSellPct: 0.15,
    // Module 4: Competitive Resilience (Risk Engine)
    competitorYield: 0.0,  // 0% competitor advantage
    emissionModel: 'fixed',
    revenueStrategy: 'burn',
  });

  const [aggregated, setAggregated] = useState<AggregateResult[]>([]);
  const [multiAggregated, setMultiAggregated] = useState<Record<string, AggregateResult[]>>({});
  const [loading, setLoading] = useState(false);
  const [autoRun, setAutoRun] = useState(true);
  const [playbackWeek, setPlaybackWeek] = useState(52);

  // Auto-run simulation when params change, debounced
  useEffect(() => {
    if (autoRun && viewMode === 'sandbox') {
      const timer = setTimeout(() => {
        runSimulation();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [params, autoRun, viewMode]);

  // Re-initialize state specific to simulation run
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
  const [showDePINBrowser, setShowDePINBrowser] = useState(false);
  const [onChainMetrics, setOnChainMetrics] = useState<Record<string, OnChainMetrics>>({});
  const [activeTab, setActiveTab] = useState<'simulator' | 'thesis'>('simulator');
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    // 1. Load Protocol Cache
    const cached = loadFromLocalStorage();
    if (cached.data && cached.timestamp) {
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

    // 2. Load Mock Chain Metrics
    setOnChainMetrics({
      'ono_v3_calibrated': getMockOnChainMetrics('onocoy'),
      'helium_bme_v1': getMockOnChainMetrics('helium'),
      'adaptive_elastic_v1': getMockOnChainMetrics('render'),
    });

    // 3. Fetch Real Solana Status (Proof of Reality)
    SolanaVerifier.getNetworkStatus().then(status => {
      setNetworkStatus(status);
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
          initialProviders: profile.parameters.initial_active_providers.value,
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
          seed: params.seed,

          // Module 4: Competitive Resilience
          competitorYield: params.competitorYield,
          emissionModel: params.emissionModel,
          revenueStrategy: params.revenueStrategy,
          hardwareCost: params.hardwareCost,
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
            weightedCoverage: r.weightedCoverage,
            treasuryBalance: r.treasuryBalance || { mean: 0, p10: 0, p90: 0 },
            vampireChurn: r.vampireChurn || { mean: 0, p10: 0, p90: 0 }
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
          const keys: (keyof SimResult)[] = ['price', 'supply', 'demand', 'demand_served', 'providers', 'capacity', 'servicePrice', 'minted', 'burned', 'utilization', 'profit', 'scarcity', 'incentive', 'solvencyScore', 'netDailyLoss', 'dailyMintUsd', 'dailyBurnUsd', 'treasuryBalance', 'vampireChurn'];

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

  // Reset to default parameters
  const resetToDefaults = () => {
    // 1. Reset profile-specific params
    loadProfile(activeProfile);

    // 2. Reset scenario/structural params
    setParams(prev => ({
      ...prev,
      scenario: 'baseline',
      macro: 'bearish',
      demandType: activeProfile.parameters.demand_regime.value,
      nSims: 25,
      competitorYield: 0.0,
      emissionModel: 'fixed',
      revenueStrategy: 'burn',
      initialLiquidity: 50000,
      investorSellPct: 0.15,
      hardwareCost: 800,
    }));

    setViewMode('sandbox');
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

  const displayedData = useMemo(() => {
    const data = aggregated.slice(0, playbackWeek);
    let runningTotalLoss = 0;
    return data.map(d => {
      const netDailyLoss = d.netDailyLoss?.mean || 0;
      runningTotalLoss += netDailyLoss;
      return {
        ...d,
        cumulativeNetLoss: runningTotalLoss
      };
    });
  }, [aggregated, playbackWeek]);

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
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.1} />
              <XAxis dataKey="t" fontSize={11} interval="preserveStartEnd" label={{ value: 'Time (Weeks)', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 10 }} />
              <YAxis fontSize={11} tickFormatter={formatCompact} label={{ value: 'Units', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
              <Area type="monotone" dataKey={(d: any) => d?.capacity?.mean} stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.15} name="Capacity" />
              {isDriver && <Line data={focusedCounterfactual} type="monotone" dataKey="capacityRef" stroke="#475569" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Equilibrium Reference" opacity={0.4} />}
              <Line type="monotone" dataKey={(d: any) => d?.demand_served?.mean} stroke="#fbbf24" strokeWidth={3} dot={false} name="Demand Served" />
              <Legend verticalAlign="top" height={36} iconType="circle" />
            </ComposedChart>
          );
        case "Miner Payback Period (Months)":
          return (
            <LineChart data={displayedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.1} />
              <XAxis dataKey="t" fontSize={11} interval="preserveStartEnd" label={{ value: 'Time (Weeks)', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 10 }} />
              <YAxis fontSize={11} domain={[0, 36]} allowDataOverflow={true} label={{ value: 'Months', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                formatter={(val: number) => val >= 36 ? ['Never (Unprofitable)', 'Payback Period'] : [`${val.toFixed(1)} Months`, 'Payback Period']}
                labelFormatter={(label) => `Week ${label}`}
              />
              <ReferenceArea y1={0} y2={12} {...{ fill: "#10b981", fillOpacity: 0.05 } as any} />
              <ReferenceArea y1={24} y2={36} {...{ fill: "#f43f5e", fillOpacity: 0.05 } as any} />
              <Line
                type="monotone"
                dataKey={(d: any) => {
                  const weeklyRevenue = (d.minted.mean / d.providers.mean) * d.price.mean;
                  const profit = weeklyRevenue - params.providerCostPerWeek;
                  if (profit <= 0) return 36;
                  const payback = (500 / profit) / 4.33;
                  return Math.min(payback, 36);
                }}
                stroke="#f43f5e"
                strokeWidth={3}
                dot={false}
                name="Payback Period"
              />
              <ReferenceLine y={12} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Healthy (<12m)', fill: '#10b981', fontSize: 10, position: 'insideBottomRight' }} />
              <ReferenceLine y={24} stroke="#fbbf24" strokeDasharray="3 3" label={{ value: 'Risk (>24m)', fill: '#fbbf24', fontSize: 10, position: 'insideTopRight' }} />
              <Legend verticalAlign="top" height={36} iconType="circle" />
            </LineChart>
          );

        case "The Solvency Ratio":
          return (
            <ComposedChart data={displayedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.1} />
              <XAxis dataKey="t" fontSize={11} interval="preserveStartEnd" label={{ value: 'Time (Weeks)', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 10 }} />
              <YAxis fontSize={11} domain={[0, 5]} allowDataOverflow={true} label={{ value: 'Burn/Mint Ratio', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
              <ReferenceArea y1={0} y2={1} {...{ fill: "#f43f5e", fillOpacity: 0.1 } as any} />
              <ReferenceArea y1={1} y2={5} {...{ fill: "#10b981", fillOpacity: 0.05 } as any} />
              <Line type="monotone" dataKey={(d: any) => Math.min(d?.solvencyScore?.mean || 0, 5)} stroke="#fbbf24" strokeWidth={3} dot={false} name="Solvency Ratio" />
              <ReferenceLine y={1} stroke="#10b981" strokeDasharray="5 5" label={{ value: 'Deflationary (>1.0)', fill: '#10b981', fontSize: 10, position: 'insideTopLeft' }} />
              <Legend verticalAlign="top" height={36} iconType="circle" />
            </ComposedChart>
          );
        case "The Capitulation Stack":
          return (
            <AreaChart data={displayedData}>
              <defs>
                <linearGradient id="urbanGradientFocus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="ruralGradientFocus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.1} />
              <XAxis dataKey="t" fontSize={11} interval="preserveStartEnd" label={{ value: 'Time (Weeks)', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 10 }} />
              <YAxis fontSize={11} label={{ value: 'Node Count', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="ruralCount.mean" stackId="1" stroke="#10b981" fill="url(#ruralGradientFocus)" name="Rural (Utility)" />
              <Area type="monotone" dataKey="urbanCount.mean" stackId="1" stroke="#ef4444" fill="url(#urbanGradientFocus)" name="Urban (Speculator)" />
              <Legend verticalAlign="top" height={36} iconType="circle" />
            </AreaChart>
          );
        case "Effective Service Capacity":
          return (
            <ComposedChart data={displayedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.1} />
              <XAxis dataKey="t" fontSize={11} interval="preserveStartEnd" label={{ value: 'Time (Weeks)', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 10 }} />
              <YAxis fontSize={11} tickFormatter={formatCompact} label={{ value: 'Units', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
              <Area type="monotone" dataKey={(d: any) => d?.capacity?.mean} stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.15} name="Total Capacity" />
              <Line type="monotone" dataKey={(d: any) => d?.demand_served?.mean} stroke="#fbbf24" strokeWidth={3} dot={false} name="Served Demand" />
              <Legend verticalAlign="top" height={36} iconType="circle" />
            </ComposedChart>
          );
        case "Liquidity Shock Impact":
          return (
            <LineChart data={displayedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.1} />
              <XAxis dataKey="t" fontSize={11} interval="preserveStartEnd" label={{ value: 'Time (Weeks)', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 10 }} />
              <YAxis fontSize={11} tickFormatter={formatCompact} label={{ value: 'Price (USD)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
              <Line type="monotone" dataKey={(d: any) => d?.price?.mean} stroke="#8b5cf6" strokeWidth={3} dot={false} name="Token Price" />
              <Legend verticalAlign="top" height={36} iconType="circle" />
            </LineChart>
          );
        case "Burn vs Emissions":
          return (
            <ComposedChart data={displayedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.1} />
              <XAxis dataKey="t" fontSize={11} interval="preserveStartEnd" label={{ value: 'Time (Weeks)', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 10 }} />
              <YAxis fontSize={11} tickFormatter={formatCompact} label={{ value: 'Tokens', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
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
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.1} />
              <XAxis dataKey="t" fontSize={11} interval="preserveStartEnd" label={{ value: 'Time (Weeks)', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 10 }} />
              <YAxis domain={[0, 100]} fontSize={11} label={{ value: '% Utilized', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
              <ReferenceArea y1={0} y2={30} {...{ fill: "#f43f5e", fillOpacity: 0.05 } as any} label={{ value: "Waste", position: 'insideRight', fill: '#f43f5e', fontSize: 10, opacity: 0.5 }} />
              <ReferenceArea y1={30} y2={70} {...{ fill: "#fbbf24", fillOpacity: 0.05 } as any} label={{ value: "Growth", position: 'insideRight', fill: '#fbbf24', fontSize: 10, opacity: 0.5 }} />
              <ReferenceArea y1={70} y2={95} {...{ fill: "#10b981", fillOpacity: 0.05 } as any} label={{ value: "Optimal", position: 'insideRight', fill: '#10b981', fontSize: 10, opacity: 0.5 }} />
              <ReferenceArea y1={95} y2={100} {...{ fill: "#f43f5e", fillOpacity: 0.1 } as any} label={{ value: "Congestion", position: 'insideRight', fill: '#f43f5e', fontSize: 10, opacity: 0.5 }} />
              <Area type="monotone" dataKey={(d: any) => d?.utilization?.mean} stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.2} name="Utilization %" />
              {isDriver && <Line data={focusedCounterfactual} type="monotone" dataKey="utilizationRef" stroke="#475569" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Equilibrium Reference" opacity={0.4} />}
              <Legend verticalAlign="top" height={36} iconType="circle" />
            </AreaChart>
          );
        case "Supply Trajectory":
          return (
            <LineChart data={displayedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.1} />
              <XAxis dataKey="t" fontSize={11} interval="preserveStartEnd" label={{ value: 'Time (Weeks)', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 10 }} />
              <YAxis fontSize={11} tickFormatter={formatCompact} label={{ value: 'Total Supply', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
              <Line type="monotone" dataKey={(d: any) => d?.supply?.mean} stroke="#8b5cf6" strokeWidth={3} dot={false} name="Circ. Supply" />
              <Legend verticalAlign="top" height={36} iconType="circle" />
            </LineChart>
          );
        case "Service Pricing Proxy":
          return (
            <LineChart data={displayedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.1} />
              <XAxis dataKey="t" fontSize={11} interval="preserveStartEnd" label={{ value: 'Time (Weeks)', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 10 }} />
              <YAxis fontSize={11} label={{ value: 'CHF', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
              <ReferenceLine y={0.05} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Web2 Competitor (Proxy)', fill: '#10b981', fontSize: 10, position: 'insideTopRight' }} />
              <Line type="monotone" dataKey={(d: any) => d?.servicePrice?.mean} stroke="#3b82f6" strokeWidth={3} dot={false} name="CHF / Unit" />
              <Legend verticalAlign="top" height={36} iconType="circle" />
            </LineChart>

          );
        case "Provider Count":
          return (
            <AreaChart data={displayedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.1} />
              <XAxis dataKey="t" fontSize={11} interval="preserveStartEnd" label={{ value: 'Time (Weeks)', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 10 }} />
              <YAxis fontSize={11} label={{ value: 'Nodes', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
              <Area type="monotone" dataKey={(d: any) => d?.providers?.mean} stroke="#22c55e" fill="rgba(34, 197, 94, 0.1)" strokeWidth={3} name="Total Providers" />
              <Legend verticalAlign="top" height={36} iconType="circle" />
            </AreaChart>
          );
        case "Treasury Health & Vampire Churn":
          return (
            <ComposedChart data={displayedData}>
              <defs>
                <linearGradient id="treasuryGradientFocus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.1} />
              <XAxis dataKey="t" fontSize={11} interval="preserveStartEnd" label={{ value: 'Time (Weeks)', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 10 }} />
              <YAxis yAxisId="left" fontSize={11} tickFormatter={formatCompact} label={{ value: 'Treasury ($)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" fontSize={11} label={{ value: 'Vampire Churn', angle: 90, position: 'insideRight', fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
              <Area yAxisId="left" type="monotone" dataKey="treasuryBalance.mean" name="Treasury" stroke="#10b981" fill="url(#treasuryGradientFocus)" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="vampireChurn.mean" name="Vampire Churn" stroke="#f43f5e" strokeWidth={2} dot={false} strokeDasharray="5 5" />
              <Legend verticalAlign="top" height={36} iconType="circle" />
            </ComposedChart>
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

          {activeScenarioId && (() => {
            const activeScenario = SCENARIOS.find(s => s.id === activeScenarioId);
            if (!activeScenario) return null;
            const Icon = activeScenario.iconName === 'TrendingDown' ? TrendingDown :
              activeScenario.iconName === 'Infinity' ? InfinityIcon :
                activeScenario.iconName === 'Swords' ? Swords : Zap;

            return (
              <div className="w-full bg-indigo-950/30 border-b border-indigo-500/20 px-8 py-4 flex items-center gap-6 shrink-0 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 shadow-[0_0_10px_#6366f1]"></div>
                <div className="absolute right-10 -top-6 text-indigo-500/5 rotate-12 pointer-events-none">
                  <Icon size={140} />
                </div>

                <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/30 text-indigo-400 shrink-0">
                  <Icon size={32} />
                </div>

                <div className="flex-1 min-w-0 z-10">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-black text-white tracking-tight leading-none">{activeScenario.name} Active</h3>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-black uppercase tracking-widest border border-indigo-500/30">
                      Simulation Override
                    </span>
                  </div>
                  <p className="text-xs text-indigo-200/70 font-medium leading-relaxed italic truncate">
                    "{activeScenario.description}"
                  </p>
                </div>

                <div className="hidden lg:block w-px h-12 bg-indigo-500/20 mx-2"></div>

                <div className="hidden lg:flex flex-col items-start gap-1 max-w-md z-10">
                  <h4 className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Target size={12} />
                    Hypothesis
                  </h4>
                  <p className="text-xs text-slate-300 leading-snug font-medium">
                    {activeScenario.thesisPoint}
                  </p>
                </div>
              </div>
            );
          })()}

          <div className="flex-1 p-8 flex flex-col lg:flex-row gap-10 overflow-hidden">
            <div className="flex-[3] w-full h-[600px] bg-slate-950/50 rounded-2xl p-6 border border-slate-800 relative">
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

          <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'simulator' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Simulator
            </button>
            <button
              onClick={() => setActiveTab('thesis')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'thesis' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Thesis
            </button>
            <button
              onClick={() => setActiveTab('case_study')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'case_study' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Case Study
            </button>
          </div>

          {activeTab === 'simulator' && (

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
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Learn Dropdown - Available in both tabs */}
          <HeaderDropdown
            label="Learn"
            icon={<BookOpen size={14} />}
            isActive={isMethodologyOpen || showSpecModal || showAuditPanel}
          >
            <DropdownItem
              icon={<BookOpen size={14} />}
              onClick={() => setIsMethodologyOpen(true)}
              description="Simulation methodology & assumptions"
            >
              Methodology
            </DropdownItem>
            <DropdownItem
              icon={<Binary size={14} />}
              onClick={() => setShowSpecModal(true)}
              description="Mathematical formulas & equations"
            >
              Math Specification
            </DropdownItem>
            <DropdownItem
              icon={<Calculator size={14} />}
              onClick={() => {
                setActiveTab('simulator');
                setShowAuditPanel(true);
              }}
              description="Calibration & validation checks"
            >
              System Audit
            </DropdownItem>
          </HeaderDropdown>

          {/* Data Dropdown - Both tabs (useful for showing live data in thesis) */}
          <HeaderDropdown
            label="Data"
            icon={<Activity size={14} />}
            isActive={Object.keys(liveData).length > 0 || showDePINBrowser}
          >
            <DropdownItem
              icon={liveDataLoading ? <RefreshCw size={14} className="animate-spin" /> : <Activity size={14} />}
              onClick={fetchLiveData}
              disabled={liveDataLoading}
              description={lastLiveDataFetch ? `Last: ${lastLiveDataFetch.toLocaleTimeString()}` : 'Pull from CoinGecko'}
            >
              {liveDataLoading ? 'Fetching...' : Object.keys(liveData).length > 0 ? 'Refresh Live Data ✓' : 'Fetch Live Data'}
            </DropdownItem>
            <DropdownToggle
              icon={<RefreshCw size={14} />}
              checked={autoRefreshEnabled}
              onChange={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              description="Auto-refresh every 5 minutes"
            >
              Auto Refresh
            </DropdownToggle>
            <DropdownItem
              icon={<Layers size={14} />}
              onClick={() => setShowDePINBrowser(true)}
              description="Browse all DePIN token prices"
            >
              DePIN Browser
            </DropdownItem>
            <DropdownDivider />
            <DropdownToggle
              icon={<Zap size={14} />}
              checked={useNewModel}
              onChange={() => setUseNewModel(!useNewModel)}
              description={useNewModel ? 'V2: With sell pressure model' : 'V1: Legacy model'}
            >
              Use V2 Model
            </DropdownToggle>
          </HeaderDropdown>

          {/* Settings - Icon only for cleaner look */}
          <button
            onClick={() => {
              setActiveTab('simulator');
              setViewMode('settings');
            }}
            className={`p-2.5 rounded-xl border transition-all ${viewMode === 'settings' && activeTab === 'simulator' ? 'bg-indigo-600 text-white border-indigo-400' : 'text-slate-400 border-slate-800 hover:bg-slate-900 hover:text-white'}`}
            title="Settings"
          >
            <Settings2 size={16} />
          </button>

          {/* Export */}
          <button
            onClick={() => setShowExportPanel(!showExportPanel)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-[10px] font-bold ${showExportPanel ? 'bg-emerald-600 text-white border-emerald-400' : 'text-slate-400 border-slate-800 hover:bg-slate-900 hover:text-emerald-400 hover:border-emerald-500/50'}`}
          >
            <Download size={14} />
            Export
          </button>

          {/* Run Matrix - Primary CTA (Simulator only) */}
          {activeTab === 'simulator' && (
            <button
              onClick={runSimulation}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 active:scale-95"
            >
              {loading ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} fill="currentColor" />}
              Run Matrix
            </button>
          )}
        </div>
      </header >

      {activeTab === 'case_study' ? (
        <TokenomicsStudy />
      ) : activeTab === 'thesis' ? (
        <ThesisDashboard
          activeProfile={activeProfile}
          protocols={PROTOCOL_PROFILES}
          onSelectProtocol={(p) => {
            setActiveProfile(p);
            // Optionally sync selected ID for other views if needed, though activeProfile usually drives it
            setSelectedProtocolIds([p.metadata.id]);
          }}
        />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {viewMode === 'settings' ? (
            <Settings onBack={() => setViewMode('sandbox')} onReset={resetToDefaults} />
          ) : viewMode === 'explorer' ? (
            <ExplorerTab
              profiles={PROTOCOL_PROFILES}
              networkStatus={networkStatus}
              onAnalyze={(id) => {
                // Switch to sandbox and load the profile
                // Explorer passes IDs that might be internal IDs OR CoingeckoIDs
                const profile = PROTOCOL_PROFILES.find(p => p.metadata.id === id || p.metadata.coingeckoId === id);
                if (profile) {
                  loadProfile(profile);
                  setViewMode('sandbox');
                } else {
                  console.warn(`No simulation profile found for ${id}`);
                  // Optionally notify user via toast (if we had one)
                }
              }}
              onCompare={(id) => {
                // Switch to comparison and ensure protocol is selected
                const profile = PROTOCOL_PROFILES.find(p => p.metadata.id === id || p.metadata.coingeckoId === id);
                if (profile) {
                  const targetId = profile.metadata.id;
                  if (!selectedProtocolIds.includes(targetId)) {
                    setSelectedProtocolIds(prev => [...prev, targetId]);
                  }
                  setViewMode('comparison');
                }
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



                  <CollapsibleSection
                    title="Stress Controls"
                    icon={<Settings2 size={14} />}
                    iconColor="text-indigo-400"
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
                    title="Vampire & Treasury"
                    icon={<Shield size={14} />}
                    iconColor="text-purple-400"
                    summary={`Competitor: +${(params.competitorYield * 100).toFixed(0)}% • ${params.revenueStrategy === 'reserve' ? 'Reserve' : 'Burn'}`}
                    isOpen={!collapsedSections.competitive}
                    onToggle={() => toggleSection('competitive')}
                  >
                    {/* Vampire Attack Slider */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <ParamLabel label="Competitor Yield Advantage" paramKey="competitorYield" />
                        <span className="text-purple-400 text-[10px] font-mono font-bold">
                          +{(params.competitorYield * 100).toFixed(0)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={params.competitorYield}
                        onChange={e => setParams({ ...params, competitorYield: parseFloat(e.target.value) })}
                        className="w-full accent-purple-600 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] text-slate-600 mt-1">
                        <span>No Threat</span>
                        <span>200% (Critical)</span>
                      </div>
                      <p className="text-[9px] text-slate-500 mt-2 italic">
                        Simulates a competitor offering higher APY to steal your nodes.
                      </p>
                    </div>

                    {/* Emission Model Toggle */}
                    <div className="mt-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Emission Model</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setParams({ ...params, emissionModel: 'fixed' })}
                          className={`px-3 py-2 rounded-lg border text-xs font-bold uppercase transition-all ${params.emissionModel === 'fixed'
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                            }`}
                        >
                          Fixed Schedule
                        </button>
                        <button
                          onClick={() => setParams({ ...params, emissionModel: 'kpi' })}
                          className={`px-3 py-2 rounded-lg border text-xs font-bold uppercase transition-all ${params.emissionModel === 'kpi'
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                            }`}
                        >
                          KPI-Based
                        </button>
                      </div>
                      <p className="text-[9px] text-slate-500 mt-2">
                        <span className="text-blue-400">Fixed:</span> Prints tokens regardless of usage.{' '}
                        <span className="text-emerald-400">KPI:</span> Only mints when utilization is high.
                      </p>
                    </div>

                    {/* Revenue Strategy Toggle */}
                    <div className="mt-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Revenue Strategy</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setParams({ ...params, revenueStrategy: 'burn' })}
                          className={`px-3 py-2 rounded-lg border text-xs font-bold uppercase transition-all ${params.revenueStrategy === 'burn'
                            ? 'bg-rose-600 border-rose-500 text-white'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                            }`}
                        >
                          Buy & Burn
                        </button>
                        <button
                          onClick={() => setParams({ ...params, revenueStrategy: 'reserve' })}
                          className={`px-3 py-2 rounded-lg border text-xs font-bold uppercase transition-all ${params.revenueStrategy === 'reserve'
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                            }`}
                        >
                          Sinking Fund
                        </button>
                      </div>
                      <p className="text-[9px] text-slate-500 mt-2">
                        <span className="text-rose-400">Burn:</span> Short-term pump.{' '}
                        <span className="text-emerald-400">Reserve:</span> Builds war chest to support price in crashes.
                      </p>
                    </div>
                  </CollapsibleSection>


                  <CollapsibleSection
                    title="Quick Presets"
                    icon={<Zap size={14} />}
                    iconColor="text-pink-500"
                    summary="Crypto Winter • Saturation • Utility"
                    isOpen={!collapsedSections.scenarios}
                    onToggle={() => toggleSection('scenarios')}
                  >
                    <div className="grid grid-cols-1 gap-2">
                      {SCENARIOS.map((scenario) => {
                        const Icon = scenario.iconName === 'TrendingDown' ? TrendingDown :
                          scenario.iconName === 'Infinity' ? InfinityIcon :
                            scenario.iconName === 'Swords' ? Swords : Zap;

                        const isActive = activeScenarioId === scenario.id;

                        return (
                          <button
                            key={scenario.id}
                            onClick={() => {
                              // apply params
                              setParams(prev => ({ ...prev, ...scenario.params }));
                              // set active state
                              setActiveScenarioId(scenario.id);

                              // Auto-focus the relevant chart for "Proof"
                              if (scenario.focusChart) {
                                setFocusChart(scenario.focusChart);
                              }
                            }}
                            className={`p-3 rounded-xl border text-left transition-all group ${isActive ? 'bg-indigo-600/20 border-indigo-500 shadow-earthquake' : 'bg-indigo-500/10 border-indigo-500/30 hover:bg-indigo-500/20'}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-[10px] font-bold uppercase ${isActive ? 'text-white' : 'text-indigo-400'}`}>{scenario.name}</span>
                              <Icon size={12} className={isActive ? 'text-white' : 'text-indigo-400'} />
                            </div>
                            <p className="text-[10px] text-slate-400">
                              {scenario.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </CollapsibleSection>


                  <CollapsibleSection
                    title="Tokenomics"
                    icon={<Database size={14} />}
                    iconColor="text-violet-500"
                    summary={`$${params.initialPrice} • ${(params.burnPct * 100).toFixed(0)}% burn`}
                    isOpen={!collapsedSections.tokenomics}
                    onToggle={() => toggleSection('tokenomics')}

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
                    title="Advanced Configuration"
                    icon={<Sliders size={14} />}
                    iconColor="text-slate-400"
                    summary="Economics • Simulation"
                    isOpen={!collapsedSections.advanced}
                    onToggle={() => toggleSection('advanced')}
                  >
                    <div className="space-y-6">
                      <CollapsibleSection
                        title="Provider Economics"
                        icon={<Users size={14} />}
                        iconColor="text-emerald-500"
                        summary={`$${params.providerCostPerWeek}/wk OpEx • $${params.churnThreshold} churn`}
                        isOpen={!collapsedSections.providers}
                        onToggle={() => toggleSection('providers')}

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
                            className="w-full accent-emerald-600 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer mb-6"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-2">
                            <ParamLabel label="Hardware Cost (Capex)" paramKey="hardwareCost" />
                            <span className="text-emerald-400 text-[10px] font-mono font-bold">${params.hardwareCost.toFixed(0)}</span>
                          </div>
                          <input
                            type="range"
                            min="200"
                            max="2000"
                            step="50"
                            value={params.hardwareCost}
                            onChange={e => setParams({ ...params, hardwareCost: parseFloat(e.target.value) })}
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

                      {/* Module Quick-Nav */}
                      <div className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800/50 py-3 px-4 -mx-6 mb-8">
                        <div className="max-w-4xl mx-auto flex items-center justify-center gap-2">
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mr-3">Jump to:</span>
                          <a
                            href="#module-1"
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 border border-slate-800 hover:border-rose-500/50 text-[10px] font-bold text-slate-400 hover:text-rose-400 transition-all"
                          >
                            M1 Solvency
                          </a>
                          <a
                            href="#module-2"
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-amber-500/20 border border-slate-800 hover:border-amber-500/50 text-[10px] font-bold text-slate-400 hover:text-amber-400 transition-all"
                          >
                            M2 Capitulation
                          </a>
                          <a
                            href="#module-3"
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-purple-500/20 border border-slate-800 hover:border-purple-500/50 text-[10px] font-bold text-slate-400 hover:text-purple-400 transition-all"
                          >
                            M3 Liquidity
                          </a>
                          <a
                            href="#module-4"
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-emerald-500/20 border border-slate-800 hover:border-emerald-500/50 text-[10px] font-bold text-slate-400 hover:text-emerald-400 transition-all"
                          >
                            M4 Vampire
                          </a>
                        </div>
                      </div>

                      {/* Deep Dive & Flywheel Section */}
                      <div className="space-y-8 mb-12">
                        <div className="border-b border-slate-800 pb-4">
                          <h2 className="text-xl font-bold text-white mb-2">Deep Dive Analysis</h2>
                          <p className="text-sm text-slate-400">Advanced diagnostics for {activeProfile.metadata.name}, including network health and thesis verification.</p>
                        </div>

                        {/* FLYWHEEL WIDGET */}
                        {(() => {
                          const data = aggregated; // In Sandbox mode, 'aggregated' is the active profile data
                          if (!data || data.length === 0) return null;
                          const lastPoint = data[data.length - 1];

                          // Map simulation data to widget props
                          const metrics = {
                            nodes: lastPoint.providers.mean,
                            utilization: lastPoint.utilization.mean,
                            revenue: lastPoint.revenue ? lastPoint.revenue.mean : (lastPoint.minted.mean * lastPoint.price.mean * 0.1), // Fallback
                            incentive: lastPoint.solvencyScore.mean * 100
                          };

                          const isStressed = metrics.utilization < 10 || metrics.incentive < 50;

                          return (
                            <div className="mb-8">
                              <FlywheelWidget metrics={metrics} stress={isStressed} />
                            </div>
                          );
                        })()}
                      </div>

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
                            {/* [NEW] Payback Period Metric */}
                            <MetricCard
                              className="col-span-2 md:col-span-1"
                              title="Payback Period"
                              value={(() => {
                                const last = aggregated[aggregated.length - 1];
                                if (!last) return '-';
                                const weeklyRev = (last.minted.mean / Math.max(1, last.providers.mean)) * last.price.mean;
                                const profit = weeklyRev - params.providerCostPerWeek;
                                if (profit <= 0) return '>36mo';
                                const months = (params.hardwareCost / profit) / 4.33;
                                return months > 60 ? '>5y' : `${months.toFixed(1)}mo`;
                              })()}
                              subValue={(() => {
                                const last = aggregated[aggregated.length - 1];
                                if (!last) return '';
                                const weeklyRev = (last.minted.mean / Math.max(1, last.providers.mean)) * last.price.mean;
                                const profit = weeklyRev - params.providerCostPerWeek;
                                return profit <= 0 ? 'Never (Loss)' : 'ROI Time';
                              })()}
                              subColor={(() => {
                                const last = aggregated[aggregated.length - 1];
                                if (!last) return '';
                                const weeklyRev = (last.minted.mean / Math.max(1, last.providers.mean)) * last.price.mean;
                                const profit = weeklyRev - params.providerCostPerWeek;
                                if (profit <= 0) return 'text-rose-400';
                                const months = (params.hardwareCost / profit) / 4.33;
                                return months > 18 ? 'text-rose-400' : 'text-emerald-400';
                              })()}
                              icon={Clock}
                              tooltip="Estimated time to recover hardware cost based on current daily earnings."
                              formula="HardwareCost / (WeeklyProfit * 4.33)"
                            />
                          </div>

                          <BaseChartBox title="Cumulative Network Subsidy" icon={TrendingDown} color="rose" source="Σ (Daily Burn - Daily Mint)" heightClass="h-[300px]">
                            <AreaChart data={displayedData} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                              <defs>
                                <linearGradient id="subsidyGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.1} />
                              <XAxis dataKey="t" fontSize={9} />
                              <YAxis fontSize={9} tickFormatter={formatCompact} />
                              <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '12px' }}
                                formatter={(val: number) => [formatCompact(val), 'Cumulative Subsidy ($)']}
                                labelFormatter={(label) => `Week ${label}`}
                              />
                              <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />
                              <Area
                                type="monotone"
                                dataKey="cumulativeNetLoss"
                                stroke="#f43f5e"
                                fill="url(#subsidyGradient)"
                                strokeWidth={2}
                              />
                            </AreaChart>
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
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.1} />
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
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.1} />
                              <XAxis dataKey="t" fontSize={9} tickFormatter={(val) => val === params.investorUnlockWeek ? `⚡ W${val}` : val} label={{ value: 'Time', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 9 }} />
                              <YAxis fontSize={9} tickFormatter={(val) => `$${val.toFixed(2)}`} label={{ value: 'Price ($)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 9 }} />
                              <Tooltip />
                              <ReferenceLine x={params.investorUnlockWeek} stroke="#f43f5e" strokeDasharray="3 3" />
                              <Area type="monotone" dataKey="price.mean" name="Price" stroke="#a855f7" fill="url(#priceGradient)" strokeWidth={2} />
                            </AreaChart>
                          </BaseChartBox>
                        </div>
                      </SectionLayout>

                      {/* Module 4: Competitive Resilience (Risk Engine) */}
                      <SectionLayout
                        id="module-4"
                        title="The Vampire & Reserve Test"
                        subtitle="Module 04 // Competitive Moat"
                        description={
                          <div className="space-y-6">
                            <p>
                              <strong>The Competitor's Dilemma.</strong> What happens when a rival protocol
                              offers 150% of your yield? The "Vampire Attack" drains nodes regardless of
                              your token price stability.
                            </p>
                            <p>
                              This module also tests <strong>Sinking Fund</strong> resilience vs <strong>Buy & Burn</strong>
                              strategies during market stress. Research shows protocols with reserves survive 50% longer.
                            </p>
                          </div>
                        }
                      >
                        <div className="space-y-6">
                          {/* Status Indicators */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800/50">
                              <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Competitor Threat</div>
                              <div className={`text-lg font-mono ${params.competitorYield > 0.5 ? 'text-rose-400' : params.competitorYield > 0.2 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {params.competitorYield > 0.5 ? 'CRITICAL' : params.competitorYield > 0.2 ? 'MODERATE' : 'LOW'}
                              </div>
                              <div className="text-[9px] text-slate-500 mt-1">+{(params.competitorYield * 100).toFixed(0)}% yield advantage</div>
                            </div>
                            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800/50">
                              <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Revenue Strategy</div>
                              <div className={`text-lg font-mono ${params.revenueStrategy === 'reserve' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {params.revenueStrategy === 'reserve' ? 'SINKING FUND' : 'BUY & BURN'}
                              </div>
                              <div className="text-[9px] text-slate-500 mt-1">{params.revenueStrategy === 'reserve' ? 'Building reserves' : 'Burning tokens'}</div>
                            </div>
                            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800/50">
                              <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Emission Model</div>
                              <div className={`text-lg font-mono ${params.emissionModel === 'kpi' ? 'text-emerald-400' : 'text-blue-400'}`}>
                                {params.emissionModel === 'kpi' ? 'KPI-BASED' : 'FIXED'}
                              </div>
                              <div className="text-[9px] text-slate-500 mt-1">{params.emissionModel === 'kpi' ? 'Demand-responsive' : 'Fixed schedule'}</div>
                            </div>
                            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800/50">
                              <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Treasury Balance</div>
                              <div className={`text-lg font-mono ${params.revenueStrategy === 'reserve' ? 'text-emerald-400' : 'text-slate-500'}`}>
                                ${formatCompact(aggregated[aggregated.length - 1]?.treasuryBalance?.mean || 0)}
                              </div>
                              <div className="text-[9px] text-slate-500 mt-1">{params.revenueStrategy === 'reserve' ? 'Accumulated' : 'No reserves'}</div>
                            </div>
                          </div>

                          {/* Vampire Attack Warning */}
                          {params.competitorYield > 0.5 && (
                            <div className="p-4 bg-rose-950/20 border border-rose-500/30 rounded-xl flex items-center gap-4 animate-pulse">
                              <AlertTriangle className="text-rose-500 shrink-0" size={20} />
                              <div>
                                <h4 className="text-rose-400 text-xs font-black uppercase tracking-widest">Warning: Vampire Attack Active</h4>
                                <p className="text-[10px] text-rose-300/70 mt-1">Competitor offering +{(params.competitorYield * 100).toFixed(0)}% yield. Expect accelerated node churn.</p>
                              </div>
                            </div>
                          )}

                          {/* Treasury Health Chart */}
                          <BaseChartBox
                            title="Treasury Health & Vampire Churn"
                            icon={Wallet}
                            color="emerald"
                            source={params.revenueStrategy === 'reserve' ? 'Accumulated Reserves ($)' : 'No reserves (Burn mode)'}
                            heightClass="h-[300px]"
                          >
                            <ComposedChart data={displayedData} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                              <defs>
                                <linearGradient id="treasuryGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.1} />
                              <XAxis dataKey="t" fontSize={9} label={{ value: 'Weeks', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 9 }} />
                              <YAxis yAxisId="left" fontSize={9} tickFormatter={formatCompact} label={{ value: 'Treasury ($)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 9 }} />
                              <YAxis yAxisId="right" orientation="right" fontSize={9} label={{ value: 'Vampire Churn', angle: 90, position: 'insideRight', fill: '#64748b', fontSize: 9 }} />
                              <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '12px' }}
                                formatter={(val: number, name: string) => [
                                  name === 'Treasury' ? `$${formatCompact(val)}` : val.toFixed(1),
                                  name
                                ]}
                              />
                              <Area
                                yAxisId="left"
                                type="monotone"
                                dataKey="treasuryBalance.mean"
                                name="Treasury"
                                stroke="#10b981"
                                fill="url(#treasuryGradient)"
                                strokeWidth={2}
                              />
                              <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="vampireChurn.mean"
                                name="Vampire Churn"
                                stroke="#f43f5e"
                                strokeWidth={2}
                                dot={false}
                                strokeDasharray="5 5"
                              />
                            </ComposedChart>
                          </BaseChartBox>

                          {/* Strategy Comparison Insight */}
                          <div className={`p-4 rounded-xl border ${params.revenueStrategy === 'reserve' ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-rose-950/20 border-rose-500/30'}`}>
                            <h4 className={`text-xs font-black uppercase tracking-widest mb-2 ${params.revenueStrategy === 'reserve' ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {params.revenueStrategy === 'reserve' ? '💰 Sinking Fund Active' : '🔥 Buy & Burn Active'}
                            </h4>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                              {params.revenueStrategy === 'reserve'
                                ? 'Protocol is accumulating reserves. Price drops are dampened by 50%. This strategy provides a safety net during bear markets, as shown in the GEODNET thesis model.'
                                : 'Protocol is burning tokens immediately. Short-term price support, but no reserves for downturns. This strategy is fragile during extended bear markets.'}
                            </p>
                          </div>
                        </div>
                      </SectionLayout>


                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                        {/* Chart 1: Miner Payback Period (The Trigger) */}
                        <BaseChartBox
                          title="Miner Payback Period (Months)"
                          icon={DollarSign}
                          color="rose"
                          onExpand={() => setFocusChart("Miner Payback Period (Months)")}
                          isDriver={incentiveRegime.drivers.includes('Service Pricing Proxy')}
                          driverColor={incentiveRegime.color}
                          source="Hardware Cost / Weekly Profit"
                        >
                          <LineChart data={displayedData} margin={{ left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.1} />
                            <XAxis dataKey="t" fontSize={9} label={{ value: 'Weeks', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 9 }} />
                            <YAxis
                              fontSize={9}
                              domain={[0, 36]}
                              allowDataOverflow={true}
                              label={{ value: 'Months', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 9 }}
                            />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '12px' }}
                              formatter={(val: number) => isFinite(val) ? `${val.toFixed(1)} mo` : 'Never'}
                              labelFormatter={(label) => `Week ${label}`}
                            />

                            {/* Reference Zones: Explicit Backgrounds for Readability */}
                            <ReferenceArea y1={0} y2={12} {...{ fill: "#10b981", fillOpacity: 0.05 } as any} />
                            <ReferenceArea y1={24} y2={36} {...{ fill: "#f43f5e", fillOpacity: 0.05 } as any} />

                            <Line
                              type="monotone"
                              dataKey={(d: any) => {
                                const weeklyRevenue = (d.minted.mean / d.providers.mean) * d.price.mean;
                                const profit = weeklyRevenue - params.providerCostPerWeek;
                                if (profit <= 0) return 36; // Capped at Max logic
                                const payback = (params.hardwareCost / profit) / 4.33;
                                return Math.min(payback, 36); // HARD CLAMP to prevent overflow
                              }}
                              stroke="#f43f5e"
                              strokeWidth={2}
                              dot={false}
                              name="Payback Period"
                            />
                            <ReferenceLine y={12} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Healthy (<12m)', fill: '#10b981', fontSize: 9, position: 'insideBottomRight' }} />
                            <ReferenceLine y={24} stroke="#fbbf24" strokeDasharray="3 3" label={{ value: 'Risk (>24m)', fill: '#fbbf24', fontSize: 9, position: 'insideTopRight' }} />
                          </LineChart>
                        </BaseChartBox>

                        {/* Chart 2: The Solvency Ratio (Protocol Health) */}
                        <BaseChartBox
                          title="The Solvency Ratio"
                          icon={Scale}
                          color="amber"
                          onExpand={() => setFocusChart("The Solvency Ratio")}
                          isDriver={incentiveRegime.drivers.includes('Burn vs Emissions')}
                          driverColor={incentiveRegime.color}
                          source="Value Burned / Value Minted"
                        >
                          <ComposedChart data={displayedData} margin={{ left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.1} />
                            <XAxis dataKey="t" fontSize={9} label={{ value: 'Weeks', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 9 }} />
                            <YAxis fontSize={9} domain={[0, 5]} allowDataOverflow={true} label={{ value: 'Ratio', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 9 }} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '12px' }}
                            />

                            {/* Reference Zones */}
                            <ReferenceArea y1={0} y2={1} {...{ fill: "#f43f5e", fillOpacity: 0.1 } as any} /> {/* Dilutive Zone */}
                            <ReferenceArea y1={1} y2={5} {...{ fill: "#10b981", fillOpacity: 0.05 } as any} /> {/* Deflationary Zone */}

                            <Line
                              type="monotone"
                              dataKey={(d: any) => Math.min(d?.solvencyScore?.mean || 0, 5)} // CLAMP to 5.0
                              stroke="#fbbf24"
                              strokeWidth={2}
                              dot={false}
                              name="Solvency Ratio"
                            />
                            <ReferenceLine y={1} stroke="#10b981" strokeDasharray="5 5" strokeWidth={1.5} label={{ value: 'Deflationary (>1.0)', fill: '#10b981', fontSize: 9, position: 'insideTopLeft' }} />
                          </ComposedChart>
                        </BaseChartBox>

                        {/* Chart 3: The Capitulation Stack (Physical Consequence) */}
                        <BaseChartBox
                          title="The Capitulation Stack"
                          icon={ShieldAlert}
                          color="emerald"
                          onExpand={() => setFocusChart("The Capitulation Stack")}
                          isDriver={incentiveRegime.drivers.includes('Provider Count')}
                          driverColor={incentiveRegime.color}
                          source="Network Composition (Urban vs Rural)"
                        >
                          <AreaChart data={displayedData} margin={{ left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="urbanGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                              </linearGradient>
                              <linearGradient id="ruralGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.1} />
                            <XAxis dataKey="t" fontSize={9} label={{ value: 'Weeks', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 9 }} />
                            <YAxis fontSize={9} label={{ value: 'Nodes', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 9 }} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '12px' }}
                            />
                            {/* Rural (Bottom Layer - Resilient) */}
                            <Area
                              type="monotone"
                              dataKey="ruralCount.mean"
                              stackId="1"
                              stroke="#10b981"
                              fill="url(#ruralGradient)"
                              name="Rural (Utility)"
                            />
                            {/* Urban (Top Layer - Speculative) */}
                            <Area
                              type="monotone"
                              dataKey="urbanCount.mean"
                              stackId="1"
                              stroke="#ef4444"
                              fill="url(#urbanGradient)"
                              name="Urban (Speculator)"
                            />
                          </AreaChart>
                        </BaseChartBox>

                        {/* Chart 4: Effective Coverage Map (Placeholder for Heatmap/Coverage) */}
                        {/* Reusing Capacity vs Demand as a proxy for 'Effective Service' */}
                        <BaseChartBox
                          title="Effective Service Capacity"
                          icon={Activity}
                          color="indigo"
                          onExpand={() => setFocusChart("Effective Service Capacity")}
                          isDriver={incentiveRegime.drivers.includes('Capacity vs Demand')}
                          driverColor={incentiveRegime.color}
                          source="Serviceable Demand vs Total Capacity"
                        >
                          <ComposedChart data={displayedData} margin={{ left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.1} />
                            <XAxis dataKey="t" fontSize={9} label={{ value: 'Weeks', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 9 }} />
                            <YAxis fontSize={9} tickFormatter={formatCompact} label={{ value: 'Units', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 9 }} />
                            <Area type="monotone" dataKey={(d: any) => d?.capacity?.mean} stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.1} name="Total Capacity" />
                            <Line type="monotone" dataKey={(d: any) => d?.demand_served?.mean} stroke="#fbbf24" strokeWidth={2} dot={false} name="Served Demand" />
                          </ComposedChart>
                        </BaseChartBox>

                        {/* Chart 5: Supply Trajectory (Kept as context) */}
                        <BaseChartBox title="Supply Trajectory" icon={Database} color="violet" onExpand={() => setFocusChart("Supply Trajectory")} isDriver={incentiveRegime.drivers.includes('Supply Trajectory')} driverColor={incentiveRegime.color} source="Protocol Parameters">
                          <LineChart data={displayedData} margin={{ left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.1} />
                            <XAxis dataKey="t" fontSize={9} label={{ value: 'Weeks', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 9 }} />
                            <YAxis fontSize={9} tickFormatter={formatCompact} label={{ value: 'Supply', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 9 }} />
                            <Line type="monotone" dataKey={(d: any) => d?.supply?.mean} stroke="#8b5cf6" strokeWidth={2} dot={false} />
                          </LineChart>
                        </BaseChartBox>

                        {/* Chart 6: Network Utilization (Kept as derived metric) */}
                        <BaseChartBox title="Network Utilization (%)" icon={BarChart3} color="rose" onExpand={() => setFocusChart("Network Utilization (%)")} isDriver={incentiveRegime.drivers.includes('Network Utilization (%)')} driverColor={incentiveRegime.color} source="Derived Metric">
                          <AreaChart data={displayedData} margin={{ left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.1} />
                            <XAxis dataKey="t" fontSize={9} label={{ value: 'Weeks', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 9 }} />
                            <YAxis domain={[0, 100]} fontSize={9} label={{ value: '%', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 9 }} />
                            <Area type="monotone" dataKey={(d: any) => d?.utilization?.mean} stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.1} />
                          </AreaChart>
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
                        }) => {
                          // 1. Calculate Min/Max for Heatmap
                          const allValues = protocolMetrics.map(getValue);
                          const validValues = allValues.filter(v => isFinite(v) && !isNaN(v));
                          const min = Math.min(...validValues);
                          const max = Math.max(...validValues);
                          const range = max - min;

                          return (
                            <tr className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors group">
                              <td className="p-3 text-[10px] font-bold text-slate-400 bg-slate-950/30 sticky left-0 z-10 w-[200px]">
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

                                // Heatmap Logic
                                let bgStyle = {};
                                if (goodDirection !== 'neutral' && range > 0 && isFinite(value)) {
                                  // Normalize 0 to 1
                                  let normalized = (value - min) / range;
                                  // Invert if "Down" is good (e.g. Churn)
                                  if (goodDirection === 'down') normalized = 1 - normalized;

                                  // Apply Opacity (Max 0.20)
                                  const opacity = 0.05 + (normalized * 0.15); // Base 5% + up to 15%
                                  const color = normalized > 0.5 ? '16, 185, 129' : '244, 63, 94'; // Emerald vs Rose

                                  // Adjust Normalized for Color Strength (0.5 center pivot)
                                  // If normalized > 0.5 (Good), strength increases from 0 to 1 as norm goes 0.5 -> 1
                                  // If normalized < 0.5 (Bad), strength increases from 0 to 1 as norm goes 0.5 -> 0
                                  let strength = Math.abs(normalized - 0.5) * 2;

                                  bgStyle = {
                                    backgroundColor: `rgba(${color}, ${strength * 0.2})`
                                  };
                                }

                                return (
                                  <td key={m.protocol.metadata.id} className="p-3 text-center transition-colors" style={bgStyle}>
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
                        };

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

                      {/* Metric Selector */}
                      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-4">
                        <div className="flex items-center gap-3 mb-4">
                          <Activity size={16} className="text-slate-400" />
                          <h3 className="text-xs font-black text-white uppercase tracking-widest">Comparison Metric</h3>
                        </div>
                        <div className="grid grid-cols-6 gap-2">
                          {[
                            { id: 'providers', label: 'Nodes' },
                            { id: 'price', label: 'Price' },
                            { id: 'solvencyScore', label: 'Solvency' },
                            { id: 'utilization', label: 'Util %' },
                            { id: 'minted', label: 'Emissions' },
                            { id: 'burned', label: 'Revenue' }
                          ].map(m => (
                            <button
                              key={m.id}
                              onClick={() => setComparisonMetric(m.id as any)}
                              className={`px-3 py-2 rounded-lg text-[10px] font-bold border transition-colors ${comparisonMetric === m.id
                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                                }`}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <TrendingUp size={16} className="text-indigo-400" />
                            <h3 className="text-xs font-black text-white uppercase tracking-widest">{comparisonMetric === 'solvencyScore' ? 'Solvency' : comparisonMetric.charAt(0).toUpperCase() + comparisonMetric.slice(1)} Overlay</h3>

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
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.1} />
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
                                tickFormatter={(val) => normalizeCharts ? `${val}` : formatCompact(val)}
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
                                    const actual = point?.[comparisonMetric as keyof AggregateResult]?.mean || 0;
                                    return [`Index: ${value.toFixed(1)} | Actual: ${formatCompact(actual)}`, name];
                                  }
                                  return [formatCompact(value as number), name];
                                }}
                              />
                              {PROTOCOL_PROFILES.filter(p => selectedProtocolIds.includes(p.metadata.id) && !hiddenProtocols.has(p.metadata.id)).map((p, i) => {
                                const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
                                const data = multiAggregated[p.metadata.id] || [];
                                const baselineValue = Math.max(0.0001, data[0]?.[comparisonMetric as keyof AggregateResult]?.mean || 1);

                                // Normalize data if toggle is on
                                const chartData = normalizeCharts
                                  ? data.map((d: any) => ({
                                    ...d,
                                    normalizedValue: ((d?.[comparisonMetric as keyof AggregateResult]?.mean || 0) / baselineValue) * 100
                                  }))
                                  : data;

                                return (
                                  <Line
                                    key={p.metadata.id}
                                    data={chartData}
                                    type="monotone"
                                    dataKey={normalizeCharts ? 'normalizedValue' : (d: any) => d?.[comparisonMetric as keyof AggregateResult]?.mean}
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
                                const finalValue = last?.[comparisonMetric as keyof AggregateResult]?.mean || 0;
                                const startValue = first?.[comparisonMetric as keyof AggregateResult]?.mean || 1;
                                const change = ((finalValue - startValue) / startValue) * 100;

                                return (
                                  <div key={p.metadata.id} className="flex items-center gap-2 px-2 py-1 bg-slate-800/50 rounded">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                                    <span className="text-[9px] text-slate-400 font-bold">{p.metadata.name}:</span>
                                    <span className="text-[10px] font-mono text-white">{formatCompact(finalValue)}</span>
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


                      <div className="space-y-8">

                        {/* 1. THESIS SCORECARDS ("The Verdict") */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Survival Score */}
                          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <ShieldQuestion size={16} className="text-emerald-400" />
                              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Survival Score</h3>
                            </div>
                            <div className="space-y-3">
                              {PROTOCOL_PROFILES.filter(p => selectedProtocolIds.includes(p.metadata.id)).map(p => {
                                const data = multiAggregated[p.metadata.id] || [];
                                const last = data[data.length - 1];
                                const solvency = last?.solvencyScore?.mean || 0;
                                // Score out of 100 based on Solvency Ratio (1.0 = 100)
                                const score = Math.min(100, Math.max(0, solvency * 100));
                                return (
                                  <div key={p.metadata.id} className="flex flex-col gap-1">
                                    <div className="flex justify-between text-[10px] font-bold">
                                      <span className="text-slate-300">{p.metadata.name}</span>
                                      <span className={score > 80 ? 'text-emerald-400' : score < 50 ? 'text-rose-400' : 'text-amber-400'}>{score.toFixed(0)}/100</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${score > 80 ? 'bg-emerald-500' : score < 50 ? 'bg-rose-500' : 'bg-amber-500'}`} style={{ width: `${score}%` }} />
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          {/* Financial Health */}
                          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <DollarSign size={16} className="text-amber-400" />
                              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Financial Health</h3>
                            </div>
                            <div className="space-y-3">
                              {PROTOCOL_PROFILES.filter(p => selectedProtocolIds.includes(p.metadata.id)).map(p => {
                                const CAPEX_ESTIMATES: Record<string, number> = {
                                  'grass_v1': 0, 'helium_bme_v1': 450, 'adaptive_elastic_v1': 1500,
                                  'filecoin_v1': 2000, 'akash_v1': 1000, 'hivemapper_v1': 300,
                                  'dimo_v1': 350, 'ono_v3_calibrated': 1000
                                };
                                const capex = CAPEX_ESTIMATES[p.metadata.id] || 500;
                                const data = multiAggregated[p.metadata.id] || [];
                                const last = data[data.length - 1];
                                let payback = 999;
                                if (last && last.providers.mean > 0) {
                                  const weeklyProfit = ((last.minted.mean / last.providers.mean) * last.price.mean) - p.parameters.provider_economics.opex_weekly.value;
                                  payback = weeklyProfit <= 0 ? 999 : (capex / (weeklyProfit * 4.3));
                                }
                                const isProfitable = payback < 999;
                                const display = isProfitable ? (capex === 0 ? "Instant" : `${payback.toFixed(1)}m Payback`) : "Unprofitable";

                                return (
                                  <div key={p.metadata.id} className="flex justify-between items-center text-[10px]">
                                    <span className="font-bold text-slate-300">{p.metadata.name}</span>
                                    <span className={`px-2 py-1 rounded border ${isProfitable && payback < 12 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                                      {display}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          {/* Growth Potential */}
                          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <TrendingUp size={16} className="text-indigo-400" />
                              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Growth Potential</h3>
                            </div>
                            <div className="space-y-3">
                              {PROTOCOL_PROFILES.filter(p => selectedProtocolIds.includes(p.metadata.id)).map(p => {
                                const demandType = p.parameters.demand_regime.value;
                                const data = multiAggregated[p.metadata.id] || [];
                                const last = data[data.length - 1];
                                const utilization = last?.utilization?.mean || 0;

                                return (
                                  <div key={p.metadata.id} className="flex justify-between items-center text-[10px]">
                                    <span className="font-bold text-slate-300">{p.metadata.name}</span>
                                    <div className="text-right">
                                      <div className="font-mono text-indigo-400">{utilization.toFixed(1)}% Util</div>
                                      <div className="text-[9px] text-slate-500 capitalize">{demandType} Demand</div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>

                        {/* 2. DETAILED METRICS (Grouped) */}
                        <div className="space-y-6">

                          {/* LAYER 1: THE PHYSICS */}
                          <div>
                            <div className="flex items-center gap-2 mb-4 px-2">
                              <Database size={14} className="text-slate-500" />
                              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Layer 1: The Physics</h4>
                              <div className="h-px bg-slate-800 flex-1 ml-4" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {PROTOCOL_PROFILES.filter(p => selectedProtocolIds.includes(p.metadata.id)).map(p => (
                                <div key={p.metadata.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                                  <div className="flex justify-between mb-2">
                                    <span className="font-black text-indigo-400 uppercase tracking-widest text-xs">{p.metadata.name}</span>
                                    <span className="text-[10px] text-slate-500 font-bold">{p.metadata.mechanism}</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[10px] text-slate-400">
                                    <div className="flex flex-col">
                                      <span className="text-slate-600">Model Type</span>
                                      <span className="font-medium text-slate-300 capitalize">{p.metadata.model_type.replace('_', ' ')}</span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-slate-600">Chain</span>
                                      <span className="font-medium text-slate-300 capitalize">{p.metadata.chain}</span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-slate-600">Max Supply</span>
                                      <span className="font-medium text-slate-300">{formatCompact(p.parameters.supply.value)}</span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-slate-600">Emissions</span>
                                      <span className="font-medium text-slate-300">{formatCompact(p.parameters.emissions.value)}/wk</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* LAYER 2: PRIMARY METRICS (Survival) */}
                          <div>
                            <div className="flex items-center gap-2 mb-4 px-2">
                              <ShieldQuestion size={14} className="text-slate-500" />
                              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Layer 2: Survival Metrics (Primary)</h4>
                              <div className="h-px bg-slate-800 flex-1 ml-4" />
                            </div>

                            <div className="bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden">
                              {/* Comparison Rows */}
                              <div className="divide-y divide-slate-800">
                                {/* Burn/Mint Ratio Row */}
                                <div className="p-4 flex items-center justify-between hover:bg-slate-800/20">
                                  <div className="w-1/4">
                                    <h5 className="text-[10px] font-bold text-slate-400 uppercase">Real Yield (Burn vs Mint)</h5>
                                    <p className="text-[9px] text-slate-600 mt-1">Ratio &gt; 1.0 means deflationary.</p>
                                  </div>
                                  <div className="flex-1 flex justify-end gap-8">
                                    {PROTOCOL_PROFILES.filter(p => selectedProtocolIds.includes(p.metadata.id)).map(p => {
                                      const data = multiAggregated[p.metadata.id] || [];
                                      const solvency = data[data.length - 1]?.solvencyScore?.mean || 0;
                                      return (
                                        <div key={p.metadata.id} className="text-right">
                                          <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1">{p.metadata.name}</span>
                                          <span className={`text-sm font-mono font-bold ${solvency > 0.8 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {solvency.toFixed(2)}x
                                          </span>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>

                                {/* OpEx Coverage Row */}
                                <div className="p-4 flex items-center justify-between hover:bg-slate-800/20">
                                  <div className="w-1/4">
                                    <h5 className="text-[10px] font-bold text-slate-400 uppercase">OpEx Coverage</h5>
                                    <p className="text-[9px] text-slate-600 mt-1">Weekly Cost to run a node.</p>
                                  </div>
                                  <div className="flex-1 flex justify-end gap-8">
                                    {PROTOCOL_PROFILES.filter(p => selectedProtocolIds.includes(p.metadata.id)).map(p => {
                                      const opex = p.parameters.provider_economics.opex_weekly.value;
                                      return (
                                        <div key={p.metadata.id} className="text-right">
                                          <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1">{p.metadata.name}</span>
                                          <span className={`text-sm font-mono font-bold ${opex < 10 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                            ${opex}/wk
                                          </span>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* CHARTS SECTION (Collapsed by default logic or bottom placement) */}
                          <div>
                            <div className="flex items-center gap-2 mb-4 px-2">
                              <Activity size={14} className="text-slate-500" />
                              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Deep Dive: Charts</h4>
                              <div className="h-px bg-slate-800 flex-1 ml-4" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-64">
                                <h5 className="text-[10px] font-bold text-slate-400 uppercase mb-4">Supply Growth</h5>
                                <ResponsiveContainer width="100%" height="90%">
                                  <AreaChart>
                                    <defs>
                                      {PROTOCOL_PROFILES.filter(p => selectedProtocolIds.includes(p.metadata.id)).map(p => (
                                        <linearGradient key={p.metadata.id} id={`gradient-${p.metadata.id}`} x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                      ))}
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.1} />
                                    <XAxis dataKey="t" fontSize={9} tick={{ fill: '#64748b' }} allowDuplicatedCategory={false} />
                                    <YAxis fontSize={9} tick={{ fill: '#64748b' }} tickFormatter={formatCompact} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} />
                                    {PROTOCOL_PROFILES.filter(p => selectedProtocolIds.includes(p.metadata.id)).map((p, i) => {
                                      const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];
                                      return (
                                        <Area
                                          key={p.metadata.id}
                                          data={multiAggregated[p.metadata.id] || []}
                                          type="monotone"
                                          dataKey={(d: any) => d?.supply?.mean}
                                          stroke={colors[i % colors.length]}
                                          fillOpacity={0.1}
                                          fill={colors[i % colors.length]}
                                          name={p.metadata.name}
                                        />
                                      )
                                    })}
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>

                              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-64">
                                <h5 className="text-[10px] font-bold text-slate-400 uppercase mb-4">Solvency Ratio (Burn / Mint)</h5>
                                <ResponsiveContainer width="100%" height="90%">
                                  <LineChart>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.1} />
                                    <XAxis dataKey="t" fontSize={9} tick={{ fill: '#64748b' }} allowDuplicatedCategory={false} />
                                    <YAxis fontSize={9} tick={{ fill: '#64748b' }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} />
                                    <ReferenceLine y={1} stroke="#10b981" strokeDasharray="3 3" />
                                    {PROTOCOL_PROFILES.filter(p => selectedProtocolIds.includes(p.metadata.id)).map((p, i) => {
                                      const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];
                                      return (
                                        <Line
                                          key={p.metadata.id}
                                          data={multiAggregated[p.metadata.id] || []}
                                          type="monotone"
                                          dataKey={(d: any) => d?.solvencyScore?.mean}
                                          stroke={colors[i % colors.length]}
                                          strokeWidth={2}
                                          dot={false}
                                          name={p.metadata.name}
                                        />
                                      )
                                    })}
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  )}
                </div >


                {renderFocusChart()}

              </main >
            </>
          )}
        </div >
      )}

      {/* GLOBAL OVERLAYS - Moved to Root Level */}

      {/* 1. Spec Modal */}
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

      {/* 2. Knowledge Layer Sidebar */}
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

      {/* 3. Export Panel */}
      {
        showExportPanel && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Download size={20} className="text-emerald-400" />
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">Export Simulation Data</h3>
                </div>
                <button onClick={() => setShowExportPanel(false)} className="p-2 text-slate-500 hover:text-white bg-slate-800 rounded-full transition-colors"><X size={18} /></button>
              </div>

              <div className="p-8 grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    exportToCSV(displayedData, `DePIN_Sim_${incentiveRegime.id}_${new Date().toISOString().split('T')[0]}`);
                    setShowExportPanel(false);
                  }}
                  className="p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all group text-left"
                >
                  <FileDown className="text-emerald-400 mb-3 group-hover:scale-110 transition-transform" size={24} />
                  <div className="font-bold text-white text-sm mb-1">CSV Format</div>
                  <div className="text-[10px] text-slate-500">Spreadsheet compatible (Excel, Sheets)</div>
                </button>

                <button
                  onClick={() => {
                    if (derivedMetrics) {
                      exportToJSON(displayedData, params, derivedMetrics, `DePIN_Sim_${incentiveRegime.id}_${new Date().toISOString().split('T')[0]}`);
                      setShowExportPanel(false);
                    }
                  }}
                  className="p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-amber-500/50 hover:bg-amber-500/10 transition-all group text-left"
                >
                  <FileJson className="text-amber-400 mb-3 group-hover:scale-110 transition-transform" size={24} />
                  <div className="font-bold text-white text-sm mb-1">JSON Format</div>
                  <div className="text-[10px] text-slate-500">Raw data for programmatic analysis</div>
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* 4. DePIN Browser */}
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
                                <span className="text-slate-300 font-mono">{formatCompactUtil(data.marketCap)}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">Supply</span>
                                <span className="text-slate-300 font-mono">{formatCompactUtil(data.circulatingSupply)}</span>
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
      {/* 5. System Audit Panel */}
      {showAuditPanel && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <Calculator className="text-indigo-400" size={20} />
                <h4 className="text-sm font-black uppercase tracking-widest text-white">System Calibration Audit (T={params.T})</h4>
              </div>
              <button onClick={() => setShowAuditPanel(false)} className="p-2 text-slate-500 hover:text-white bg-slate-800 rounded-full transition-colors"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2 group p-4 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">Provider ROI (Incentive) <Info size={12} className="opacity-30" /></span>
                <div className="text-xl font-mono text-emerald-400">{((aggregated[aggregated.length - 1]?.incentive?.mean || 0) * 100).toFixed(1)}%</div>
              </div>
              <div className="space-y-2 p-4 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase">System Scarcity</span>
                <div className="text-xl font-mono text-amber-400">{((aggregated[aggregated.length - 1]?.scarcity?.mean || 0) * 100).toFixed(1)}%</div>
              </div>
              <div className="space-y-2 p-4 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Weekly Emission Ratio</span>
                <div className="text-xl font-mono text-indigo-400">{((aggregated[aggregated.length - 1]?.minted?.mean || 0) / (params.initialSupply) * 100).toFixed(4)}%</div>
              </div>
              <div className="space-y-2 p-4 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Realized OpEx</span>
                <div className="text-xl font-mono text-slate-300">CHF {params.providerCostPerWeek.toFixed(2)} / unit</div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowAuditPanel(false)} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all">Close Audit</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
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
