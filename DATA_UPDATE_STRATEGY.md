# Data Update Strategy for Explorer Tab

## Overview

This document details how to keep the Explorer tab data fresh and up-to-date, balancing real-time accuracy with API rate limits and performance.

---

## 1. Data Update Architecture

### 1.1 Data Layers

```
┌─────────────────────────────────────────────────────────┐
│  USER INTERFACE (Explorer Tab)                          │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  CACHING LAYER (React State + LocalStorage)             │
│  • In-memory cache (React state)                        │
│  • Persistent cache (LocalStorage)                      │
│  • Cache TTL management                                 │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  DATA FETCHING LAYER (API Services)                     │
│  • CoinGecko API (market data)                          │
│  • Simulation Engine (stress tests)                     │
│  • Protocol Profiles (metadata)                         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  EXTERNAL SOURCES                                       │
│  • CoinGecko (price, market cap, volume)                │
│  • On-chain data (future: Dune Analytics)               │
│  • Our simulation results                                │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Update Intervals & Priorities

### 2.1 Market Data (CoinGecko)

| Data Type | Update Frequency | Priority | Cache TTL |
|-----------|-----------------|----------|-----------|
| **Price** | Every 5 minutes | High | 5 minutes |
| **24h Volume** | Every 5 minutes | High | 5 minutes |
| **Market Cap** | Every 5 minutes | High | 5 minutes |
| **24h % Change** | Every 5 minutes | High | 5 minutes |
| **7-Day Price History** | Every 1 hour | Medium | 1 hour |
| **Circulating Supply** | Daily (rarely changes) | Low | 24 hours |
| **Max Supply** | Once (rarely changes) | Low | 30 days |

**Rationale:**
- **5 minutes** for price/volume: Balance between freshness and API rate limits
- **1 hour** for 7-day history: Sample daily close points (7 total)
- **Daily** for supply: Only changes during token releases/locks, very infrequent

### 2.2 Stress Test Results

| Data Type | Update Frequency | Priority | Cache TTL |
|-----------|-----------------|----------|-----------|
| **Stress Score** | On-demand | High | 1 hour |
| **Payback Period** | On-demand | High | 1 hour |
| **Provider Retention** | On-demand | High | 1 hour |
| **Risk Level** | On-demand | High | 1 hour |

**Update Triggers:**
- User clicks [Analyze] or [Run Stress Test]
- Auto-run for top 10 protocols (if enabled)
- Background refresh (if cache >1 hour old and user has "Auto-refresh" enabled)

**Rationale:**
- **On-demand:** Stress tests are computationally expensive, shouldn't run unnecessarily
- **1 hour cache:** Results are valid for a while, unless simulation params change

### 2.3 Protocol Metadata

| Data Type | Update Frequency | Priority | Cache TTL |
|-----------|-----------------|----------|-----------|
| **Name, Logo, Website** | On code deploy | Low | Indefinite |
| **Category, Blockchain** | On code deploy | Low | Indefinite |
| **CoinGecko ID** | On code deploy | Low | Indefinite |

**Update Method:** Manual code changes, deployed via git

---

## 3. Update Mechanisms

### 3.1 Automatic Background Updates

**Implementation:**
```typescript
// src/hooks/useExplorerData.ts
import { useEffect, useRef } from 'react';

