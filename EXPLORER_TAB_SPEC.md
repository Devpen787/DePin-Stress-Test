# DePIN Explorer Tab - Detailed Specification

## Overview

The **Explorer** tab serves as a discovery and ranking layer for DePIN protocols, bridging the gap between browsing (CoinGecko/DePIN Hub) and deep analysis (Sandbox/Comparison). It provides ranked, filterable access to DePIN protocols with quick access to stress testing and comparison.

---

## 1. UI/UX Design

### 1.1 Layout Structure

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  NAVIGATION BAR                                                               │
│  [Sandbox] [Comparison] [Explorer] ← Active                                  │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  HEADER SECTION                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ DePIN Explorer                                    [Search 🔍]           │  │
│  │ Browse, rank, and analyze DePIN protocols                              │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                                │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ FILTERS:                                                               │  │
│  │ [All Projects] [Has Token] [No Token] [Wireless] [Compute] [Storage] │  │
│  │ [AI/ML] [Sensors] [Vehicle] [Other]                                   │  │
│  │                                                                        │  │
│  │ BLOCKCHAIN: [All] [Solana] [Ethereum] [Polygon] [IoTeX] [Helium] ... │  │
│  │                                                                        │  │
│  │ MARKET CAP: [All] [$1B+] [$100M-$1B] [$10M-$100M] [<$10M]            │  │
│  │                                                                        │  │
│  │ RISK LEVEL: [All] [Low] [Medium] [High]                               │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  RANKING TABLE                                                                │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ Sort by: [Market Cap ▼] [Price] [24h Vol] [Stress Score] [Payback]   │  │
│  │ Results: 47 protocols                          [Export CSV] [Export JSON]│
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                                │
│  ┌─────┬──────┬──────────────────┬───────────┬─────────────┬─────────────┐  │
│  │ #   │ Logo │ Protocol         │ Price     │ Market Cap  │ 7d Chart    │  │
│  │     │      │ Category         │ 24h %     │ Supply      │             │  │
│  │     │      │                  │           │             │             │  │
│  ├─────┼──────┼──────────────────┼───────────┼─────────────┼─────────────┤  │
│  │ 1   │ [H]  │ Helium           │ $1.58     │ $285.4M     │ [📈📉📈]    │  │
│  │     │      │ Wireless         │ +2.34% 🟢│ 180M / ∞    │             │  │
│  │     │      │                  │           │             │             │  │
│  │     │      │ Stress: ⚠️ MED   │           │ Live ✓      │ [Analyze]   │  │
│  │     │      │ Payback: 39wk    │           │             │ [Compare]   │  │
│  │     │      │                  │           │             │ [Watch] ⭐  │  │
│  ├─────┼──────┼──────────────────┼───────────┼─────────────┼─────────────┤  │
│  │ 2   │ [R]  │ Render           │ $2.44     │ $1.27B      │ [📈📈📉]    │  │
│  │     │      │ Compute          │ -1.15% 🔴│ 520M/536M   │             │  │
│  │     │      │                  │           │             │             │  │
│  │     │      │ Stress: ⚠️ HIGH  │           │ Live ✓      │ [Analyze]   │  │
│  │     │      │ Payback: ∞       │           │             │ [Compare]   │  │
│  │     │      │                  │           │             │ [Watch] ⭐  │  │
│  └─────┴──────┴──────────────────┴───────────┴─────────────┴─────────────┘  │
│                                                                                │
│  [Pagination: ← Prev] [Page 1 of 5] [Next →]                                 │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  DETAIL MODAL (on row click or [Analyze])                                    │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ [X] Helium (HNT)                                          [Analyze]    │  │
│  │                                                                        │  │
│  │ Quick Stats:                                                           │  │
│  │ Market Cap: $285.4M | Rank: #1 DePIN | Price: $1.58 (+2.34%)         │  │
│  │                                                                        │  │
│  │ Stress Test Results (Last Run):                                       │  │
│  │ • Sustainability Score: 7.2/10                                        │  │
│  │ • Payback Period: 39 weeks                                            │  │
│  │ • Provider Retention: 87%                                             │  │
│  │ • Risk Level: ⚠️ MEDIUM                                                │  │
│  │                                                                        │  │
│  │ [Run New Stress Test] [View Full Analysis]                            │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Table Columns

