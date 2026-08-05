"use client";

import { useState } from "react";
import Link from "next/link";

const MARKET_DATA = {
    Crypto: {
        stats: [
            { label: "Market Cap", value: "$2.45T", change: "+2.35%", positive: true, sparkline: [40, 50, 42, 60, 55, 70, 85] },
            { label: "24h Volume", value: "$98.35B", change: "+4.12%", positive: true, sparkline: [30, 25, 45, 40, 65, 58, 75] },
            { label: "BTC Dominance", value: "52.35%", change: "-0.35%", positive: false, sparkline: [60, 52, 45, 50, 40, 46, 52] },
        ],
        items: [
            { symbol: "BTC/USDT", name: "Bitcoin", price: "$68,542.20", change: "+2.45%", positive: true, code: "BTC" },
            { symbol: "ETH/USDT", name: "Ethereum", price: "$3,512.45", change: "+1.65%", positive: true, code: "ETH" },
            { symbol: "BNB/USDT", name: "BNB", price: "$595.34", change: "+2.35%", positive: true, code: "BNB" },
            { symbol: "SOL/USDT", name: "Solana", price: "$175.32", change: "+4.25%", positive: true, code: "SOL" },
            { symbol: "PEPE/USDT", name: "Pepe", price: "$0.0001245", change: "+18.35%", positive: true, code: "PEPE" },
        ],
    },
    Forex: {
        stats: [
            { label: "USD Index (DXY)", value: "105.42", change: "-0.15%", positive: false, sparkline: [55, 58, 52, 49, 47, 45, 44] },
            { label: "EUR/USD Volume", value: "$1.42T", change: "+1.20%", positive: true, sparkline: [40, 42, 45, 43, 48, 52, 55] },
            { label: "Volatility Index", value: "8.45", change: "-2.10%", positive: false, sparkline: [70, 65, 60, 52, 48, 45, 40] },
        ],
        items: [
            { symbol: "EUR/USD", name: "Euro / US Dollar", price: "1.08945", change: "+0.12%", positive: true, code: "EUS" },
            { symbol: "GBP/USD", name: "British Pound / US Dollar", price: "1.27634", change: "+0.18%", positive: true, code: "GBS" },
            { symbol: "USD/JPY", name: "US Dollar / Japanese Yen", price: "156.324", change: "-0.08%", positive: false, code: "USP" },
            { symbol: "USD/CHF", name: "US Dollar / Swiss Franc", price: "0.89234", change: "+0.09%", positive: true, code: "USH" },
            { symbol: "AUD/USD", name: "Australian Dollar / US Dollar", price: "0.66345", change: "+0.21%", positive: true, code: "AUS" },
        ],
    },
    Indices: {
        stats: [
            { label: "S&P 500", value: "5,431.60", change: "+0.54%", positive: true, sparkline: [50, 52, 55, 53, 58, 62, 65] },
            { label: "Nasdaq 100", value: "19,650.20", change: "+0.82%", positive: true, sparkline: [45, 48, 52, 56, 60, 65, 70] },
            { label: "Dow Jones", value: "38,886.10", change: "-0.18%", positive: false, sparkline: [60, 58, 59, 57, 55, 54, 53] },
        ],
        items: [
            { symbol: "US500", name: "S&P 500 Index", price: "5,431.60", change: "+0.54%", positive: true, code: "SPX" },
            { symbol: "US100", name: "Nasdaq 100 Index", price: "19,650.20", change: "+0.82%", positive: true, code: "NDX" },
            { symbol: "US30", name: "Dow Jones Industrial", price: "38,886.10", change: "-0.18%", positive: false, code: "DJI" },
            { symbol: "UK100", name: "FTSE 100 Index", price: "8,215.40", change: "+0.25%", positive: true, code: "FTSE" },
            { symbol: "GER40", name: "DAX 40 Index", price: "18,540.80", change: "+0.41%", positive: true, code: "DAX" },
        ],
    },
    Commodities: {
        stats: [
            { label: "Gold (XAU/USD)", value: "$2,345.80", change: "+0.65%", positive: true, sparkline: [45, 48, 50, 55, 53, 58, 62] },
            { label: "Crude Oil (WTI)", value: "$78.25", change: "-1.15%", positive: false, sparkline: [65, 62, 58, 55, 52, 50, 48] },
            { label: "Silver (XAG/USD)", value: "$29.85", change: "+1.45%", positive: true, sparkline: [35, 40, 42, 48, 52, 55, 60] },
        ],
        items: [
            { symbol: "XAU/USD", name: "Gold Spot / US Dollar", price: "$2,345.80", change: "+0.65%", positive: true, code: "XAU" },
            { symbol: "XAG/USD", name: "Silver Spot / US Dollar", price: "$29.85", change: "+1.45%", positive: true, code: "XAG" },
            { symbol: "WTI/USD", name: "Crude Oil WTI", price: "$78.25", change: "-1.15%", positive: false, code: "WTI" },
            { symbol: "BRENT/USD", name: "Brent Crude Oil", price: "$82.40", change: "-0.95%", positive: false, code: "BBR" },
            { symbol: "NG/USD", name: "Natural Gas Spot", price: "$2.84", change: "+3.10%", positive: true, code: "NAT" },
        ],
    },
};

