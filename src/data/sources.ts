/**
 * DePIN Stress Test - Research Sources & Citations
 * Academic and Technical References for the Thesis Dashboard
 */

export interface ResearchSource {
    id: number;
    title: string;
    author?: string;
    url?: string;
    accessedDate: string;
    category: 'primary' | 'methodology' | 'protocol' | 'economic-theory' | 'technical';
    relevance: string;
}

export const RESEARCH_SOURCES: ResearchSource[] = [
    // Primary Research (Thesis Core)
    {
        id: 1,
        title: "DePIN Tokenomics Under Stress",
        author: "Internal Research Document",
        accessedDate: "2026-01-15",
        category: 'primary',
        relevance: "Core thesis document defining stress metrics and resilience framework.",
    },

    // Protocol Documentation
    {
        id: 2,
        title: "GEODNET Review ($GEOD)",
        url: "https://web.ourcryptotalk.com/blog/geodnet-review-geod",
        accessedDate: "2026-01-15",
        category: 'protocol',
        relevance: "GNSS DePIN case study for utility-driven token models.",
    },
    {
        id: 3,
        title: "DePIN on Solana - Meal Deal Ecosystem Report",
        author: "Blocmates",
        url: "https://www.blocmates.com/articles/depin-on-solana-2-meal-deal",
        accessedDate: "2026-01-15",
        category: 'protocol',
        relevance: "Solana execution environment and high-throughput DePIN dynamics.",
    },
    {
        id: 4,
        title: "State of Solana DePIN 2024",
        author: "Yash Agarwal",
        url: "https://yashhsm.medium.com/state-of-solana-depin-2024-055338f513af",
        accessedDate: "2026-01-15",
        category: 'protocol',
        relevance: "Overview of Burn-and-Mint Equilibrium (BME) model adoption.",
    },
    {
        id: 5,
        title: "Breakpoint 2023: Burn-and-Mint Goldilocks Tokenomics for DePIN",
        author: "Solana Compass",
        url: "https://solanacompass.com/learn/breakpoint-23/breakpoint-2023-burn-and-mint-goldilocks-tokenomics-for-depin",
        accessedDate: "2026-01-15",
        category: 'methodology',
        relevance: "Theoretical foundation for BME equilibrium in reward systems.",
    },
    {
        id: 6,
        title: "Burn-and-Mint Tokenomics: Deflation and Strategic Incentives",
        author: "ResearchGate Publication",
        url: "https://www.researchgate.net/publication/374386343_Burn-and-Mint_Tokenomics_Deflation_and_Strategic_Incentives",
        accessedDate: "2026-01-15",
        category: 'economic-theory',
        relevance: "Academic paper on BME deflationary mechanics.",
    },
    {
        id: 7,
        title: "Could Stablecoin UST have revived from the death spiral?",
        author: "XREX Team",
        url: "https://blog.xrex.io/could-stablecoin-ust-have-revived-from-the-death-spiral-insights-from-an-algo-stablecoins-depeg-3508e08427b7",
        accessedDate: "2026-01-15",
        category: 'economic-theory',
        relevance: "Case study on recursive feedback loops (Death Spiral).",
    },
    {
        id: 8,
        title: "Asset Management: Solvency Ratios in Financial Regulation",
        author: "ResearchGate",
        url: "https://www.researchgate.net/topic/Asset-Management/publications/9",
        accessedDate: "2026-01-15",
        category: 'economic-theory',
        relevance: "Traditional finance solvency metrics for comparison.",
    },
    {
        id: 9,
        title: "Depositaries in European Investment Law",
        url: "https://dokumen.pub/download/depositaries-in-european-investment-law-towards-harmonization-in-europe-1nbsped-9789462748774-9789462368507.html",
        accessedDate: "2026-01-15",
        category: 'economic-theory',
        relevance: "Regulatory framework reference for treasury health.",
    },
    {
        id: 10,
        title: "An Examination of Velocity and Initial Coin Offerings",
        author: "ResearchGate",
        url: "https://www.researchgate.net/publication/358949876_An_Examination_of_Velocity_and_Initial_Coin_Offerings",
        accessedDate: "2026-01-15",
        category: 'economic-theory',
        relevance: "Token velocity as liquidity proxy in BME systems.",
    },
    {
        id: 11,
        title: "DCW Daily Brief: Global Digital Assets & Web3 Market Intelligence",
        url: "https://www.thedigitalcommonwealth.com/posts/thedcwdailybrief-181225",
        accessedDate: "2026-01-15",
        category: 'methodology',
        relevance: "Miner capitulation patterns in proof-of-work systems.",
    },
    {
        id: 12,
        title: "DIY Onocoy Ntrip Server and Reference Station Setup",
        author: "SimeonOnSecurity",
        url: "https://simeononsecurity.com/other/onocoy-gps-gnss-reciever-basestation-on-a-budget/",
        accessedDate: "2026-01-15",
        category: 'technical',
        relevance: "Hardware tiers (Septentrio, u-blox) and CapEx analysis.",
    },
    {
        id: 13,
        title: "Onyx: DAO Treasury Contract",
        url: "https://etherscan.io/address/0x28CA9CaAE31602D0312Ebf6466c9dD57FCA5da93",
        accessedDate: "2026-01-15",
        category: 'technical',
        relevance: "On-chain treasury verification for sinking fund models.",
    },
    {
        id: 14,
        title: "DePIN's Imperfect Present & Promising Future: A Deep Dive",
        author: "Compound VC",
        url: "https://www.compound.vc/writing/depin",
        accessedDate: "2026-01-15",
        category: 'methodology',
        relevance: "Rural Connectivity Gap and market failure in DePIN.",
    },
    {
        id: 15,
        title: "Location Scale | Onocoy Documentation",
        url: "https://docs.onocoy.com/documentation/mining-rewards-breakdown/location-scale",
        accessedDate: "2026-01-15",
        category: 'protocol',
        relevance: "Core algorithm for density-based reward reduction (Urban/Rural proxy).",
    },
    {
        id: 16,
        title: "Quality Scale | Onocoy Documentation",
        url: "https://docs.onocoy.com/documentation/mining-rewards-breakdown/quality-scale",
        accessedDate: "2026-01-15",
        category: 'protocol',
        relevance: "Hardware quality tiers and utility verification.",
    },
    {
        id: 17,
        title: "Tokenomics | Onocoy Documentation",
        url: "https://docs.onocoy.com/documentation/tokenomics",
        accessedDate: "2026-01-15",
        category: 'protocol',
        relevance: "ONO token emission schedule and treasury design.",
    },
    {
        id: 18,
        title: "GEODNET ($GEOD) In-Depth Research Report: The Real Yield King of the DePIN Sector?",
        author: "Depinport",
        url: "https://medium.com/@done_71651/geodnet-geod-in-depth-research-report-the-real-yield-king-of-the-depin-sector-35d3e4a6733f",
        accessedDate: "2026-01-16",
        category: 'protocol',
        relevance: "Competitive benchmark data on Geodnet revenue, burn policy, and market positioning.",
    },
    {
        id: 19,
        title: "Geodnet",
        url: "https://geodnet.com/",
        accessedDate: "2026-01-16",
        category: 'protocol',
        relevance: "Primary protocol landing page and network overview.",
    },
    {
        id: 20,
        title: "Onocoy 2025 Year in Review: From TGE to Global GNSS Leadership",
        url: "https://onocoy.com/blog/onocoy-2025-year-in-review-from-tge-to-global-gnss-leadership",
        accessedDate: "2026-01-16",
        category: 'protocol',
        relevance: "Onocoy network growth, burn metrics, and strategic milestones.",
    },
    {
        id: 21,
        title: "Onocoy Documentation: What is Onocoy?",
        url: "https://docs.onocoy.com/documentation",
        accessedDate: "2026-01-16",
        category: 'protocol',
        relevance: "Protocol overview and core concepts.",
    },
    {
        id: 22,
        title: "GNSS RTK Positioning - An Overview",
        url: "https://onocoy.com/blog/gnss-rtk-positioning-an-overview",
        accessedDate: "2026-01-16",
        category: 'technical',
        relevance: "GNSS/RTK technical background and accuracy requirements.",
    },
    {
        id: 23,
        title: "How Onocoy Is Reshaping the GNSS Industry With Its Blockchain-Powered, Open Ecosystem",
        url: "https://onocoy.com/blog/reshaping-the-gnss-industry",
        accessedDate: "2026-01-16",
        category: 'protocol',
        relevance: "Onocoy positioning and architectural rationale.",
    },
    {
        id: 24,
        title: "World's Largest Blockchain-Powered Navigation Network for Robotics and Token Rewards - GEODNET",
        url: "https://geodnet.com/network",
        accessedDate: "2026-01-16",
        category: 'protocol',
        relevance: "Geodnet network scale and coverage claims.",
    },
    {
        id: 25,
        title: "DIY Onocoy NTRIP Server and Reference Station Setup",
        url: "https://www.instructables.com/DIY-Onocoy-Ntrip-Server-and-Reference-Station-Setu/",
        accessedDate: "2026-01-16",
        category: 'technical',
        relevance: "DIY hardware setup guidance and cost references.",
    },
    {
        id: 26,
        title: "Geodnet Hyfix Crypto Miner Triple-Band Pre-owned",
        url: "https://www.ebay.com/itm/226854052326",
        accessedDate: "2026-01-16",
        category: 'technical',
        relevance: "Secondary market pricing for Geodnet-compatible hardware.",
    },
    {
        id: 27,
        title: "Your Guide to Understanding the ONO Token",
        url: "https://onocoy.com/blog/your-guide-to-understanding-the-ono-token",
        accessedDate: "2026-01-16",
        category: 'protocol',
        relevance: "ONO token mechanics and supply guidance.",
    },
    {
        id: 28,
        title: "Swapping BONO to ONO",
        url: "https://docs.onocoy.com/documentation/swapping-bono-to-ono",
        accessedDate: "2026-01-16",
        category: 'protocol',
        relevance: "Token migration details and swap mechanics.",
    },
    {
        id: 29,
        title: "MobileCM Triple-Band GNSS Base-Station (GEODNET Compatible)",
        url: "https://hyfix.ai/products/mobilecm-triple-band-gnss-base-station",
        accessedDate: "2026-01-16",
        category: 'technical',
        relevance: "Hardware specs and cost for GEODNET-compatible stations.",
    },
    {
        id: 30,
        title: "SuperHex - GEODNET Docs Center",
        url: "https://docs.geodnet.com/geod-console-advanced/superhex",
        accessedDate: "2026-01-16",
        category: 'protocol',
        relevance: "Geodnet deployment mechanics and reward multipliers.",
    },
    {
        id: 31,
        title: "Latest GEODNET (GEOD) Price Analysis",
        url: "https://coinmarketcap.com/cmc-ai/geodnet/price-analysis/",
        accessedDate: "2026-01-16",
        category: 'protocol',
        relevance: "Market price context and token performance summary.",
    },
    {
        id: 32,
        title: "GEODNET Improvement Proposal 7",
        url: "https://medium.com/geodnet/geodnet-improvement-proposal-7-c2313f643b9b",
        accessedDate: "2026-01-16",
        category: 'protocol',
        relevance: "Governance and protocol evolution reference.",
    },
    {
        id: 33,
        title: "GEODNET Migration Bonus Program from Polygon to Solana",
        url: "https://www.geodnet.com/detail/GEOD-Migration-PtoS-488861757471261105",
        accessedDate: "2026-01-16",
        category: 'protocol',
        relevance: "Chain migration details and incentive structure.",
    },
    {
        id: 34,
        title: "Onocoy",
        url: "https://onocoy.com/",
        accessedDate: "2026-01-16",
        category: 'protocol',
        relevance: "Primary Onocoy landing page and positioning.",
    },
    {
        id: 35,
        title: "Deep Dive: Solana DePIN",
        author: "Syndica",
        url: "https://blog.syndica.io/content/files/2025/02/Deep-Dive---Solana-DePIN-January-2025-1.pdf",
        accessedDate: "2026-01-16",
        category: 'methodology',
        relevance: "Sector overview and Solana DePIN context.",
    },
    {
        id: 36,
        title: "Retention Rate | Definition and Overview",
        url: "https://www.productplan.com/glossary/retention-rate/",
        accessedDate: "2026-01-16",
        category: 'methodology',
        relevance: "Retention definition reference.",
    },
    {
        id: 37,
        title: "What is Retention Rate? Definition and FAQ",
        url: "https://airfocus.com/glossary/what-is-retention-rate/",
        accessedDate: "2026-01-16",
        category: 'methodology',
        relevance: "Retention definition reference.",
    },
    {
        id: 38,
        title: "Helium: Financials - Analytics Dashboard",
        url: "https://blockworks.com/analytics/helium/helium-financials",
        accessedDate: "2026-01-16",
        category: 'protocol',
        relevance: "Helium burn and revenue context for peer comparisons.",
    },
    {
        id: 39,
        title: "Solana Burn Address Explained: Full Guide to Token Burning on Solana",
        url: "https://learn.backpack.exchange/articles/solana-burn-address-explained",
        accessedDate: "2026-01-16",
        category: 'technical',
        relevance: "On-chain burn address mechanics and verification guidance.",
    },
    {
        id: 40,
        title: "Onocoy Dune Dashboard",
        url: "https://dune.com/onocoy/dashboard",
        accessedDate: "2026-01-16",
        category: 'technical',
        relevance: "On-chain analytics and burn verification (when live).",
    },
    {
        id: 41,
        title: "Onocoy Miners - GNSS Store",
        url: "https://gnss.store/collections/onocoy-miners",
        accessedDate: "2026-01-16",
        category: 'technical',
        relevance: "Hardware pricing and availability for Onocoy miners.",
    },
    {
        id: 42,
        title: "NTRIP-X Base Station Bundle",
        url: "https://eugeo.io/product/ntrip-x-basestation-bundle/",
        accessedDate: "2026-01-16",
        category: 'technical',
        relevance: "Hardware cost reference for Onocoy-compatible stations.",
    },
    {
        id: 43,
        title: "GEODNET Weather Station",
        url: "https://freshminers.com/shop/hardware/geodnet-weather-station/",
        accessedDate: "2026-01-16",
        category: 'technical',
        relevance: "Geodnet hardware pricing reference.",
    },
    {
        id: 44,
        title: "GEODNET: Why We're Bullish",
        url: "https://www.vaneck.com/li/en/blog/digital-assets/matthew-sigel-geodnet-why-were-bullish/",
        accessedDate: "2026-01-16",
        category: 'methodology',
        relevance: "Market analysis and thesis framing for GEODNET.",
    },
];

/**
 * Get sources by category
 */
export function getSourcesByCategory(category: ResearchSource['category']): ResearchSource[] {
    return RESEARCH_SOURCES.filter(s => s.category === category);
}

/**
 * Format source for citation
 */
export function formatCitation(source: ResearchSource): string {
    const author = source.author ? `${source.author}. ` : '';
    const url = source.url ? ` Available at: ${source.url}` : '';
    return `[${source.id}] ${author}"${source.title}." Accessed ${source.accessedDate}.${url}`;
}