| Column | Description | Sortable | Width |
|--------|-------------|----------|-------|
| **#** | Rank (1, 2, 3...) | No | 60px |
| **Logo** | Protocol logo/icon | No | 80px |
| **Protocol** | Name + Category badge | No | 200px |
| **Price** | Current price + 24h % change (color-coded) | Yes | 120px |
| **Market Cap** | Market cap + Supply (circulating / max) | Yes | 150px |
| **24h Volume** | 24-hour trading volume | Yes | 120px |
| **7d Chart** | Sparkline price chart (mini) | No | 100px |
| **Stress Score** | Our unique metric (0-10) | Yes | 120px |
| **Actions** | [Analyze] [Compare] [Watch] | No | 180px |

### 1.3 Visual Design Elements

**Colors & Status:**
- 🟢 Green: Positive % change, Low risk, Good sustainability
- 🔴 Red: Negative % change, High risk, Poor sustainability
- 🟡 Amber: Medium risk, Moderate metrics
- 🔵 Blue: Links, buttons, primary actions
- ⭐ Gold: Watchlist/favorites

**Badges:**
- Category: `Wireless`, `Compute`, `Storage`, `AI/ML`, etc.
- Status: `Live ✓` (has live data), `Sim Only` (simulation only)
- Risk: `LOW`, `MEDIUM`, `HIGH` (based on stress test)
- Token: `Has Token`, `No Token`

**Icons:**
- 📈📉 Sparkline chart
- ⚠️ Risk indicator
- ⭐ Watchlist star (filled = watching, outline = not)
- 🔍 Search
- 📊 Export

---

## 2. Features & Functionality

### 2.1 Ranking & Sorting

**Default Sort:** Market Cap (descending)

**Available Sort Options:**
1. Market Cap (default)
2. Price
3. 24h Volume
4. Stress Score (our differentiator - calculated from latest stress test)
5. Payback Period (ascending - shortest first)
6. Provider Count
7. Inflation Rate (ascending - lowest first)
8. Risk Level

