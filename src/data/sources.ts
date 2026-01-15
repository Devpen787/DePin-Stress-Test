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