export function useExplorerData(isExplorerActive: boolean) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);
  
  useEffect(() => {
    // Initial fetch
    fetchMarketData();
    
    // Set up interval (5 minutes)
    intervalRef.current = setInterval(() => {
      // Only update if tab is active (save resources)
      if (isExplorerActive && document.visibilityState === 'visible') {
        fetchMarketData();
        lastUpdateRef.current = Date.now();
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    // Pause when tab is hidden
    const handleVisibilityChange = () => {
      if (!isExplorerActive || document.visibilityState === 'hidden') {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      } else {
        // Resume when tab becomes visible
        if (Date.now() - lastUpdateRef.current > 5 * 60 * 1000) {
          fetchMarketData(); // Immediate refresh if stale
        }
        intervalRef.current = setInterval(() => {
          fetchMarketData();
        }, 5 * 60 * 1000);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}
```

**Smart Updates:**
- **Tab Active Check:** Only update when Explorer view is active and browser tab visible
- **Visibility API:** Pause updates when browser tab is hidden
- **Stale Check:** Refresh immediately if data is stale when tab becomes visible

### 3.2 Manual Refresh

**User-Triggered:**
```typescript
// Refresh button in header
function handleManualRefresh() {
  setRefreshing(true);
  
  Promise.all([
    fetchMarketData(true), // Force refresh (bypass cache)
    fetchPriceHistory(true),
  ])
    .then(() => {
      setRefreshing(false);
      showToast('Data refreshed', 'success');
    })
    .catch((error) => {
      setRefreshing(false);
      showToast('Refresh failed. Using cached data.', 'error');
    });
}
```

**Rate Limiting:**
- Maximum 1 manual refresh per 30 seconds
- Disable button during refresh (prevent spam)
- Show "Refreshing..." state with spinner

### 3.3 Event-Driven Updates

**On Protocol Selection:**
- When user clicks [Analyze]: Check if stress test cache is stale, run if needed
- When user opens detail modal: Fetch latest market data for that protocol only

**On Tab Switch:**
- When switching to Explorer tab: Check if data is stale, refresh if >5 min old

**On Page Focus:**
- When browser tab regains focus: Refresh if data is >5 min old

---

## 4. Caching Strategy

### 4.1 Cache Structure

```typescript
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheStore {
  marketData: Record<string, CacheEntry>;
  priceHistory: Record<string, CacheEntry>;
  stressTests: Record<string, CacheEntry>;
}
```

### 4.2 Cache Storage

**In-Memory Cache (React State):**
- Fast access, lost on page refresh
- Used for active data during session
- Size: ~50-100KB (acceptable for in-memory)

**LocalStorage Cache:**
- Persistent across sessions
- Used for: watchlist, user preferences, last viewed protocols
- Used for: 7-day price history (larger data)
- Size limit: ~5-10MB (localStorage limit ~10MB)

**Cache Keys:**
```typescript
const CACHE_KEYS = {
  marketData: (protocolId: string) => `market_${protocolId}`,
  priceHistory: (protocolId: string) => `history_${protocolId}`,
  stressTest: (protocolId: string, paramsHash: string) => `stress_${protocolId}_${paramsHash}`,
  watchlist: 'watchlist',
  preferences: 'explorer_prefs',
};
```

### 4.3 Cache Invalidation

**Time-Based (TTL):**
- Market data: Expire after 5 minutes
- Price history: Expire after 1 hour
- Stress tests: Expire after 1 hour

**Event-Based:**
- Manual refresh: Clear all caches
- Param change: Clear stress test cache for that protocol
- API error: Keep cache, mark as stale

**Implementation:**
```typescript
function getCachedData<T>(key: string, ttl: number): T | null {
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  
  const entry: CacheEntry = JSON.parse(cached);
  const age = Date.now() - entry.timestamp;
  
  if (age > ttl) {
    // Expired, remove from cache
    localStorage.removeItem(key);
    return null;
  }
  
  return entry.data as T;
}

function setCachedData<T>(key: string, data: T, ttl: number): void {
  const entry: CacheEntry = {
    data,
    timestamp: Date.now(),
    ttl,
  };
  
  localStorage.setItem(key, JSON.stringify(entry));
}
```

---

## 5. API Rate Limiting & Optimization

### 5.1 CoinGecko API Limits

**Free Tier:**
- 10-50 calls per minute (varies)
- 10,000 calls per month

**Optimization Strategies:**

1. **Batch Requests:**
   ```typescript
   // Instead of 7 separate calls:
   // GET /coins/bitcoin
   // GET /coins/ethereum
   // ...
   
   // Do 1 batch call:
   // GET /simple/price?ids=bitcoin,ethereum,filecoin,...&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true
   ```

2. **Request Coalescing:**
   - If multiple components request same data, batch into single request
   - Debounce rapid refresh requests

3. **Pagination:**
   - Fetch all protocols for ranking correctness
   - Lazy-load heavy fields (7d history, sparklines) per page

4. **Conditional Updates:**
   - Only fetch if cache is stale
   - Skip if data is fresh (<5 min old)

### 5.2 Request Batching

```typescript
// src/services/coingecko.ts (extend existing)

export async function fetchBatchMarketData(
  tokenIds: string[]
): Promise<Record<string, TokenMarketData>> {
  // Batch all IDs into single request
  const idsParam = tokenIds.join(',');
  
  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${idsParam}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`
  );
  
  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Transform to our format
  return Object.entries(data).reduce((acc, [id, info]: [string, any]) => {
    acc[id] = {
      id,
      currentPrice: info.usd,
      marketCap: info.usd_market_cap,
      volume24h: info.usd_24h_vol,
      priceChange24h: info.usd_24h_change || 0,
      lastUpdated: new Date(info.last_updated_at * 1000).toISOString(),
    };
    return acc;
  }, {} as Record<string, TokenMarketData>);
}
```

### 5.3 Rate Limit Handling

```typescript
class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number = 45; // Conservative limit
  private windowMs: number = 60 * 1000; // 1 minute
  
  canMakeRequest(): boolean {
    const now = Date.now();
    // Remove requests outside window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    return this.requests.length < this.maxRequests;
  }
  
  recordRequest(): void {
    this.requests.push(Date.now());
  }
  
  async waitIfNeeded(): Promise<void> {
    if (!this.canMakeRequest()) {
      const oldest = Math.min(...this.requests);
      const waitTime = this.windowMs - (Date.now() - oldest) + 100; // +100ms buffer
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    this.recordRequest();
  }
}

const rateLimiter = new RateLimiter();

export async function fetchWithRateLimit<T>(
  fetchFn: () => Promise<T>
): Promise<T> {
  await rateLimiter.waitIfNeeded();
  return fetchFn();
}
```

---

## 6. Error Handling & Fallbacks

### 6.1 Error Types

**Network Errors:**
- No internet connection
- Timeout (API slow)
- DNS resolution failure

**API Errors:**
- 429 (Rate limit exceeded)
- 500 (Server error)
- 404 (Protocol not found)

**Data Errors:**
- Invalid JSON response
- Missing required fields
- Type mismatches

### 6.2 Fallback Strategy

```typescript
async function fetchMarketDataWithFallback(protocolId: string): Promise<TokenMarketData | null> {
  try {
    // Try fresh fetch
    const data = await fetchMarketData(protocolId);
    return data;
  } catch (error) {
    console.error(`Failed to fetch market data for ${protocolId}:`, error);
    
    // Fallback 1: Check cache (even if stale)
    const cached = getCachedData<TokenMarketData>(
      CACHE_KEYS.marketData(protocolId),
      Infinity // Accept any age
    );
    
    if (cached) {
      return { ...cached, stale: true }; // Mark as stale
    }
    
    // Fallback 2: Use optional reference price if provided in metadata
    const profile = PROTOCOL_PROFILES.find(p => p.metadata.id === protocolId);
    if (profile && profile.metadata?.referencePrice) {
      return {
        id: protocolId,
        currentPrice: profile.metadata.referencePrice,
        marketCap: 0,
        volume24h: 0,
        priceChange24h: 0,
        stale: true,
        fallback: true,
      };
    }

    return null;
  }
}
```

### 6.3 User Feedback

**Loading States:**
- Show skeleton loaders while fetching
- Show "Refreshing..." indicator during updates

**Error States:**
- Show "⚠️ Data may be stale" badge if using cached data
- Show "🔄 Refresh failed" toast on manual refresh failure
- Show "📡 No connection" if offline

**Stale Data Indicators:**
```typescript
function getDataFreshnessBadge(lastUpdate: number): React.ReactNode {
  const age = Date.now() - lastUpdate;
  const minutes = Math.floor(age / 60000);
  
  if (minutes < 5) {
    return <span className="badge-green">Live</span>;
  } else if (minutes < 15) {
    return <span className="badge-yellow">{minutes}m ago</span>;
  } else {
    return <span className="badge-red">Stale ({minutes}m ago)</span>;
  }
}
```

---

## 7. Monitoring & Analytics

### 7.1 Key Metrics to Track

**Update Performance:**
- Average fetch time
- Cache hit rate
- API success rate
- Rate limit hits

**Data Freshness:**
- Average data age
- % of data <5 min old
- % of stale data (>15 min old)

**User Behavior:**
- Frequency of manual refreshes
- Time between refreshes
- Protocols viewed most

### 7.2 Logging

```typescript
// Logging utility
function logDataUpdate(event: string, data: any) {
  console.log(`[Explorer Update] ${event}`, data);
  
  // Optional: Send to analytics
  if (window.analytics) {
    window.analytics.track('Explorer Data Update', {
      event,
      timestamp: Date.now(),
      ...data,
    });
  }
}

// Usage
logDataUpdate('Market Data Fetched', {
  protocolCount: 7,
  duration: 1200, // ms
  cacheHit: false,
});
```

---

## 8. Future Enhancements

### 8.1 WebSocket Integration (CoinGecko Pro)

If user has CoinGecko Pro API key:
- Use WebSocket for real-time price updates
- Subscribe to price streams
- Update prices instantly (no polling)

### 8.2 Service Worker (Offline Support)

- Cache data in Service Worker
- Serve cached data when offline
- Sync when connection restored

### 8.3 Background Sync API

- Queue updates when offline
- Automatically sync when online
- Show "Syncing..." indicator

### 8.4 Incremental Updates

- Only fetch changed protocols (if API supports)
- Use ETags/Last-Modified headers
- Reduce data transfer

---

## 9. Implementation Checklist

### Phase 1: Basic Updates
- [ ] Implement 5-minute interval for market data
- [ ] Add manual refresh button
- [ ] Implement basic caching (localStorage)
- [ ] Add loading states

### Phase 2: Smart Updates
- [ ] Add tab visibility detection
- [ ] Implement cache TTL checking
- [ ] Add stale data indicators
- [ ] Implement rate limiting

### Phase 3: Error Handling
- [ ] Add error handling & fallbacks
- [ ] Show error states to user
- [ ] Implement retry logic
- [ ] Add offline detection

### Phase 4: Optimization
- [ ] Implement request batching
- [ ] Add request coalescing
- [ ] Optimize cache storage
- [ ] Add monitoring/logging

---

## 10. Testing Strategy

### 10.1 Unit Tests

- Cache TTL logic
- Rate limiter
- Data transformation
- Error handling

### 10.2 Integration Tests

- API calls with mock responses
- Cache invalidation
- Update intervals
- Error scenarios

### 10.3 Manual Testing

- Test with slow network
- Test with offline mode
- Test rate limit scenarios
- Test stale data display

---

**End of Data Update Strategy**
