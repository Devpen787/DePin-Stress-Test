export interface WikiSection {
  id: string;
  title: string;
  icon?: string;
  content: string;
  subsections?: {
    title: string;
    content: string;
  }[];
}

export const WIKI_CONTENT: WikiSection[] = [
  {
    id: 'intro',
    title: 'Welcome',
    icon: '👋',
    content: `
# DePIN Stress Test Simulator

> **Welcome to the DePIN Stress Test Simulator.**
> This is a professional-grade tool for modeling, stress-testing, and auditing the tokenomics of Decentralized Physical Infrastructure Networks (DePIN).

### 🧭 Navigation & Core Concepts

The application is divided into **5 Primary Views**, each serving a distinct stage of the tokenomic design lifecycle.

| View | Purpose | Engine | Best For... |
| :--- | :--- | :--- | :--- |
| **1. Simulator (Sandbox)** | **Rapid Prototyping** | Legacy V2 (Vector) | Sketching new ideas, testing parameters instantly, and "What If?" scenarios. |
| **2. Thesis Dashboard** | **Risk Analysis** | V3 Agent-Based | Stress-testing specific protocols (e.g., ONOCOY, Helium) against rigorous market shocks. |
| **3. Case Study** | **Auditing & Reporting** | Static / Narrative | Reading curated breakdown reports. Great for explaining *why* a design works to stakeholders. |
| **4. Explorer** | **Discovery** | Live Data (CoinGecko) | Browsing real-world DePIN projects, checking live prices, and finding protocols to analyze. |
| **5. Comparison** | **Benchmarking** | V2 Aggregation | Head-to-head "Scorecards" comparing multiple protocols across standardized metrics. |
  `
  },
  {
    id: 'simulator',
    title: '1. The Simulator',
    icon: '🔬',
    content: `
*The Laboratory. Use this to tweak inputs and see instant feedback.*

### Sidebar Controls Reference
The sidebar is the command center for the V2 Vector Engine. It is divided into 5 collateral sections:

#### A. Stress Controls
*Global market conditions.*
*   **Time Horizon**: Use the slider to simulate between '12' (Quarterly) and '104' (2-Year) weeks.
*   **Exogenous Load**: The shape of user demand.
  *   'Consistent': Flat line. Good for baseline.
  *   'Growth': Linear up. The "Happy Path".
  *   'Volatile': Random noise. The "Stress Test".
  *   'High-to-Decay': A bubble that bursts.
*   **Macro Condition**: Global price drift. 'Bullish' (+), 'Bearish' (-), 'Sideways' (Flat).

#### B. Vampire & Treasury
*Competitive dynamics.*
*   **Competitor Yield**: A multiplier on rival APY. '+0%' (No threat) to '+200%' (Attack).
*   **Emission Model**:
  *   'Fixed': Bitcoin-style halving schedule.
  *   'KPI': Mint-on-demand (only mint when usage occurs).
*   **Revenue Strategy**:
  *   'Burn': Deflationary. Short-term price pump.
  *   'Reserve': Sinking Fund. Long-term stability buffer.

#### C. Quick Presets (Scenarios)
*One-click stress tests.*

| Scenario | Icon | Description | Thesis Point |
| :--- | :--- | :--- | :--- |
| **Liquidity Shock** | 📉 | 50% instant price crash w/ 50% sell-off. | Tests "Death Spiral" resistance. |
| **The Subsidy Trap** | ♾️ | High emissions, low demand. | Tests if the protocol is a Ponzi. |
| **Vampire Attack** | ⚔️ | Competitor offers 200% yields. | Tests retention ("Moat"). |
| **Aggressive Expansion** | ⚡ | +50% node growth in Week 20. | Tests "Supply Shock" management. |

#### D. Tokenomics
*Base asset parameters.*
*   **Initial Token Price**: Starting USD value (e.g., $0.50).
*   **Burn Percentage**: % of revenue used to burn tokens (0-100%).

#### E. Advanced Configuration
*Fine-tuning the engine.*
*   **Provider Economics**:
  *   'OpEx': Weekly cost to run a node.
  *   'Capex': Hardware cost.
  *   'Churn Threshold': How much loss a miner tolerates before quitting.
*   **Simulation**:
  *   'Monte Carlo Runs': '20' (Fast) to '500' (Accurate).
  *   'Seed': Random number generator seed (for reproducibility).

### The 4 Modules (Charts)
The Sandbox output is organized into **4 Canonical Stress Tests**:

#### Module 1: Solvency (The Equilibrium Test)
Tests if the protocol is printing money faster than it burns it.
- **Solvency Score**: '(Value Burned) / (Value Minted)'. >1.0 is healthy (Deflationary). <1.0 is dilutive.
- **Net Daily Loss**: The raw USD deficit per day.
- **Chart: Cumulative Network Subsidy**: The total amount of USD value "given away" to miners to subsidize growth. A steep red curve means unsustainable dilution.

#### Module 2: Capitulation (The Resilience Test)
Tests what happens when price drops. Who leaves?
- **Logic**: We categorize miners into **Urban** (Speculators, high OpEx) and **Rural** (Utility, low OpEx).
- **Chart: The Capitulation Stack**:
  - **Red Area (Urban)**: Fragile miners. They leave first when price drops.
  - **Green Area (Rural)**: Resilient miners. They stick around.
  - *Goal*: You want a thick Green base that survives market crashes.

#### Module 3: Liquidity Shock (The Depth Test)
Tests the market's ability to absorb a massive sell-off (e.g., VC unlock).
- **Control**: 'Sell Pressure' slider (0-30% of supply dumped).
- **Calculated Metric**: 'Price Impact'. If >40%, it triggers a **"Death Spiral"** warning (Miners panic sell).
- **Chart: Liquidity Shock Impact**: Shows the token price trajectory before and after the unlock event.

#### Module 4: Vampire & Reserve (The Moat Test)
Tests defense mechanisms against competitors.
- **Chart: Treasury Health**:
  - **Green Line**: Accumulation of USD reserves (if Strategy = 'Reserve').
  - **Red Dashed Line**: "Vampire Churn" - the rate at which nodes leave for a competitor.
  - *Insight*: Protocols with Reserves survive ~50% longer during attacks because they can support the token price.
  `
  },
  {
    id: 'data_integrity',
    title: '16. Data Integrity & Live Oracles',
    icon: '🔗',
    content: `
### Proof of Reality
This dashboard is not just a simulation; it is a live window into the blockchain.

### 1. Market Data (CoinGecko)
*   **Price & Volume**: Fetched in real-time.
*   **Update Frequency**: Every 5 minutes.
*   **Fallback**: If the API fails, we use cached values from the last successful session.

### 2. Supply Verification (Solana RPC)
*   **Slot Height**: The "Pulse" of the network. We connect directly to \`api.mainnet-beta.solana.com\` to verify the chain is liveness.
*   **Circulating Supply**: We cross-reference reported supply against the on-chain Token Mint Account.
    *   ✅ **Verified**: Discrepancy < 1%.
    *   ⚠️ **Unverified**: Relying on self-reported API data.

### 3. Simulation Data
*   **Scenario Inputs**: Unlike the Live Explorer, the **Simulator** and **Thesis** tabs use *User-Defined* parameters (Synthetic Data) to allow for "Stress Testing" hypothetical futures.
      `
  },
  {
    id: 'thesis',
    title: '2. Thesis Dashboard',
    icon: '📉',
    content: `
*The Stress Test. Interactive risk validation for specific profiles.*

This dashboard uses the **V3 Agent-Based Model**. It simulates individual agents making decisions.

### Risk Controls
- **Market Stress Slider**: Global price shock (-90% to +20%).
- **Competitor Yield**: The incentive premium offered by a rival.

### Key Charts
1.  **Stability (Price vs Nodes)**:
  - *Question*: "If price drops 50% (Blue line), do nodes stay online (Grey dashed line)?"
  - *Ideal*: Price drops, but Nodes stay flat (Decoupling).
2.  **Grid Composition**:
  - *Visualizes*: The "Flight to Quality". As stress increases, the Red/Urban area shrinks, revealing the Green/Rural core.
3.  **Payback Scenarios (Bar)**:
  - Shows ROI in months for 'Base Design', 'Bear Market', and 'Crash' scenarios.
  - *Danger Zone*: >36 months payback implies high churn risk.
  `
  },
  {
    id: 'methodology',
    title: '3. Methodology (ADEMP Framework)',
    icon: '📐',
    content: `
### Research Framework: IMRaD
This simulation adheres to the **IMRaD** model (Introduction, Methods, Results, Discussion), mirroring the cyclical nature of the scientific method.

### The ADEMP Structure
The simulation core follows the **ADEMP** framework used in biostatistics and econometrics:
*   **Aims**: Evaluating directional robustness (Survival vs Ruin) under adverse stress.
*   **Data-Generating Mechanisms (DGM)**: Utilizing Agent-Based Models (ABM) and Geometric Brownian Motion (GBM) to create probability cones.
*   **Estimands**: Quantifying the **Burn-to-Emission Ratio ($R_{BE}$)** and **Churn Probability ($P_{churn}$)**.
*   **Methods**: A three-phase procedure:
    1.  **Generation**: Creating test cases (e.g., Liquidity Shock).
    2.  **Simulation**: Executing 1,000+ Monte Carlo runs.
    3.  **Analysis**: The "Test Oracle" verdict (Pass/Fail).
*   **Performance Measures**: Tracking **Recovery Hysteresis** and the **Psychological Breakpoint** (where payback > 14 months).

### The ORSTE Engine
The **Onocoy Resilience & Stress-Test Engine (ORSTE)** acts as a "flight simulator" for tokenomics. It distinguishes between:
*   **Verification**: Checking code correctness (Unit Tests).
*   **Validation**: Ensuring fidelity to physical reality (e.g., "Sunk Cost Stability").
  `
  },

  {
    id: 'comparison',
    title: '3. Comparison',
    icon: '📋',
    content: `
  * The Benchmark.Head - to - head metrics.*

** How to Access **: go to ** Explorer **, check multiple protocols, click "Compare".Or click "Comparison" in the header navigation.

** The Scorecard Table Metrics **:

| Metric | Definition | Good / Bad |
| : --- | : --- | : --- |
| ** Sustainability Ratio ** | '(Real Revenue) / (Emission Value)' | Higher is Better. % of emissions covered by real cash flow. |
| ** Payback Period ** | 'Hardware Cost / Weekly Profit' | Lower is Better. < 12 months is great. > 36 months is high risk. |
| ** Death Spiral Risk ** | Probability of feedback loop crash. | 'LOW' / 'MED' / 'HIGH'.Based on max drawdown. |
| ** Churn Rate ** | 'Total Leavers / Total Joiners' | Lower is Better.Indicates network stickiness. |

* Note: The table uses a Heatmap.Green cells = Leader, Red cells = Laggard.*
  `
  },
  {
    id: 'explorer',
    title: '4. Explorer',
    icon: '🔍',
    content: `
  * The Market.Real - time data.*

- ** Live Data **: Connects to CoinGecko API.
- ** On - Chain Verify **: Cross - checks supply with Solana RPC(if available).
- ** Risk Level **: Auto - calculated based on volatility and burn rates. 'LOW', 'MED', 'HIGH'.
  `
  },
  {
    id: 'casestudy',
    title: '5. Case Studies',
    icon: '📚',
    content: `
  * The Narrative.Explaining the "Why".*

    These are static, curated walkthroughs(e.g., "The Onocoy Case Study").
- ** Solvency Matrix(Heatmap) **: The most important chart.It plots ** Emissions vs Usage **.
  - * Safe Zone(Green) *: High Usage, Low Emissions.
  - * Danger Zone(Purple) *: Low Usage, High Emissions(Dilution).
- ** Resilience Radar **: Scores the protocol on 5 vectors(Sybil Resistance, Capex Recovery, etc.).
  `
  },
  {
    id: 'personas',
    title: '6. User Personas',
    icon: '👤',
    content: `
### 🏛️ Category A: The Builders(Protocol Logic)
  * For those designing, monitoring, and governing the system.*

| Role | Focus | Primary Tools | Workflow Example |
| : --- | : --- | : --- | : --- |
| ** Head of Tokenomics ** | Incentive Alignment | ** Simulator(Sandbox) ** | Stress - testing emission schedules against "Crypto Winter" scenarios to ensure solvency. |
| ** Governance Risk Lead ** | Defense & Parameters | ** Thesis Dashboard ** | Modeling a "Vampire Attack" to determine if a Sinking Fund vote is required. |
| ** Founder / Architect ** | Vision & Sustainability | ** Case Study ** | Using the * Solvency Matrix * to explain the long - term viability model to partners. |

### 💼 Category B: The Participants(Market Logic)
  * For those diagnosing risks and deploying capital.*

| Role | Focus | Primary Tools | Workflow Example |
| : --- | : --- | : --- | : --- |
| ** DePIN Investor(VC) ** | Due Diligence | ** Comparison ** | Benchmarking * Payback Periods * across 3 competing protocols to spot inflationary bubbles. |
| ** Fleet Manager ** | Hardware ROI | ** Comparison / Explorer ** | Calculating break-even timelines for a 500 - node deployment under "Bear Market" conditions. |
| ** Retail Analyst ** | Token Value | ** Explorer ** | Filtering for protocols with "Low Risk" scores and verified on - chain supply. |

### 👨‍💻 Category C: The Contributors(Code Logic)
  * For those extending the tool itself.*

| Role | Focus | Primary Tools | Workflow Example |
| : --- | : --- | : --- | : --- |
| ** Open Source Dev ** | Adding Data | ** VS Code / Explorer ** | Adding a new Protocol Profile to 'src/data/protocols.ts'. |
| ** Data Engineer ** | Verification | ** Explorer ** | Integrating a new Solana RPC endpoint to verify live token supplies. |
  `
  },
  {
    id: 'developer',
    title: '7. Developer Guide',
    icon: '👨‍💻',
    content: `
  * How to add your own Protocol to this tool.*

    1. ** Locate the Profiles **: Go to 'src/data/protocols.ts'.
2. ** Create an Entry **: Copy an existing profile(e.g., 'HELIUM_BME').
3. ** Define Parameters **:
  * 'model_type': 'location_based'(e.g.Hivemapper) or 'fungible'(e.g.Akash).
  * 'tokenomics': Set your 'initial_price', 'supply_cap', and 'emission_schedule'.
4. ** Register **: Add your exported object to the 'PROTOCOL_PROFILES' array.
5. ** Test **: Open the ** Explorer ** tab to see your protocol live.

### Technical Architecture
  * ** Frontend **: React 18 + Vite + TailwindCSS.
* ** State Management **: React 'useState' / 'useMemo'(No external Redux / Zustand to keep it simple).
* ** Charts **: 'recharts' for all data visualization.
* ** Simulation Engines **:
  * 'src/model/legacy/engine.ts': ** V2 Vector Engine **.Pure mathematical arrays.Fast, deterministic.Used in Sandbox.
  * 'src/model/simulation.ts': ** V3 Agent Engine **.Object - oriented agents('Miner', 'Investor').Stochastic, complex.Used in Thesis.
*   ** Data Layer **:
  * 'src/data/protocols.ts': Static definitions of protocol parameters.
  * 'src/data/scenarios.ts': Configs for "Crypto Winter", "Growth", etc.
  `
  },
  {
    id: 'workflows',
    title: '8. Recipes',
    icon: '🛠️',
    content: `
### Recipe A: Stress Test a New Token Launch
1. ** Nav **: Simulator > Stress Controls.
2. ** Action **: Set 'Exogenous Load' to ** "Volatile" **.Set 'Macro' to ** "Bearish" **.
3. ** Check **: Look at ** Module 2(Capitulation) **.
4. ** Success Criteria **: Rural(Green) nodes should * grow * or remain flat.If they crash -> Redesign incentives.

### Recipe B: Vampire Attack Drill
1. ** Nav **: Simulator > Vampire & Treasury.
2. ** Action **: Set 'Competitor Yield' to ** +100 %** (Aggressive attack).
3. ** Check **: ** Module 4(Treasury) **.
4. ** Observation **: Does the "Vampire Churn"(Red Line) spike immediately ?
  5. ** Fix **: Enable 'Sinking Fund'.Does the churn delay ? By how many weeks ?
    `
  },
  {
    id: 'faq',
    title: '10. FAQ',
    icon: '❓',
    content: `
### 🔹 General & Methodology
  ** Q: Why are there two different simulation engines(V2 and V3) ?**
    A : ** Speed vs.Precision **.The ** Simulator ** uses the V2 Vector Engine, which is purely mathematical and runs instantly.It's perfect for "sketching" ideas. The **Thesis Dashboard** uses the V3 Agent-Based Model, which simulates thousands of individual miners making decisions. It's slower but simulates complex emergent behaviors like "panic selling" that math formulas miss.

** Q: Is the market data real ?**
  A : ** Yes and No **.In the ** Explorer **, we pull live prices and supply from CoinGecko.In the ** Simulator **, we use "Synthetic Data" initialized with realistic starting values(e.g., $10m liquidity) to test "What If" scenarios.

** Q: Can I add my own protocol ?**
  A : Yes.See the ** Developer Guide(Section 7) **.You just need to add a JSON object to 'src/data/protocols.ts'.

### 🔹 The Simulator(Sandbox)
  ** Q: What is "Exogenous Load" ?**
    A : This represents external demand for the network's service (e.g., people buying VPN data or paying for dashcam maps).
      *   ** Consistent **: Flat demand(Testing baseline).
*   ** Growth **: Linear adoption(The "Happy Path").
*   ** Volatile **: Random spikes and crashes(Stress Testing).
*   ** High - to - Decay **: A hype cycle(Pump and Dump).

** Q: Why does my "Solvency Score" drop below 1.0 ?**
  A : A score < 1.0 means the protocol is ** Dilutive **.You are minting more usage rewards(in USD value) than you are burning from customer revenue.This creates sell pressure.To fix it, try increasing 'Exogenous Load' or reducing 'Emissions'.

** Q: What does the "Macro Condition" switch do?**
  A : It applies a global multiplier to the token price.
*   ** Bullish **: +5 % to + 15 % monthly drift.
*   ** Bearish **: -5 % to - 15 % monthly bleed.
*   ** Sideways **: Random walk with 0 % drift.

### 🔹 Risk & Thesis Logic
  ** Q: What is the difference between "Urban" and "Rural" miners ?**
    A : This is a mental model for ** Cost Basis **:
*   ** Urban(Speculators) **: High OpEx, Rent, Power.They need high token prices to survive.They churn * fast * when prices drop.
*   ** Rural(Utility) **: Low OpEx, sunk costs(e.g., a solar antenna on a roof).They are * resilient * and stay online even during bear markets.

** Q: What triggers a "Death Spiral" ?**
  A : A Death Spiral warning appears in ** Module 3 ** when the 'Price Impact' of a sell - off exceeds ** 40 %**.At this point, the V3 engine predicts that 50 % + of Urban miners will unplug immediately, causing network utility to crash, which causes price to crash further.

** Q: What is a "Vampire Attack" ?**
  A : This simulates a competitor forking your network and offering higher rewards.If you see the "Vampire Churn" line spike, it means your nodes are leaving for the competitor.The best defense is a ** Sinking Fund ** (Reserve Strategy) to support your token price.

### 🔹 Charts & Data
  ** Q: Why is the "Payback Period" 36 months ?**
    A : The charts cap the Payback Period at 36 months for readability.If you see it hit the ceiling, it likely means the actual payback is "Never" or "Infinity"(i.e., the node is unprofitable).

** Q: Can I export the simulation results ?**
  A : Yes.You can export the raw simulation data to CSV using the ** Download ** button in the header, or share a specific configuration via the ** Share ** button.
  `
  },
  {
    id: 'metrics',
    title: '11. Metrics',
    icon: '🧮',
    content: `
    | Metric | Formula | Interpretation | Key Thresholds |
| : --- | : --- | : --- | : --- |
| ** Solvency Score ** | 'Burn / Mint' | > 1 = Deflationary < br > <1 = Inflationary | **< 0.5**: Ponzi Warning<br> **> 1.0 **: Sustainable |
| ** Payback Period ** | 'Hardware / (WeeklyProfit * 4)' | Time to ROI in Months. | **< 12mo **: Attractive<br> **> 36mo **: Uninvestable |
| ** Miner Capitulation ** | 'Revenue < OpEx' | When nodes unplug due to losses. | **> 15 %** churn triggers "Death Spiral" warning. |
| ** Network Utilization ** | 'Demand / Capacity' | Efficiency of deployed hardware. | ** <10%**: Ghost Chain<br> **> 80 %**: Bottleneck |
| ** Reliability Premium **| 'Price * (1 + ScaleFactor)' | Extra value of high - uptime networks. | Used in * Thesis * tab to determine churn resilience. |
  `
  },
  {
    id: 'limitations',
    title: '12. Limitations',
    icon: '⚠️',
    content: `
### Synthetic vs Real Data
  *   ** The Explorer ** uses ** Live Data ** (CoinGecko).It is accurate to the minute.
*   ** The Simulator ** uses ** Synthetic Data ** generated by a * Geometric Brownian Motion(GBM) * engine.It is designed to test * mechanics *, not predict tomorrow's price.

### The "Death Spiral" Assumption
The V3 Engine assumes that ** Urban Miners(Speculators) ** are purely profit - driven.If 'Revenue < OpEx' for 4 consecutive weeks, the model assumes 100 % of them will churn.This is a conservative "Worst Case" assumption.In reality, some speculators might hold on longer due to sunk cost fallacy.

### Disclaimer
This tool is a ** Stochastic Model **, not a crystal ball.It calculates * probabilities * of failure, not guarantees of success.Always verify logic with an independent audit.
  `
  },
  {
    id: 'glossary',
    title: '13. Glossary',
    icon: '📖',
    content: `
### A.Domain Terms
  | Term | Definition |
| : --- | : --- |
| ** BME(Burn - and - Mint) ** | A model where customers burn tokens to use the network, and the protocol mints new tokens to reward miners.Equilibrium is when Burn = Mint. |
| ** Capitulation ** | When miners unplug their hardware because operating costs exceed token rewards. |
| ** Churn ** | The rate at which nodes leave the network. |
| ** Death Spiral ** | A feedback loop: Price Drops -> Miners Leave -> Utility Drops -> Price Drops More. |
| ** DePIN ** | Decentralized Physical Infrastructure Networks. |
| ** KPI - Based Emission ** | Minting tokens only when specific goals(e.g., coverage, uptime) are met, rather than on a fixed time schedule. |
| ** Sinking Fund ** | A treasury strategy that sets aside revenue in good times to buy back tokens in bad times(volatility dampener). |
| ** Sybil Attack ** | Fake nodes spoofing location / work to steal rewards. |
| ** Vampire Attack ** | A competitor copying your codebase but offering higher token incentives to steal your liquidity / workers. |

### B.Simulation Parameters(Reference)
  * Definitions of all inputs found in the Simulator Sidebar.*

| Parameter | Definition | Default | Impact(Why it matters) |
| : --- | : --- | : --- | : --- |
| ** Time Horizon(T) ** | Total duration of the simulation in weeks. | 52 | Longer views reveal long - term sustainability vs short - term pumps. |
| ** Initial Supply ** | Starting circulating token supply. | 100M | Higher supply = Lower price sensitivity but potential dilution. |
| ** Max Weekly Emissions ** | Cap on tokens minted per week. | 250k | Controls the inflation rate.Higher = more dillution. |
| ** Burn Percentage ** | % of revenue used to burn tokens. | 65 % | Key deflationary force.Higher = more price support. |
| ** Initial Liquidity ** | USD depth of the liquidity pool. | $50k | Higher liquidity buffers against price crashes during unlocks. |
| ** Investor Unlock Week ** | When the "VC Cliff" hits. | Wk 26 | Determines when the "Liquidity Shock" stress test begins. |
| ** Investor Sell %** | % of supply dumped at unlock. | 15 % | High values(> 20 %) can trigger Death Spirals. |
| ** Base Demand ** | Weekly service units requested. | 12k | The core driver of "Real Yield".Higher = Better Solvency. |
| ** Demand Volatility ** | Random noise in demand. | 5 % | Simulates real - world uncertainty. |
| ** Macro Condition ** | Global market sentiment. | Sideways | Bullish(+15 %) or Bearish(-15 %) price drift. |
| ** Initial Providers ** | Starting node count. | 30 | More providers = more capacity but thinner rewards. |
| ** Provider OpEx ** | Weekly cost to run a node. | $26 | High OpEx networks are more fragile(easier to capitulate). |
| ** Hardware Lead Time ** | Delay to add new nodes. | 2 wks | Slows down network growth response to price spikes. |
| ** Churn Threshold ** | Min profit before quitting. | $10 | Lower = More "Diamond Handed" miners. |
| ** kBuyPressure ** | Price sensitivity to buy pressure. | 0.08 | How hard price pumps when users buy service. |
| ** kMintPrice ** | Price sensitivity to dilution. | 0.35 | How hard price dumps when tokens are printed. |
| ** Service Price Elasticity **| Speed of service repricing. | 0.6 | Higher = Service prices volatile; Lower = Stable user costs. |
  `
  },
  {
    id: 'charts',
    title: '14. Chart Index',
    icon: '📊',
    content: `
  * A comprehensive guide to every visualization in the dashboard.*

| Chart Title | Tab | Description | Success Signal | Failure Signal(Warning) |
| : --- | : --- | : --- | : --- | : --- |
| ** Cumulative Network Subsidy ** | Simulator(Mod 1) | Shows total USD value printed to subsidize growth vs User Revenue burned. | ** Flattening Curve ** (Subsidy stops growing). | ** Exponential Vertical ** (Runaway printing). |
| ** The Capitulation Stack ** | Simulator(Mod 2) | Area chart of Urban(Red) vs Rural(Green) miners. | ** Thick Green Base ** (Rural miners survive crashes). | ** Green Collapse ** (Utility nodes fleeing). |
| ** Liquidity Shock Impact ** | Simulator(Mod 3) | Price trajectory before / after investor token unlock event. | ** V - Shape Recovery ** (Price bounces back in <4 weeks). | ** L - Shape Crash ** (Price stays down forever). |
| ** Treasury Health & Churn ** | Simulator(Mod 4) | Left Axis: Treasury Balance(Green).Right Axis: Vampire Churn(Red). | ** High Green / Low Red ** (Reserves grow, Churn stays low). | ** Zero Reserves ** (Defenses depleted). |
| ** Stability(Price vs Nodes) ** | Thesis Dashboard | Correlation between Token Price(Blue) and Active Nodes(Grey). | ** Decoupling ** (Price drops, but Nodes stay flat). | ** Coupling ** (Nodes drop exactly with Price). |
| ** Grid Composition ** | Thesis Dashboard | Breakdown of network into Urban vs Rural segments under stress. | ** Rural Dominance ** (Utility nodes outlast speculators). | ** Total Washout ** (Empty grid). |
| ** Solvency Matrix ** | Case Study | Heatmap of Emissions(Y - Axis) vs Usage(X - Axis). | ** Green Zone ** (High Usage / Low Emissions). | ** Purple Zone ** (High Emissions / Zero Usage). |
| ** Resilience Radar ** | Case Study | 5 - point score on Sybil, Capex, Algo, demand, & Governance. | ** Full Pentagon ** (High scores on all edges). | ** Collapsed Core ** (Low scores). |
| ** Supply Growth ** | Explorer | Sparkline of total token supply over time. | ** Sigmoid Curve ** (Growth tapers off). | ** Hyper - Exponential ** (Infinite inflation). |
| ** Solvency Ratio ** | Explorer | Line chart of Burn / Mint ratio. | **> 1.0 ** (Net Deflationary). | **< 0.5** (Dilutive Ponzi).
`
  },
  {
    id: 'sources',
    title: '15. Sources & Bibliography',
    icon: '📚',
    content: `
### Primary Project Data
  *   ** Mardikes, M.A. (2025) **. * Decentralized Physical Infrastructure Networks(DePIN) on Solana: A Tokenomic Stress - Test and Sustainability Analysis(Case Study: Onocoy).*
*   ** Onocoy Documentation **. * Mining Rewards Breakdown: Location and Quality Scales.* [docs.onocoy.com](https://docs.onocoy.com)

### Scientific Writing & Frameworks
  *   ** Morris, T.P., White, I.R., & Crowther, M.J. (2019) **. * Using simulation studies to evaluate statistical methods(ADEMP).* Statistics in Medicine.
*   ** Sollaci, L.B., & Pereira, M.G. (2004) **. * The introduction, methods, results, and discussion(IMRAD) structure: a fifty - year survey.*
*   ** Utah Valley University **. * Scientific Writing: IMRaD.*

### Simulation & Validation
  *   ** Sartori, L.V. (2022) **. * 3 steps for simulation - based testing.* SAFER AUTONOMOUS.
*   ** Harris, D.J., et al. (2020) **. * A Framework for the Testing and Validation of Simulated Environments.* Frontiers in Psychology.
*   ** Collins, A., Koehler, M., & Lynch, C. (2024) **. * Methods That Support the Validation of Agent - Based Models.* Journal of Artificial Societies and Social Simulation.

### Visualization
  *   ** Salvati, Z.M., et al. (2023) **. * A picture is worth a thousand words: advancing the use of visualization tools(Process Mapping).* NIH.
*   ** Garrett, T. (2025) **. * D3.js Force Simulation for Interactive Network Visualization.* Dev3lop.
        `
  }
];