**Ranking Logic:**
- Rank (#) is calculated based on current sort column
- When sorting by Market Cap: Rank = position in Market Cap list
- When sorting by Stress Score: Rank = position in Stress Score list
- Rank updates dynamically when sort changes

### 2.2 Filtering

**Category Filters:**
- All Projects (default)
- Has Token / No Token
- Wireless (IoT, 5G, LoRaWAN)
- Compute (GPU, CPU, distributed computing)
- Storage (File storage, CDN)
- AI/ML (AI training, inference)
- Sensors (GPS, mapping, environmental)
- Vehicle (vehicle data, mobility)
- Other

**Blockchain Filters:**
- All Blockchains (default)
- Solana
- Ethereum
- Polygon
- IoTeX
- Helium
- Custom/Other

**Market Cap Tiers:**
- All (default)
- Mega: $1B+
- Large: $100M - $1B
- Mid: $10M - $100M
- Small: <$10M

**Risk Level:**
- All (default)
- Low (Stress Score 7-10)
- Medium (Stress Score 4-7)
- High (Stress Score 0-4)

**Combined Filters:**
- All filters work together (AND logic)
- Active filters shown as badges with [X] to remove
- "Clear All Filters" button

### 2.3 Search

**Search Functionality:**
- Full-text search across:
  - Protocol name
  - Symbol (HNT, RNDR, FIL, etc.)
  - Category
  - Description/keywords
- Real-time search (as you type)
- Search highlights matching text
- "X results found" counter

### 2.4 Actions

**Per-Row Actions:**

1. **[Analyze] Button:**
   - Opens Sandbox tab
   - Pre-loads selected protocol
   - Sets as active profile
   - Runs quick stress test if not cached
   - Smooth transition with loading state

2. **[Compare] Button:**
   - Opens Comparison tab
   - Adds selected protocol
   - Auto-selects 3 similar protocols (same category, similar market cap)
   - Runs matrix simulation
   - Smooth transition

3. **[Watch] Button (Star Icon):**
   - Toggle watchlist status
   - Saves to localStorage (persisted across sessions)
   - "Watched" protocols can be filtered/shown separately
   - Visual feedback: ⭐ (filled) = watching, ☆ (outline) = not watching

**Bulk Actions:**
- Select multiple protocols (checkbox column)
- "Analyze Selected" → Comparison tab with all selected
- "Export Selected" → CSV/JSON of selected protocols

### 2.5 Detail Modal

**Triggered by:**
- Clicking on protocol name/row
- Clicking [Analyze] button

**Content:**
- **Header:** Logo, name, symbol, [X] close, [Analyze] CTA
- **Quick Stats:**
  - Market Cap, Rank, Price, 24h change
  - Supply (circulating / max)
  - 24h Volume
  - Category, Blockchain
- **Stress Test Summary:**
  - Sustainability Score (0-10)
  - Payback Period
  - Provider Retention %
  - Risk Level
  - Last stress test timestamp
- **Actions:**
  - [Run New Stress Test] → Opens Sandbox with custom params
  - [View Full Analysis] → Opens Sandbox with all charts
  - [Compare with Similar] → Opens Comparison

**Modal Behavior:**
- Escape key closes
- Click outside closes
- Responsive (mobile-friendly)

### 2.6 Sparkline Charts

**7-Day Price Chart:**
- Mini line chart (100px width, 30px height)
- Shows price trend over last 7 days
- Color: Green if up, Red if down (vs 7 days ago)
- Hover tooltip: Date, Price
- Data source: CoinGecko historical prices (sampled to daily close, 7 points)

**7-Day Stress Score Chart (Optional):**
- Mini line chart showing stress score trend
- Only shown if multiple stress tests run
- Indicates if protocol is improving/degrading

---

## 3. Data Requirements

### 3.1 Protocol Metadata

```typescript
interface ExplorerProtocol {
  // Identity
  id: string;                    // 'helium_bme_v1'
  name: string;                  // 'Helium'
  symbol: string;                // 'HNT'
  logo: string;                  // URL to logo image
  website: string;               // Official website
  explorer: string;              // Block explorer URL
  description?: string;          // Short protocol summary
  keywords?: string[];           // Searchable tags/keywords
  referencePrice?: number;       // Optional fallback price (if no live data)
  
  // Classification
  category: ProtocolCategory;    // 'wireless' | 'compute' | 'storage' | ...
  blockchain: string;            // 'Solana' | 'Ethereum' | ...
  hasToken: boolean;             // true if has token
  
  // Market Data (from CoinGecko)
  coingeckoId: string;           // 'helium'
  currentPrice: number;          // $1.58
  priceChange24h: number;        // 2.34 (%)
  marketCap: number;             // $285,400,000
  volume24h: number;             // $12,500,000
  circulatingSupply: number;     // 180,000,000
  maxSupply: number | null;      // null (unlimited) or number
  priceHistory7d: number[];      // 7 daily prices (UTC close)
  
  // Our Unique Metrics (from stress tests)
  stressScore: number | null;    // 0-10, null if not tested
  paybackPeriod: number | null;  // Weeks, null if not tested
  providerRetention: number | null; // %, null if not tested
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  lastStressTest: string | null; // ISO timestamp
  
  // Ranking
  rank: number;                  // Calculated based on sort
  rankByMarketCap: number;       // Fixed rank by market cap
  rankByStressScore: number;     // Fixed rank by stress score
}
```

### 3.2 Scoring Definitions (Stress Score, Risk, Payback)

**Stress Score (0-10)**  
A composite of model-derived metrics. Each component is normalized to 0-1, weighted, then scaled to 0-10.

```typescript
function clamp(x: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, x));
}

// Inputs from DerivedMetrics / AggregateResult
const retention = clamp(retentionRate / 100);

const utilization = avgUtilisation; // percent
const utilizationScore =
  utilization < 40
    ? clamp(utilization / 40)
    : utilization <= 80
    ? 1
    : clamp(1 - (utilization - 80) / 20); // 80-100% tapers to 0

const drawdownScore = clamp(1 - maxDrawdown / 80); // 0 at 80% drawdown
const inflationScore = clamp(1 - Math.max(0, inflationRate - 5) / 45); // 0 at >=50%
const deathSpiralScore = clamp(1 - deathSpiralProbability / 50); // 0 at >=50%

const weighted =
  0.25 * retention +
  0.20 * utilizationScore +
  0.20 * drawdownScore +
  0.15 * inflationScore +
  0.20 * deathSpiralScore;

const stressScore = Math.round(weighted * 10 * 10) / 10; // 0-10, 1dp
```

**Risk Level**
- `LOW` if `stressScore >= 7`
- `MEDIUM` if `stressScore >= 4 && < 7`
- `HIGH` if `stressScore < 4`

**Payback Period (weeks)**  
Time to recover cumulative provider profit (aggregate mean).

```typescript
let cumulative = 0;
let payback = Infinity;
for (const step of data) {
  cumulative += step.profit?.mean || 0;
  if (cumulative >= 0) { payback = step.t; break; }
}
```

**Provider Retention (%)**  
Use `retentionRate` from derived metrics (`finalProviders / peakProviders * 100`).

### 3.3 Data Sources

**Primary Sources:**

1. **CoinGecko API** (Market Data)
   - Endpoint: `/api/v3/simple/price`
   - Endpoint: `/api/v3/coins/{id}`
   - Endpoint: `/api/v3/coins/{id}/market_chart` (for 7d chart)
   - Refresh: Every 5 minutes (or per user auto-refresh setting)

2. **Our Simulation Engine** (Stress Test Metrics)
   - Uses existing `PROTOCOL_PROFILES`
   - Runs stress test on-demand or uses cached results
   - Calculates: Stress Score, Payback Period, Risk Level

3. **Protocol Profiles** (Metadata)
   - Existing `PROTOCOL_PROFILES` array
   - Extended with: category, blockchain, website, explorer, optional referencePrice

4. **LocalStorage** (User Data)
   - Watchlist: Array of protocol IDs
   - Last viewed protocols
   - User preferences (default sort, filters)

**Fallback Sources:**
- If CoinGecko fails: Use last known data (cached)
- If stress test fails: Show "Not Tested" state
- Manual override: Admin can add/edit protocols via config

### 3.4 Data Refresh Strategy

**Real-time Updates:**
- Market data (price, volume): Every 5 minutes
- Sparkline charts: Every 1 hour (7-day history sampled to daily close)
- Stress test results: On-demand (user triggers) or cached

**Caching:**
- CoinGecko data: Cache for 5 minutes in memory
- Stress test results: Cache for 1 hour (if params unchanged)
- Protocol metadata: Cache indefinitely (changes rarely)

**Offline/Stale Data:**
- Show "Last updated: 10 min ago" indicator
- "Refresh" button to force update
- Graceful degradation if API fails

---

## 4. Technical Implementation

### 4.1 Component Structure

```
ExplorerTab/
├── ExplorerHeader.tsx          # Search bar, title
├── ExplorerFilters.tsx         # Filter buttons, dropdowns
├── ExplorerTable.tsx           # Main ranking table
│   ├── ExplorerTableRow.tsx    # Individual row component
│   ├── ExplorerSparkline.tsx   # Mini chart component
│   └── ExplorerActions.tsx     # [Analyze] [Compare] [Watch]
├── ExplorerDetailModal.tsx     # Detail modal
├── ExplorerPagination.tsx      # Pagination controls
└── hooks/
    ├── useExplorerData.ts      # Data fetching, caching
    ├── useExplorerFilters.ts   # Filter logic
    └── useExplorerSort.ts      # Sort logic
```

### 4.2 State Management

**State Variables:**
```typescript
const [protocols, setProtocols] = useState<ExplorerProtocol[]>([]);
const [filteredProtocols, setFilteredProtocols] = useState<ExplorerProtocol[]>([]);
const [sortColumn, setSortColumn] = useState<SortColumn>('marketCap');
const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
const [selectedCategory, setSelectedCategory] = useState<string>('all');
const [selectedBlockchain, setSelectedBlockchain] = useState<string>('all');
const [searchQuery, setSearchQuery] = useState<string>('');
const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);
const [loading, setLoading] = useState<boolean>(false);
```

### 4.3 Data Fetching Logic

```typescript
// Pseudo-code for data fetching
async function fetchExplorerData() {
  setLoading(true);
  
  // 1. Fetch market data from CoinGecko (batch request)
  const marketData = await fetchMultipleTokens(
    PROTOCOL_PROFILES.map(p => p.metadata.coingeckoId)
  );
  
  // 2. Merge with protocol profiles
  const protocols = PROTOCOL_PROFILES.map(profile => {
    const market = marketData[profile.metadata.coingeckoId];
    return {
      ...profile,
      ...market,
      stressScore: getCachedStressScore(profile.id),
      paybackPeriod: getCachedPaybackPeriod(profile.id),
      // ... other metrics
    };
  });
  
  // 3. Calculate ranks
  const ranked = calculateRanks(protocols, sortColumn);
  
  setProtocols(ranked);
  setLoading(false);
}
```

### 4.4 Filtering Logic

```typescript
function applyFilters(protocols: ExplorerProtocol[]) {
  let filtered = protocols;
  
  // Category filter
  if (selectedCategory !== 'all') {
    filtered = filtered.filter(p => p.category === selectedCategory);
  }
  
  // Blockchain filter
  if (selectedBlockchain !== 'all') {
    filtered = filtered.filter(p => p.blockchain === selectedBlockchain);
  }
  
  // Search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.symbol.toLowerCase().includes(query)
    );
  }
  
  // Market cap tier
  // Risk level
  // ... other filters
  
  return filtered;
}
```

### 4.5 Sorting Logic

```typescript
function sortProtocols(protocols: ExplorerProtocol[], column: SortColumn, direction: 'asc' | 'desc') {
  return [...protocols].sort((a, b) => {
    let aValue = a[column];
    let bValue = b[column];
    
    // Handle null values
    if (aValue === null) return 1;
    if (bValue === null) return -1;
    
    // Numeric comparison
    const result = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    return direction === 'asc' ? result : -result;
  }).map((p, index) => ({ ...p, rank: index + 1 }));
}
```

---

## 5. Data Update Strategy

### 5.1 Automatic Updates

**Market Data (CoinGecko):**
- **Interval:** Every 5 minutes
- **Method:** Background polling using `setInterval`
- **Optimization:** Only fetch if tab is active (pause when tab hidden)
- **Error Handling:** Retry with exponential backoff on failure

```typescript
useEffect(() => {
  if (viewMode !== 'explorer') return;
  
  const interval = setInterval(async () => {
    try {
      await refreshMarketData();
    } catch (error) {
      console.error('Failed to refresh market data:', error);
      // Use cached data, show "Stale" indicator
    }
  }, 5 * 60 * 1000); // 5 minutes
  
  return () => clearInterval(interval);
}, [viewMode]);
```

**7-Day Price History:**
- **Interval:** Every 1 hour (less frequent, data doesn't change as rapidly)
- **Method:** Background polling
- **Storage:** Cache in localStorage (7-day data = ~7KB per protocol)

**Stress Test Results:**
- **When:** On-demand (user clicks [Analyze] or [Run Stress Test])
- **Caching:** Cache results for 1 hour with params hash
- **Auto-refresh:** If user has "Auto-refresh" enabled, re-run every 24 hours

### 5.2 Manual Updates

**User-Triggered Refresh:**
- **Button:** "Refresh" in header (next to search)
- **Action:** Immediately fetches latest market data
- **Feedback:** Loading spinner, "Refreshing..." message
- **Rate Limit:** Max 1 refresh per 30 seconds (prevent spam)

**Force Stress Test:**
- **Button:** [Run New Stress Test] in detail modal
- **Action:** Runs simulation with current params, updates cache
- **Feedback:** Progress indicator, "Running stress test..."

### 5.3 Protocol Metadata Updates

**Protocol Profiles:**
- **Source:** `PROTOCOL_PROFILES` array in code
- **Update Method:** Manual code changes (version control)
- **Frequency:** When new protocols added or params updated
- **Versioning:** Add version field to profiles, show "v1.2" in UI

**New Protocol Addition Process:**
1. Add entry to `PROTOCOL_PROFILES` array
2. Ensure `coingeckoId` matches CoinGecko
3. Test with stress test
4. Deploy (appears in Explorer automatically)

**Protocol Data Validation:**
- Validate CoinGecko ID exists on app load
- Show warning if CoinGecko data unavailable
- Allow "Simulation Only" mode if no market data

### 5.4 Data Synchronization

**CoinGecko API Integration:**
```typescript
// Existing service (extend src/services/coingecko.ts)
export async function fetchExplorerProtocols(
  protocolIds: string[]
): Promise<Record<string, ExplorerProtocol>> {
  // Batch fetch all protocols at once
  const marketData = await fetchMultipleTokens(protocolIds);
  
  // Merge with protocol profiles
  return PROTOCOL_PROFILES.reduce((acc, profile) => {
    const market = marketData[profile.metadata.coingeckoId || ''];
    if (market) {
      acc[profile.metadata.id] = {
        ...profile,
        ...market,
        // ... merge logic
      };
    }
    return acc;
  }, {} as Record<string, ExplorerProtocol>);
}
```

**Caching Strategy:**
- **In-Memory Cache:** React state (lost on refresh)
- **LocalStorage Cache:** Market data, watchlist, preferences
- **Cache TTL:** 5 minutes for market data, 1 hour for price history

**Cache Invalidation:**
- Invalidate on manual refresh
- Invalidate on tab focus (if >5 min since last fetch)
- Invalidate on protocol selection (ensure fresh data)

### 5.5 Offline/Stale Data Handling

**Stale Data Indicators:**
- Show "Last updated: X min ago" badge
- Color code: Green (<5 min), Yellow (5-15 min), Red (>15 min)
- "Refresh" button always visible

**Graceful Degradation:**
- If CoinGecko API fails: Show cached data + "Data may be stale" warning
- If stress test fails: Show "Not Tested" + [Run Test] button
- If no internet: Show cached data only, disable refresh

### 5.6 Rate Limiting & API Management

**CoinGecko Rate Limits:**
- Free tier: 10-50 calls/minute (depends on plan)
- **Strategy:** Batch requests (fetch all protocols in one call)
- Cache aggressively to minimize API calls
- Use WebSocket if available (CoinGecko Pro)

**Fallback Strategies:**
- Primary: CoinGecko API
- Secondary: Cached data
- Tertiary: Static data from protocol profiles

**API Key Management:**
- Store in environment variable (same as current setup)
- Optional: Allow user to input their own API key (Pro features)
- Show usage indicator if rate limit approached

### 5.7 Stress Test Result Updates

**Caching Stress Test Results:**
```typescript
interface CachedStressTest {
  protocolId: string;
  params: SimulationParams;
  results: DerivedMetrics;
  timestamp: number;
  paramsHash: string; // Hash of params to detect changes
}

// Store in localStorage
function cacheStressTest(protocolId: string, results: DerivedMetrics, params: SimulationParams) {
  const cache: CachedStressTest = {
    protocolId,
    params,
    results,
    timestamp: Date.now(),
    paramsHash: hashParams(params),
  };
  
  localStorage.setItem(`stress_${protocolId}`, JSON.stringify(cache));
}

// Retrieve cached results
function getCachedStressTest(protocolId: string, params: SimulationParams): DerivedMetrics | null {
  const cached = localStorage.getItem(`stress_${protocolId}`);
  if (!cached) return null;
  
  const data: CachedStressTest = JSON.parse(cached);
  
  // Check if params match
  if (data.paramsHash !== hashParams(params)) return null;
  
  // Check if cache is stale (>1 hour)
  if (Date.now() - data.timestamp > 60 * 60 * 1000) return null;
  
  return data.results;
}
```

**Auto-Run Strategy:**
- On first load: Run quick stress test for top 10 protocols (background)
- On protocol selection: Run if no cached result or cache >1 hour old
- User preference: "Auto-run stress tests" toggle (disabled by default to save compute)

---

## 6. Integration with Existing Tabs

### 6.1 Explorer → Sandbox Flow

**User Journey:**
1. User browses Explorer tab
2. Finds protocol of interest
3. Clicks [Analyze] button
4. **Transition:** Explorer → Sandbox
5. Sandbox tab opens with:
   - Selected protocol as active profile
   - Quick stress test auto-runs (if not cached)
   - All charts populated

**Implementation:**
```typescript
function handleAnalyze(protocolId: string) {
  // 1. Set view mode to sandbox
  setViewMode('sandbox');
  
  // 2. Set active profile
  const protocol = PROTOCOL_PROFILES.find(p => p.metadata.id === protocolId);
  if (protocol) {
    setActiveProfile(protocol);
  }
  
  // 3. Trigger stress test
  if (!getCachedStressTest(protocolId)) {
    runSimulation(); // Uses active profile
  }
  
  // 4. Scroll to top of sandbox
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
```

### 6.2 Explorer → Comparison Flow

**User Journey:**
1. User clicks [Compare] on Explorer row
2. **Transition:** Explorer → Comparison
3. Comparison tab opens with:
   - Selected protocol + 3 similar protocols (auto-selected)
   - "Run Matrix" auto-triggers (or uses cached results)

**Similar Protocol Selection Logic:**
```typescript
function findSimilarProtocols(protocolId: string, count: number = 3): string[] {
  const protocol = PROTOCOL_PROFILES.find(p => p.metadata.id === protocolId);
  if (!protocol) return [];
  
  // 1. Same category
  const sameCategory = PROTOCOL_PROFILES.filter(
    p => p.category === protocol.category && p.metadata.id !== protocolId
  );
  
  // 2. Similar market cap (±50%)
  const similarMarketCap = sameCategory.filter(p => {
    const protocolMC = getMarketCap(protocolId);
    const pMC = getMarketCap(p.metadata.id);
    return Math.abs(protocolMC - pMC) / protocolMC < 0.5;
  });
  
  // 3. Return top N by market cap
  return similarMarketCap
    .sort((a, b) => getMarketCap(b.metadata.id) - getMarketCap(a.metadata.id))
    .slice(0, count)
    .map(p => p.metadata.id);
}
```

### 6.3 Shared State

**Watchlist (Cross-Tab):**
- Stored in localStorage
- Accessible from all tabs
- "Watched" filter in Explorer
- Star icon in Comparison tab

**Last Viewed (Cross-Tab):**
- Track last 5 viewed protocols
- Show in "Recent" section in Explorer
- Quick access from header dropdown

---

## 7. Mobile Responsiveness

### 7.1 Layout Adaptations

**Desktop (>1024px):**
- Full table with all columns
- Side-by-side filters
- Detail modal overlay

**Tablet (768px - 1024px):**
- Reduced columns (hide 24h Volume, hide sparkline)
- Stacked filters
- Full-screen modal

**Mobile (<768px):**
- Card view instead of table
- Collapsible filters
- Bottom sheet modal

**Card View (Mobile):**
```
┌─────────────────────────────┐
│ [Logo] Helium (HNT)         │
│ Rank #1 | Wireless          │
│                             │
│ Price: $1.58 (+2.34%)      │
│ Market Cap: $285.4M         │
│ Stress: ⚠️ MED | 39wk       │
│                             │
│ [Analyze] [Compare] [Watch] │
└─────────────────────────────┘
```

---

## 8. Performance Optimizations

### 8.1 Lazy Loading

- **Table Rows:** Virtual scrolling (render only visible rows)
- **Sparklines:** Lazy load charts (only when row visible)
- **Images:** Lazy load protocol logos
- **Pagination:** Load 20 protocols per page

### 8.2 Memoization

- Memoize filtered/sorted protocols
- Memoize sparkline chart components
- Debounce search input (500ms delay)

### 8.3 Data Optimization

- Batch API requests (fetch all protocols at once)
- Compress localStorage data (JSON compression)
- Cache aggressively (minimize API calls)

---

## 9. Future Enhancements (v2)

### 9.1 Advanced Features

- **Custom Rankings:** User-defined ranking criteria
- **Portfolio Tracker:** Track multiple protocols, calculate portfolio stress score
- **Alerts:** Notify when stress score changes significantly
- **Export:** Export rankings, filters, watchlist to CSV/JSON
- **Share:** Generate shareable link to filtered/ranked view

### 9.2 Social Features

- **Community Rankings:** Aggregate stress scores from multiple users
- **Comments:** Users can comment on protocols
- **Voting:** Upvote/downvote protocols

### 9.3 Analytics

- **Protocol Trends:** Show stress score over time (if multiple tests run)
- **Category Comparison:** Compare categories (Wireless vs Compute)
- **Historical Data:** Track protocol performance over weeks/months

---

## 10. Success Metrics

### 10.1 User Engagement

- **Time in Explorer:** Average time spent browsing
- **Click-Through Rate:** % of protocols that lead to [Analyze]
- **Watchlist Usage:** % of users who use watchlist
- **Search Usage:** % of users who use search

### 10.2 Feature Adoption

- **Filter Usage:** Which filters are used most
- **Sort Usage:** Which sort columns are preferred
- **Detail Modal:** % of protocols where detail modal opened

### 10.3 Data Quality

- **Data Freshness:** Average time since last update
- **API Success Rate:** % of successful CoinGecko API calls
- **Cache Hit Rate:** % of requests served from cache

---

## 11. Implementation Checklist

### Phase 1: Core Table (MVP)
- [ ] Create Explorer tab component
- [ ] Implement basic table with columns
- [ ] Add sorting functionality
- [ ] Integrate CoinGecko API for market data
- [ ] Add protocol profiles to table

### Phase 2: Filtering & Search
- [ ] Add category filters
- [ ] Add blockchain filters
- [ ] Add market cap filters
- [ ] Implement search functionality
- [ ] Add filter badges with remove

### Phase 3: Actions & Integration
- [ ] Implement [Analyze] button (→ Sandbox)
- [ ] Implement [Compare] button (→ Comparison)
- [ ] Implement [Watch] button (localStorage)
- [ ] Add detail modal
- [ ] Add sparkline charts

### Phase 4: Data Updates
- [ ] Implement auto-refresh (5 min interval)
- [ ] Add manual refresh button
- [ ] Implement caching strategy
- [ ] Add stale data indicators
- [ ] Add error handling

### Phase 5: Polish
- [ ] Mobile responsive design
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Performance optimizations

---

## 12. Open Questions & Decisions Needed

1. **Protocol Coverage:** How many protocols to include initially? (Start with 7 existing, expand to 20-30?)
2. **Stress Test Auto-Run:** Should we auto-run stress tests on page load? (Computationally expensive)
3. **Default Sort:** Market Cap (familiar) vs Stress Score (unique)?
4. **Pagination vs Infinite Scroll:** Which UX is preferred?
5. **Export Format:** CSV only, or also JSON, PDF?
6. **Admin Panel:** Do we need a way to add/edit protocols without code changes?

---

**End of Specification**
