"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

// DUMMY DATA FOR MARKET PAGE
const OVERVIEW_STATS = [
    { id: "mcap", label: "Market Cap", value: "$2.45T", change: "+2.35%", positive: true, sparkline: [40, 50, 42, 60, 55, 70, 85] },
    { id: "vol", label: "24h Volume", value: "$98.35B", change: "+4.12%", positive: true, sparkline: [30, 25, 45, 40, 65, 58, 75] },
    { id: "btc_dom", label: "BTC Dominance", value: "52.35%", change: "-0.35%", positive: false, sparkline: [60, 52, 45, 50, 40, 46, 52] },
    { id: "fg_index", label: "Fear & Greed Index", type: "gauge", value: "62", text: "Greed" },
    { id: "alt_index", label: "Altcoin Index", value: "45 /100", text: "Neutral", sparkline: [45, 48, 44, 46, 50, 47, 45] },
    { id: "open_int", label: "Open Interest (Perp)", value: "$56.72B", change: "+3.21%", positive: true, sparkline: [35, 40, 45, 42, 50, 55, 60] },
];

const GAINERS = [
    { symbol: "PEPE/USDT", name: "Pepe", price: "$0.0001245", change: "+18.35%", code: "PEPE", positive: true },
    { symbol: "WLD/USDT", name: "Worldcoin", price: "$3.245", change: "+15.62%", code: "WLD", positive: true },
    { symbol: "ARB/USDT", name: "Arbitrum", price: "$1.234", change: "+12.45%", code: "ARB", positive: true },
    { symbol: "RNDR/USDT", name: "Render", price: "$8.765", change: "+10.23%", code: "RNDR", positive: true },
    { symbol: "SUI/USDT", name: "Sui", price: "$1.124", change: "+9.85%", code: "SUI", positive: true },
];

const LOSERS = [
    { symbol: "FLOKI/USDT", name: "FLOKI", price: "$0.0001562", change: "-12.35%", code: "FLOKI", positive: false },
    { symbol: "GRT/USDT", name: "The Graph", price: "$0.1234", change: "-9.42%", code: "GRT", positive: false },
    { symbol: "LUNC/USDT", name: "Terra Classic", price: "$0.000089", change: "-8.21%", code: "LUNC", positive: false },
    { symbol: "MASK/USDT", name: "Mask Network", price: "$2.123", change: "-7.55%", code: "MASK", positive: false },
    { symbol: "GMT/USDT", name: "STEPN", price: "$0.2156", change: "-6.35%", code: "GMT", positive: false },
];

const TOP_MARKET_CAP = [
    { symbol: "BTC/USDT", name: "Bitcoin", price: "$68,542.20", change: "+2.45%", code: "BTC", positive: true, volume: "$34.2B", mcap: "$1.35T" },
    { symbol: "ETH/USDT", name: "Ethereum", price: "$3,512.45", change: "+1.65%", code: "ETH", positive: true, volume: "$18.5B", mcap: "$422B" },
    { symbol: "USDT/USDT", name: "Tether", price: "$1.0003", change: "+0.02%", code: "USDT", positive: true, volume: "$45.1B", mcap: "$112B" },
    { symbol: "BNB/USDT", name: "BNB", price: "$595.34", change: "+2.35%", code: "BNB", positive: true, volume: "$1.8B", mcap: "$87B" },
    { symbol: "SOL/USDT", name: "Solana", price: "$175.32", change: "+4.25%", code: "SOL", positive: true, volume: "$3.9B", mcap: "$81B" },
];