export default function MarketOverview() {
    const [activeTab, setActiveTab] = useState("Crypto");
    const currentData = MARKET_DATA[activeTab] || MARKET_DATA.Crypto;

    return (
        <section className="mb-10 bg-[#181818] border border-white/10 rounded-2xl p-6 shadow-xl">
            {/* Header & Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
                <h2 className="text-xl font-bold text-white tracking-tight">Market Overview</h2>
                <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
                    {Object.keys(MARKET_DATA).map((tab) => {
                        const isActive = activeTab === tab;
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`text-sm font-semibold transition-colors pb-1 border-b-2 cursor-pointer whitespace-nowrap ${
                                    isActive
                                        ? "border-blue-500 text-blue-500"
                                        : "border-transparent text-[#B3B3B3] hover:text-white"
                                }`}
                            >
                                {tab}
                            </button>
                        );
                    })}
                </div>
                <Link
                    href="/market"
                    className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition shrink-0 hidden sm:block"
                >
                    View Market &rarr;
                </Link>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {currentData.stats.map((stat, idx) => (
                    <div
                        key={`${activeTab}-stat-${idx}`}
                        className="bg-[#242424] border border-white/5 rounded-xl p-4 flex flex-col justify-between"
                    >
                        <div>
                            <p className="text-xs text-[#B3B3B3] font-medium mb-1">{stat.label}</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-extrabold text-white tracking-tight">{stat.value}</h3>
                                <span
                                    className={`text-xs font-bold ${
                                        stat.positive ? "text-emerald-400" : "text-rose-400"
                                    }`}
                                >
                                    {stat.change}
                                </span>
                            </div>
                        </div>
                        {/* Mini Sparkline Chart */}
                        <div className="mt-3 h-8 flex items-end gap-1 pt-2">
                            {stat.sparkline.map((val, i) => (
                                <div
                                    key={i}
                                    style={{ height: `${val}%` }}
                                    className={`flex-1 rounded-t-sm transition-all ${
                                        stat.positive ? "bg-blue-500/60" : "bg-[#1db954]/60"
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Asset Items List */}
            <div className="bg-[#202020] border border-white/5 rounded-xl divide-y divide-white/5 overflow-hidden">
                {currentData.items.map((item, idx) => (
                    <div
                        key={`${activeTab}-item-${idx}`}
                        className="flex items-center justify-between p-3.5 hover:bg-white/5 transition"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center font-bold text-xs text-white uppercase tracking-wider">
                                {item.code}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white leading-snug">{item.symbol}</p>
                                <p className="text-xs text-[#B3B3B3] leading-snug">{item.name}</p>
                            </div>
                        </div>

                        <div className="text-right">
                            <p className="text-sm font-bold text-white">{item.price}</p>
                            <p
                                className={`text-xs font-bold ${
                                    item.positive ? "text-emerald-400" : "text-rose-400"
                                }`}
                            >
                                {item.change}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 text-center sm:hidden">
                <Link href="/market" className="text-sm font-semibold text-blue-400 hover:text-blue-300">
                    View Market Page &rarr;
                </Link>
            </div>
        </section>
    );
}
