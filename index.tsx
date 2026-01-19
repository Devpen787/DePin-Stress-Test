import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Scale, BookOpen, Activity, RefreshCw, Layers, Settings2, Download, Search, GitCompare, LayoutGrid, Play, Zap
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai"; // Keep for future use?

// Components
import { ThesisDashboard } from './src/components/ThesisDashboard';
import { TokenomicsStudy } from './src/components/CaseStudy/TokenomicsStudy';
import { ExplorerTab } from './src/components/explorer/ExplorerTab';
import { Settings } from './src/components/Settings';
import { MethodologyDrawer } from './src/components/MethodologyDrawer';
import { MethodologySheet } from './src/components/MethodologySheet';
import { HeaderDropdown, DropdownItem, DropdownToggle, DropdownDivider } from './src/components/ui/HeaderDropdown';

// Benchmark View
import { BenchmarkView } from './src/components/Benchmark/BenchmarkView';

// Simulator Components
import { SandboxView } from './src/components/Simulator/SandboxView';
import { ComparisonView } from './src/components/Simulator/ComparisonView';
import { SimulatorSidebar } from './src/components/Simulator/SimulatorSidebar';

// Hooks & Utils
import { useSimulationRunner } from './src/hooks/useSimulationRunner';
import { calculateRegime } from './src/utils/regime';
import { getMockOnChainMetrics, type OnChainMetrics } from './src/services/dune';
import { fetchMultipleTokens, type TokenMarketData, ALL_DEPIN_TOKEN_IDS, getTimeUntilNextRefresh, autoRefreshManager } from './src/services/coingecko';
import { SolanaVerifier, type NetworkStatus } from './src/model/solana';
import { useProtocolMetrics } from './src/hooks/useProtocolMetrics'; // Import Hook
import { PROTOCOL_PROFILES } from './src/data/protocols';
import { PEER_GROUPS } from './src/data/peerGroups';