const FOREX_DATA = [
    { symbol: "EUR/USD", name: "Euro / US Dollar", price: "1.08945", change: "+0.12%", positive: true, code: "EUS", bid: "1.08943", ask: "1.08947", high: "1.09120", low: "1.08750", category: "Majors" },
    { symbol: "GBP/USD", name: "British Pound / US Dollar", price: "1.27634", change: "+0.18%", positive: true, code: "GBS", bid: "1.27630", ask: "1.27638", high: "1.27900", low: "1.27350", category: "Majors" },
    { symbol: "USD/JPY", name: "US Dollar / Japanese Yen", price: "156.324", change: "-0.08%", positive: false, code: "USP", bid: "156.320", ask: "156.328", high: "156.800", low: "155.900", category: "Majors" },
    { symbol: "USD/CHF", name: "US Dollar / Swiss Franc", price: "0.89234", change: "+0.09%", positive: true, code: "USH", bid: "0.89230", ask: "0.89238", high: "0.89500", low: "0.89010", category: "Majors" },
    { symbol: "AUD/USD", name: "Australian Dollar / US Dollar", price: "0.66345", change: "+0.21%", positive: true, code: "AUS", bid: "0.66340", ask: "0.66350", high: "0.66600", low: "0.66120", category: "Majors" },
    { symbol: "NZD/USD", name: "New Zealand Dollar / USD", price: "0.61240", change: "-0.15%", positive: false, code: "NZD", bid: "0.61235", ask: "0.61245", high: "0.61500", low: "0.61000", category: "Minors" },
    { symbol: "USD/CAD", name: "US Dollar / Canadian Dollar", price: "1.36780", change: "+0.05%", positive: true, code: "CAD", bid: "1.36775", ask: "1.36785", high: "1.37100", low: "1.36500", category: "Minors" },
];

const INDICES_DATA = [
    { symbol: "US500", name: "S&P 500 Index", price: "5,431.60", points: "+29.20", change: "+0.54%", positive: true, code: "SPX", country: "🇺🇸 USA" },
    { symbol: "US100", name: "Nasdaq 100 Index", price: "19,650.20", points: "+159.80", change: "+0.82%", positive: true, code: "NDX", country: "🇺🇸 USA" },
    { symbol: "US30", name: "Dow Jones Industrial", price: "38,886.10", points: "-70.20", change: "-0.18%", positive: false, code: "DJI", country: "🇺🇸 USA" },
    { symbol: "UK100", name: "FTSE 100 Index", price: "8,215.40", points: "+20.50", change: "+0.25%", positive: true, code: "FTSE", country: "🇬🇧 UK" },
    { symbol: "GER40", name: "DAX 40 Index", price: "18,540.80", points: "+75.60", change: "+0.41%", positive: true, code: "DAX", country: "🇩🇪 Germany" },
    { symbol: "JPN225", name: "Nikkei 225 Index", price: "38,700.50", points: "-120.40", change: "-0.31%", positive: false, code: "N225", country: "🇯🇵 Japan" },
    { symbol: "HK50", name: "Hang Seng Index", price: "17,980.20", points: "+185.30", change: "+1.04%", positive: true, code: "HSI", country: "🇭🇰 Hong Kong" },
];

const COMMODITIES_DATA = [
    { symbol: "XAU/USD", name: "Gold Spot", unit: "/ oz", price: "$2,345.80", change: "+0.65%", positive: true, code: "XAU", category: "Precious Metals" },
    { symbol: "XAG/USD", name: "Silver Spot", unit: "/ oz", price: "$29.85", change: "+1.45%", positive: true, code: "XAG", category: "Precious Metals" },
    { symbol: "WTI/USD", name: "Crude Oil WTI", unit: "/ bbl", price: "$78.25", change: "-1.15%", positive: false, code: "WTI", category: "Energy" },
    { symbol: "BRENT/USD", name: "Brent Crude Oil", unit: "/ bbl", price: "$82.40", change: "-0.95%", positive: false, code: "BBR", category: "Energy" },
    { symbol: "NG/USD", name: "Natural Gas", unit: "/ MMBtu", price: "$2.84", change: "+3.10%", positive: true, code: "NAT", category: "Energy" },
    { symbol: "COPPER", name: "High Grade Copper", unit: "/ lb", price: "$4.52", change: "+0.85%", positive: true, code: "COP", category: "Industrial Metals" },
];

