"use client";

import VinylRecord from "./VinylRecord";

function Cassette({ label, labelClass, shell }) {
    return (
        <div
            className={`w-full h-8 rounded-[3px] border border-[#c5a059]/50 flex items-center px-2.5 justify-between shadow-md ${shell}`}
        >
            <div
                className={`h-4 rounded-[2px] flex items-center justify-center px-1.5 ${labelClass}`}
            >
                <span className="text-[7px] font-bold tracking-wide truncate font-serif italic text-[#3a2a12]">
                    {label}
                </span>
            </div>
            <div className="flex gap-1.5 items-center">
                <div className="w-2.5 h-2.5 rounded-full border border-[#c5a059] bg-[#161110] flex items-center justify-center">
                    <div className="w-1 h-1 bg-[#e8d5b5] rounded-full" />
                </div>
                <div className="w-2.5 h-2.5 rounded-full border border-[#c5a059] bg-[#161110] flex items-center justify-center">
                    <div className="w-1 h-1 bg-[#e8d5b5] rounded-full" />
                </div>
            </div>
        </div>
    );
}

export default function VintageCollage({ className = "" }) {
    return (
        <div className={`relative flex flex-col items-center select-none ${className}`}>
            {/* ── Top frame: small golden vinyl ── */}
            <div className="float-card" style={{ animationDelay: "0s" }}>
                <div className="tilt-card premium-frame w-40 h-32 md:w-44 md:h-36 p-3 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-2 border border-[#c5a059]/25 rounded-[3px] pointer-events-none" />
                    <VinylRecord color="gold" size={96} spinSpeed={16} isInteractive={false} />
                </div>
            </div>

            {/* ── Middle frame: cassette collection ── */}
            <div className="float-card -mt-3" style={{ animationDelay: "1.4s" }}>
                <div className="tilt-card premium-frame w-44 h-36 md:w-52 md:h-40 p-3 flex flex-col justify-around gap-2 overflow-hidden">
                    <div className="absolute inset-2 border border-[#c5a059]/25 rounded-[3px] pointer-events-none" />
                    <Cassette
                        label="Syd's Secret"
                        shell="bg-gradient-to-r from-[#4a2e2b] via-[#6e433b] to-[#3a221f] -rotate-1"
                        labelClass="bg-[#e8d5b5] w-16"
                    />
                    <Cassette
                        label="Zeppelin Rarity"
                        shell="bg-gradient-to-r from-[#2a4542] via-[#3d635f] to-[#1e3330] rotate-1"
                        labelClass="bg-[#e8d5b5] w-20"
                    />
                    <Cassette
                        label="Nightdrive '86"
                        shell="bg-gradient-to-r from-[#31384a] via-[#46506b] to-[#242a3a] -rotate-1"
                        labelClass="bg-[#e8d5b5] w-18"
                    />
                </div>
            </div>

            {/* ── Bottom frame: brass + silver vinyl stack ── */}
            <div className="float-card -mt-3" style={{ animationDelay: "2.6s" }}>
                <div className="tilt-card premium-frame w-44 h-40 md:w-52 md:h-44 p-3 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-2 border border-[#c5a059]/25 rounded-[3px] pointer-events-none" />
                    <div className="absolute left-2 bottom-1 opacity-90">
                        <VinylRecord color="silver" size={92} spinSpeed={24} isInteractive={false} />
                    </div>
                    <div className="absolute right-1 top-1">
                        <VinylRecord color="gold" size={98} spinSpeed={18} isInteractive={false} />
                    </div>
                </div>
            </div>
        </div>
    );
}