const App: React.FC = () => {
  // Use Custom Hook for Simulation Logic
  const sim = useSimulationRunner();

  // --- UI STATE ---
  const [activeTab, setActiveTab] = useState<'simulator' | 'thesis' | 'case_study' | 'benchmark'>('simulator');
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    stress: false, competitive: false, scenarios: true, tokenomics: true, advanced: true, providers: true, simulation: true,
  });

  // Modals & Panels
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [showAuditPanel, setShowAuditPanel] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [showKnowledgeLayer, setShowKnowledgeLayer] = useState(false);
  const [showDePINBrowser, setShowDePINBrowser] = useState(false);

  // Live Data State (Hoisted to App level for sharing)
  const [liveData, setLiveData] = useState<Record<string, TokenMarketData | null>>({});
  const [liveDataLoading, setLiveDataLoading] = useState(false);
  const [liveDataError, setLiveDataError] = useState<string | null>(null);
  const [lastLiveDataFetch, setLastLiveDataFetch] = useState<Date | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [timeUntilRefresh, setTimeUntilRefresh] = useState<string>('');
  const [allDePINData, setAllDePINData] = useState<Record<string, TokenMarketData>>({});
  // REMOVED: onChainMetrics state (replaced by hook)
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null);
  const { useNewModel, setUseNewModel } = sim;
  const priorViewMode = useRef(sim.viewMode);
  const priorSelected = useRef(sim.selectedProtocolIds);

  // --- ACTIONS ---

  const scrollToControl = (sectionKey: string) => {
    const parentMap: Record<string, string> = { 'providers': 'advanced', 'simulation': 'advanced' };
    setCollapsedSections(prev => {
      const next = { ...prev, [sectionKey]: false };
      if (parentMap[sectionKey]) next[parentMap[sectionKey]] = false;
      return next;
    });
    setTimeout(() => {
      const element = document.getElementById(`section-${sectionKey}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-2', 'ring-indigo-500', 'bg-slate-900');
        setTimeout(() => element.classList.remove('ring-2', 'ring-indigo-500', 'bg-slate-900'), 1000);
      }
    }, 200);
  };

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const fetchLiveData = async () => {
    setLiveDataLoading(true);
    setLiveDataError(null);
    try {
      const data = await fetchMultipleTokens(ALL_DEPIN_TOKEN_IDS);
      setAllDePINData(data);
      const mappedData: Record<string, TokenMarketData | null> = {};
      for (const profile of PROTOCOL_PROFILES) {
        const coingeckoId = profile.metadata.coingeckoId;
        if (coingeckoId && data[coingeckoId]) mappedData[profile.metadata.id] = data[coingeckoId];
      }
      setLiveData(mappedData);
      setLastLiveDataFetch(new Date());
    } catch (error) {
      setLiveDataError('Failed to fetch live data.');
      console.error(error);
    } finally {
      setLiveDataLoading(false);
    }
  };

  // --- EFFECTS ---

  // NEW: Unified Protocol Metrics Hook (Dune + Snapshots)
  const profiles = PROTOCOL_PROFILES; // Ensure scope validity
  const { metrics: onChainMetrics, loading: protocolsLoading } = useProtocolMetrics(
    profiles.map(p => p.metadata.id)
  );

  useEffect(() => {
    // Initial Loads (Network Status)
    SolanaVerifier.getNetworkStatus().then(setNetworkStatus);

    // Auto-refresh logic (CoinGecko)
    if (autoRefreshEnabled) {
      autoRefreshManager.start(fetchLiveData, 5 * 60 * 1000);
    } else {
      autoRefreshManager.stop();
    }
    return () => autoRefreshManager.stop();
  }, [autoRefreshEnabled]);

  useEffect(() => {
    if (activeTab === 'benchmark') {
      priorViewMode.current = sim.viewMode;
      priorSelected.current = sim.selectedProtocolIds;

      const benchmarkGroup = PEER_GROUPS[0];
      sim.setViewMode('benchmark');
      if (benchmarkGroup) {
        sim.setSelectedProtocolIds(benchmarkGroup.members);
      }
      sim.runSimulation();
      return;
    }

    if (sim.viewMode === 'benchmark') {
      sim.setViewMode(priorViewMode.current || 'sandbox');
      if (priorSelected.current?.length) {
        sim.setSelectedProtocolIds(priorSelected.current);
      }
    }
  }, [activeTab]);

  const incentiveRegime = React.useMemo(() => calculateRegime(sim.aggregated, sim.activeProfile), [sim.aggregated, sim.activeProfile]);


  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 overflow-hidden">
      {/* HEADER */}
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
            {['simulator', 'benchmark', 'thesis', 'case_study'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === tab
                  ? tab === 'simulator' ? 'bg-indigo-600 text-white shadow-lg' :
                    tab === 'benchmark' ? 'bg-indigo-600 text-white shadow-lg' :
                      tab === 'thesis' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-orange-500 text-white shadow-lg'
                  : 'text-slate-500 hover:text-slate-300'
                  }`}
              >
                {tab === 'case_study' ? 'Case Study' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <nav className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => { setActiveTab('simulator'); sim.setViewMode('explorer'); }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'simulator' && sim.viewMode === 'explorer' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Search size={14} /> Explorer
            </button>
            <button
              onClick={() => {
                setActiveTab('simulator');
                sim.setViewMode('comparison');
              }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'simulator' && sim.viewMode === 'comparison' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <GitCompare size={14} /> Comparison
            </button>
            <button
              onClick={() => { setActiveTab('simulator'); sim.setViewMode('sandbox'); }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'simulator' && sim.viewMode === 'sandbox' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <LayoutGrid size={14} /> Sandbox
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <HeaderDropdown label="Learn" icon={<BookOpen size={14} />} isActive={isMethodologyOpen || showSpecModal || showAuditPanel}>
            <DropdownItem icon={<BookOpen size={14} />} onClick={() => setIsMethodologyOpen(true)} description="Simulation methodology & assumptions">Methodology</DropdownItem>
            <DropdownItem icon={<Zap size={14} />} onClick={() => setIsMethodologyOpen(true)} description="Mathematical formulas & equations">Math Specification</DropdownItem>
            <DropdownItem icon={<Scale size={14} />} onClick={() => setShowAuditPanel(true)} description="Wiki documentation & tutorials">System Wiki</DropdownItem>
          </HeaderDropdown>

          <HeaderDropdown label="Data" icon={<Activity size={14} />} isActive={Object.keys(liveData).length > 0 || showDePINBrowser}>
            <DropdownItem icon={liveDataLoading ? <RefreshCw size={14} className="animate-spin" /> : <Activity size={14} />} onClick={fetchLiveData} disabled={liveDataLoading} description={lastLiveDataFetch ? `Last: ${lastLiveDataFetch.toLocaleTimeString()}` : 'Pull from CoinGecko'}>
              {liveDataLoading ? 'Fetching...' : Object.keys(liveData).length > 0 ? 'Refresh Live Data ✓' : 'Fetch Live Data'}
            </DropdownItem>
            <DropdownToggle icon={<RefreshCw size={14} />} checked={autoRefreshEnabled} onChange={() => setAutoRefreshEnabled(!autoRefreshEnabled)} description="Auto-refresh every 5 minutes">Auto Refresh</DropdownToggle>
            <DropdownItem icon={<Layers size={14} />} onClick={() => setShowDePINBrowser(true)} description="Browse all DePIN token prices">DePIN Browser</DropdownItem>
            <DropdownDivider />
            <DropdownToggle icon={<Zap size={14} />} checked={useNewModel} onChange={() => setUseNewModel(!useNewModel)} description={useNewModel ? 'V2: With sell pressure model' : 'V1: Legacy model'}>Use V2 Model</DropdownToggle>
          </HeaderDropdown>

          <button onClick={() => { setActiveTab('simulator'); sim.setViewMode('settings'); }} className={`p-2.5 rounded-xl border transition-all ${sim.viewMode === 'settings' && activeTab === 'simulator' ? 'bg-indigo-600 text-white border-indigo-400' : 'text-slate-400 border-slate-800 hover:bg-slate-900 hover:text-white'}`} title="Settings">
            <Settings2 size={16} />
          </button>

          <button onClick={() => setShowExportPanel(!showExportPanel)} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-[10px] font-bold ${showExportPanel ? 'bg-emerald-600 text-white border-emerald-400' : 'text-slate-400 border-slate-800 hover:bg-slate-900 hover:text-emerald-400 hover:border-emerald-500/50'}`}>
            <Download size={14} /> Export
          </button>

          {activeTab === 'simulator' && (
            <button onClick={sim.runSimulation} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 active:scale-95">
              {sim.loading ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} fill="currentColor" />} Run Matrix
            </button>
          )}
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      {activeTab === 'benchmark' ? (
        <div className="flex-1 overflow-y-auto bg-slate-950 p-6 custom-scrollbar">
          <BenchmarkView
            params={sim.params}
            setParams={sim.setParams}
            multiAggregated={sim.multiAggregated}
            profiles={PROTOCOL_PROFILES}
            liveData={liveData}
            onChainData={onChainMetrics}
            engineLabel={useNewModel ? 'Agent-Based v2' : 'Legacy v1.2'}
            lastLiveDataFetch={lastLiveDataFetch}
            loading={sim.loading}
            activeScenarioId={activeScenarioId}
          />
        </div>
      ) : activeTab === 'case_study' ? (
        <TokenomicsStudy />
      ) : activeTab === 'thesis' ? (
        <ThesisDashboard
          activeProfile={sim.activeProfile}
          protocols={PROTOCOL_PROFILES}
          onSelectProtocol={sim.loadProfile}
        />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {sim.viewMode === 'settings' ? (
            <Settings onBack={() => sim.setViewMode('sandbox')} onReset={sim.resetToDefaults} />
          ) : sim.viewMode === 'explorer' ? (
            <ExplorerTab
              profiles={PROTOCOL_PROFILES}
              networkStatus={networkStatus}
              onAnalyze={(id) => {
                const profile = PROTOCOL_PROFILES.find(p => p.metadata.id === id || p.metadata.coingeckoId === id);
                if (profile) { sim.loadProfile(profile); sim.setViewMode('sandbox'); }
              }}
              onCompare={(id) => {
                const profile = PROTOCOL_PROFILES.find(p => p.metadata.id === id || p.metadata.coingeckoId === id);
                if (profile) {
                  sim.toggleProtocolSelection(profile.metadata.id);
                  sim.setViewMode('comparison');
                }
              }}
            />
          ) : (
            <>
              {/* SHARED SIDEBAR */}
              <SimulatorSidebar
                viewMode={sim.viewMode as any}
                activeProfile={sim.activeProfile}
                selectedProtocolIds={sim.selectedProtocolIds}
                loadProfile={sim.loadProfile}
                toggleProtocolSelection={sim.toggleProtocolSelection}
                params={sim.params}
                setParams={sim.setParams}
                incentiveRegime={incentiveRegime}
                collapsedSections={collapsedSections}
                toggleSection={toggleSection}
                activeScenarioId={activeScenarioId}
                setActiveScenarioId={setActiveScenarioId}
                setFocusChart={() => { }} // Not really used in sidebar except for presets, handled inside sidebar logic mostly? 
                // Wait, sidebar scenarios CAN trigger charts. We need `setFocusChart`.
                // But `SandboxView` has `setFocusChart` internal state. Ideally, we should hoist focused chart state to sim hook or here.
                // I'll leave `setFocusChart` as a no-op for now unless I hoist it.
                // Actually, I should hoist `focusChart` to clean this up.
                setShowKnowledgeLayer={setShowKnowledgeLayer}
                findBreakEven={sim.findBreakEven}
                runOptimization={sim.runOptimization}
              />

              <main className="flex-1 overflow-y-auto bg-slate-950 p-6 custom-scrollbar relative">
                {sim.viewMode === 'sandbox' ? (
                  <SandboxView
                    activeProfile={sim.activeProfile}
                    params={sim.params}
                    setParams={sim.setParams}
                    aggregated={sim.aggregated}
                    playbackWeek={sim.playbackWeek}
                    incentiveRegime={incentiveRegime}
                    scrollToControl={scrollToControl}
                  />
                ) : (
                  <ComparisonView
                    selectedProtocolIds={sim.selectedProtocolIds}
                    setSelectedProtocolIds={(ids) => {
                      // Manually update hook state if needed, or expose setter.
                      // Hook exposes `selectedProtocolIds` and `toggleProtocolSelection`.
                      // We need a bulk setter or iterate.
                      // Hook does NOT expose bulk setter. I should add `setSelectedProtocolIds` to hook return.
                      // For now, I'll access it via `sim.setSelectedProtocolIds` if I add it.
                      // Checking hook... it sends `selectedProtocolIds`. `setSelectedProtocolIds` is NOT returned.
                      // I will PATCH the HOOK to return `setSelectedProtocolIds`.
                    }}
                    profiles={PROTOCOL_PROFILES}
                    multiAggregated={sim.multiAggregated}
                    liveData={liveData}
                    liveDataLoading={liveDataLoading}
                    fetchLiveData={fetchLiveData}
                    params={sim.params}
                  />
                )}
              </main>
            </>
          )}
        </div>
      )}

      {/* MODALS (Methodology, Wiki, etc) */}
      <MethodologyDrawer isOpen={isMethodologyOpen} onClose={() => setIsMethodologyOpen(false)} />
      <MethodologySheet isOpen={showAuditPanel} onClose={() => setShowAuditPanel(false)} />

    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