export default function MarketPage() {
    const [activeTab, setActiveTab] = useState("Overview");
    const [watchlist, setWatchlist] = useState(new Set(["PEPE/USDT", "WLD/USDT"]));
    const [onlyWatchlist, setOnlyWatchlist] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [showCustomizeModal, setShowCustomizeModal] = useState(false);

    // Toggle star item in watchlist
    const toggleWatchlist = (symbol) => {
        setWatchlist((prev) => {
            const next = new Set(prev);
            if (next.has(symbol)) {
                next.delete(symbol);
            } else {
                next.add(symbol);
            }
            return next;
        });
    };

    // Filter Helper
    const filterItems = (items) => {
        return items.filter((item) => {
            if (onlyWatchlist && !watchlist.has(item.symbol)) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matchSym = item.symbol.toLowerCase().includes(q);
                const matchName = item.name.toLowerCase().includes(q);
                if (!matchSym && !matchName) return false;
            }
            if (categoryFilter !== "All" && item.category && item.category !== categoryFilter) {
                return false;
            }
            return true;
        });
    };

    const TABS = ["Overview", "Crypto", "Forex", "Indices", "Commodities"];

    return (
        <div className="min-h-full px-4 sm:px-8 pt-6 pb-16 bg-[#121212] text-white select-none">
            {/* TOP HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white">Market</h1>
                    <p className="text-sm text-[#B3B3B3] mt-1">
                        Explore global crypto and forex markets. Track prices, charts and market trends.
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <button
                        onClick={() => setOnlyWatchlist(!onlyWatchlist)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-semibold transition cursor-pointer ${
                            onlyWatchlist
                                ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                                : "bg-[#202020] hover:bg-[#282828] border-white/10 text-white"
                        }`}
                    >
                        <span className="text-amber-400">⭐</span>
                        <span>Watchlist ({watchlist.size})</span>
                    </button>

                    <button
                        onClick={() => setShowCustomizeModal(true)}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#202020] hover:bg-[#282828] border border-white/10 text-white text-xs font-semibold transition cursor-pointer"
                    >
                        <span>⚙️</span>
                        <span>Customize</span>
                    </button>
                </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="border-b border-white/10 mb-8 overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-8 min-w-max">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab;
                        return (
                            <button
                                key={tab}
                                onClick={() => {
                                    setActiveTab(tab);
                                    setCategoryFilter("All");
                                }}
                                className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${
                                    isActive ? "text-white" : "text-[#B3B3B3] hover:text-white"
                                }`}
                            >
                                {tab}
                                {isActive && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* TAB CONTENT: OVERVIEW */}
            {activeTab === "Overview" && (
                <div className="space-y-10">
                    {/* STATS CARDS GRID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        {OVERVIEW_STATS.map((stat) => (
                            <div
                                key={stat.id}
                                className="bg-[#181818] border border-white/5 hover:border-white/15 rounded-2xl p-4 transition shadow-lg flex flex-col justify-between"
                            >
                                <div>
                                    <p className="text-xs font-semibold text-[#B3B3B3] mb-1">{stat.label}</p>

                                    {stat.type === "gauge" ? (
                                        <div className="mt-2 text-center">
                                            <div className="relative w-24 h-12 mx-auto overflow-hidden">
                                                <svg viewBox="0 0 100 50" className="w-full h-full">
                                                    <path
                                                        d="M 10 50 A 40 40 0 0 1 90 50"
                                                        fill="none"
                                                        stroke="#2a2a2a"
                                                        strokeWidth="10"
                                                    />
                                                    <path
                                                        d="M 10 50 A 40 40 0 0 1 75 20"
                                                        fill="none"
                                                        stroke="#10b981"
                                                        strokeWidth="10"
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                                <div className="absolute bottom-0 inset-x-0 font-extrabold text-lg text-white">
                                                    {stat.value}
                                                </div>
                                            </div>
                                            <p className="text-xs font-bold text-emerald-400 mt-1">{stat.text}</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <h3 className="text-xl font-extrabold text-white tracking-tight">
                                                {stat.value}
                                            </h3>
                                            {stat.change && (
                                                <p
                                                    className={`text-xs font-bold mt-1 ${
                                                        stat.positive ? "text-emerald-400" : "text-rose-400"
                                                    }`}
                                                >
                                                    {stat.change}
                                                </p>
                                            )}
                                            {stat.text && (
                                                <p className="text-xs font-bold text-amber-400 mt-1">{stat.text}</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {stat.sparkline && (
                                    <div className="mt-4 h-6 flex items-end gap-1">
                                        {stat.sparkline.map((val, i) => (
                                            <div
                                                key={i}
                                                style={{ height: `${val}%` }}
                                                className={`flex-1 rounded-t-xs ${
                                                    stat.positive !== false ? "bg-blue-500/70" : "bg-orange-500/70"
                                                }`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* THREE COLUMNS: TOP GAINERS, TOP LOSERS, TOP MARKET CAP */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* TOP GAINERS */}
                        <div className="bg-[#181818] border border-white/5 rounded-2xl p-5 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <span className="text-orange-400">🔥</span> Top Gainers
                                </h3>
                                <button
                                    onClick={() => setActiveTab("Crypto")}
                                    className="text-xs font-semibold text-blue-400 hover:text-blue-300"
                                >
                                    View All
                                </button>
                            </div>
                            <div className="space-y-3">
                                {filterItems(GAINERS).map((coin, idx) => (
                                    <div
                                        key={coin.symbol}
                                        className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-[#777] font-semibold w-4 text-center">
                                                {idx + 1}
                                            </span>
                                            <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 font-bold text-xs flex items-center justify-center">
                                                {coin.code[0]}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-white leading-tight">
                                                    {coin.symbol}
                                                </p>
                                                <p className="text-[11px] text-[#888] leading-tight">{coin.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-white">{coin.price}</p>
                                                <p className="text-xs font-bold text-emerald-400">{coin.change}</p>
                                            </div>
                                            <button
                                                onClick={() => toggleWatchlist(coin.symbol)}
                                                className="text-sm cursor-pointer hover:scale-110 transition"
                                            >
                                                {watchlist.has(coin.symbol) ? "⭐" : "☆"}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* TOP LOSERS */}
                        <div className="bg-[#181818] border border-white/5 rounded-2xl p-5 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <span className="text-rose-400">📉</span> Top Losers
                                </h3>
                                <button
                                    onClick={() => setActiveTab("Crypto")}
                                    className="text-xs font-semibold text-blue-400 hover:text-blue-300"
                                >
                                    View All
                                </button>
                            </div>
                            <div className="space-y-3">
                                {filterItems(LOSERS).map((coin, idx) => (
                                    <div
                                        key={coin.symbol}
                                        className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-[#777] font-semibold w-4 text-center">
                                                {idx + 1}
                                            </span>
                                            <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold text-xs flex items-center justify-center">
                                                {coin.code[0]}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-white leading-tight">
                                                    {coin.symbol}
                                                </p>
                                                <p className="text-[11px] text-[#888] leading-tight">{coin.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-white">{coin.price}</p>
                                                <p className="text-xs font-bold text-rose-400">{coin.change}</p>
                                            </div>
                                            <button
                                                onClick={() => toggleWatchlist(coin.symbol)}
                                                className="text-sm cursor-pointer hover:scale-110 transition"
                                            >
                                                {watchlist.has(coin.symbol) ? "⭐" : "☆"}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* TOP COINS BY MARKET CAP */}
                        <div className="bg-[#181818] border border-white/5 rounded-2xl p-5 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <span className="text-amber-400">⭐</span> Top Coins by Market Cap
                                </h3>
                                <button
                                    onClick={() => setActiveTab("Crypto")}
                                    className="text-xs font-semibold text-blue-400 hover:text-blue-300"
                                >
                                    View All
                                </button>
                            </div>
                            <div className="space-y-3">
                                {filterItems(TOP_MARKET_CAP).map((coin, idx) => (
                                    <div
                                        key={coin.symbol}
                                        className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-[#777] font-semibold w-4 text-center">
                                                {idx + 1}
                                            </span>
                                            <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center">
                                                {coin.code[0]}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-white leading-tight">
                                                    {coin.symbol}
                                                </p>
                                                <p className="text-[11px] text-[#888] leading-tight">{coin.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-white">{coin.price}</p>
                                                <p className="text-xs font-bold text-emerald-400">{coin.change}</p>
                                            </div>
                                            <button
                                                onClick={() => toggleWatchlist(coin.symbol)}
                                                className="text-sm cursor-pointer hover:scale-110 transition"
                                            >
                                                {watchlist.has(coin.symbol) ? "⭐" : "☆"}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: CRYPTO */}
            {activeTab === "Crypto" && (
                <div className="space-y-6">
                    {/* SEARCH & FILTERS */}
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <input
                            type="text"
                            placeholder="Search crypto assets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-80 bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        />

                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide w-full sm:w-auto">
                            {["All", "Top Cap", "Gainers", "Losers"].map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setCategoryFilter(cat)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                                        categoryFilter === cat
                                            ? "bg-blue-600 text-white"
                                            : "bg-[#202020] text-[#aaa] hover:text-white"
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* CRYPTO TABLE */}
                    <div className="bg-[#181818] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-[#202020] text-xs font-semibold text-[#888] uppercase tracking-wider border-b border-white/5">
                                    <tr>
                                        <th className="py-3 px-4">Asset</th>
                                        <th className="py-3 px-4">Price</th>
                                        <th className="py-3 px-4">24h Change</th>
                                        <th className="py-3 px-4 hidden md:table-cell">24h Volume</th>
                                        <th className="py-3 px-4 hidden lg:table-cell">Market Cap</th>
                                        <th className="py-3 px-4 text-right">Watchlist</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-white font-medium">
                                    {filterItems([...TOP_MARKET_CAP, ...GAINERS, ...LOSERS]).map((coin) => (
                                        <tr key={coin.symbol} className="hover:bg-white/5 transition">
                                            <td className="py-3.5 px-4 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                                                    {coin.code[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">{coin.symbol}</p>
                                                    <p className="text-xs text-[#888]">{coin.name}</p>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 font-bold">{coin.price}</td>
                                            <td
                                                className={`py-3.5 px-4 font-bold ${
                                                    coin.positive ? "text-emerald-400" : "text-rose-400"
                                                }`}
                                            >
                                                {coin.change}
                                            </td>
                                            <td className="py-3.5 px-4 hidden md:table-cell text-[#bbb]">
                                                {coin.volume || "$1.2B"}
                                            </td>
                                            <td className="py-3.5 px-4 hidden lg:table-cell text-[#bbb]">
                                                {coin.mcap || "$4.5B"}
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <button
                                                    onClick={() => toggleWatchlist(coin.symbol)}
                                                    className="text-lg cursor-pointer hover:scale-110 transition"
                                                >
                                                    {watchlist.has(coin.symbol) ? "⭐" : "☆"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: FOREX */}
            {activeTab === "Forex" && (
                <div className="space-y-6">
                    {/* CATEGORY FILTERS */}
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                        {["All", "Majors", "Minors"].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                                    categoryFilter === cat
                                        ? "bg-blue-600 text-white"
                                        : "bg-[#202020] text-[#aaa] hover:text-white"
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* FOREX TABLE */}
                    <div className="bg-[#181818] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-[#202020] text-xs font-semibold text-[#888] uppercase tracking-wider border-b border-white/5">
                                    <tr>
                                        <th className="py-3.5 px-4">Currency Pair</th>
                                        <th className="py-3.5 px-4">Price</th>
                                        <th className="py-3.5 px-4">Change</th>
                                        <th className="py-3.5 px-4 hidden md:table-cell">Bid</th>
                                        <th className="py-3.5 px-4 hidden md:table-cell">Ask</th>
                                        <th className="py-3.5 px-4 hidden lg:table-cell">24h High / Low</th>
                                        <th className="py-3.5 px-4 text-right">Watchlist</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-white font-medium">
                                    {filterItems(FOREX_DATA).map((pair) => (
                                        <tr key={pair.symbol} className="hover:bg-white/5 transition">
                                            <td className="py-3.5 px-4 flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-xs flex items-center justify-center shrink-0">
                                                    {pair.code}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">{pair.symbol}</p>
                                                    <p className="text-xs text-[#888]">{pair.name}</p>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 font-extrabold text-white">{pair.price}</td>
                                            <td
                                                className={`py-3.5 px-4 font-bold ${
                                                    pair.positive ? "text-emerald-400" : "text-rose-400"
                                                }`}
                                            >
                                                {pair.change}
                                            </td>
                                            <td className="py-3.5 px-4 hidden md:table-cell text-[#bbb]">
                                                {pair.bid}
                                            </td>
                                            <td className="py-3.5 px-4 hidden md:table-cell text-[#bbb]">
                                                {pair.ask}
                                            </td>
                                            <td className="py-3.5 px-4 hidden lg:table-cell text-xs text-[#888]">
                                                {pair.high} / {pair.low}
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <button
                                                    onClick={() => toggleWatchlist(pair.symbol)}
                                                    className="text-lg cursor-pointer hover:scale-110 transition"
                                                >
                                                    {watchlist.has(pair.symbol) ? "⭐" : "☆"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: INDICES */}
            {activeTab === "Indices" && (
                <div className="space-y-6">
                    <div className="bg-[#181818] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-[#202020] text-xs font-semibold text-[#888] uppercase tracking-wider border-b border-white/5">
                                    <tr>
                                        <th className="py-3.5 px-4">Index</th>
                                        <th className="py-3.5 px-4">Region</th>
                                        <th className="py-3.5 px-4">Value</th>
                                        <th className="py-3.5 px-4">Points</th>
                                        <th className="py-3.5 px-4">Change %</th>
                                        <th className="py-3.5 px-4 text-right">Watchlist</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-white font-medium">
                                    {filterItems(INDICES_DATA).map((idx) => (
                                        <tr key={idx.symbol} className="hover:bg-white/5 transition">
                                            <td className="py-3.5 px-4 flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-extrabold text-xs flex items-center justify-center shrink-0">
                                                    {idx.code}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">{idx.name}</p>
                                                    <p className="text-xs text-[#888]">{idx.symbol}</p>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 text-xs font-semibold text-[#aaa]">
                                                {idx.country}
                                            </td>
                                            <td className="py-3.5 px-4 font-bold text-white">{idx.price}</td>
                                            <td
                                                className={`py-3.5 px-4 font-bold ${
                                                    idx.positive ? "text-emerald-400" : "text-rose-400"
                                                }`}
                                            >
                                                {idx.points}
                                            </td>
                                            <td
                                                className={`py-3.5 px-4 font-bold ${
                                                    idx.positive ? "text-emerald-400" : "text-rose-400"
                                                }`}
                                            >
                                                {idx.change}
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <button
                                                    onClick={() => toggleWatchlist(idx.symbol)}
                                                    className="text-lg cursor-pointer hover:scale-110 transition"
                                                >
                                                    {watchlist.has(idx.symbol) ? "⭐" : "☆"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: COMMODITIES */}
            {activeTab === "Commodities" && (
                <div className="space-y-6">
                    {/* CATEGORY FILTERS */}
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                        {["All", "Precious Metals", "Energy", "Industrial Metals"].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                                    categoryFilter === cat
                                        ? "bg-blue-600 text-white"
                                        : "bg-[#202020] text-[#aaa] hover:text-white"
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="bg-[#181818] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-[#202020] text-xs font-semibold text-[#888] uppercase tracking-wider border-b border-white/5">
                                    <tr>
                                        <th className="py-3.5 px-4">Commodity</th>
                                        <th className="py-3.5 px-4">Category</th>
                                        <th className="py-3.5 px-4">Price</th>
                                        <th className="py-3.5 px-4">24h Change</th>
                                        <th className="py-3.5 px-4 text-right">Watchlist</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-white font-medium">
                                    {filterItems(COMMODITIES_DATA).map((item) => (
                                        <tr key={item.symbol} className="hover:bg-white/5 transition">
                                            <td className="py-3.5 px-4 flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-extrabold text-xs flex items-center justify-center shrink-0">
                                                    {item.code}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">{item.name}</p>
                                                    <p className="text-xs text-[#888]">{item.symbol}</p>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 text-xs font-semibold text-[#aaa]">
                                                {item.category}
                                            </td>
                                            <td className="py-3.5 px-4 font-bold text-white">
                                                {item.price}{" "}
                                                <span className="text-xs text-[#777] font-normal">{item.unit}</span>
                                            </td>
                                            <td
                                                className={`py-3.5 px-4 font-bold ${
                                                    item.positive ? "text-emerald-400" : "text-rose-400"
                                                }`}
                                            >
                                                {item.change}
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <button
                                                    onClick={() => toggleWatchlist(item.symbol)}
                                                    className="text-lg cursor-pointer hover:scale-110 transition"
                                                >
                                                    {watchlist.has(item.symbol) ? "⭐" : "☆"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* CUSTOMIZE MODAL */}
            {showCustomizeModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <h3 className="text-lg font-bold text-white">Customize Market Display</h3>
                            <button
                                onClick={() => setShowCustomizeModal(false)}
                                className="text-gray-400 hover:text-white font-bold text-xl"
                            >
                                &times;
                            </button>
                        </div>
                        <p className="text-xs text-[#aaa]">
                            Select which markets and indicators to highlight in your dashboard overview.
                        </p>
                        <div className="space-y-2">
                            {["Crypto Top 100", "Forex Major Pairs", "Global Indices", "Energy & Metals"].map((opt) => (
                                <label
                                    key={opt}
                                    className="flex items-center justify-between p-3 rounded-xl bg-[#222] hover:bg-[#282828] cursor-pointer transition text-sm font-semibold"
                                >
                                    <span>{opt}</span>
                                    <input type="checkbox" defaultChecked className="accent-blue-500 w-4 h-4" />
                                </label>
                            ))}
                        </div>
                        <div className="pt-2 flex justify-end">
                            <button
                                onClick={() => setShowCustomizeModal(false)}
                                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
