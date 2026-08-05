"use client";

import VinylRecord from "./VinylRecord";

export default function FramedMediaStack({ className = "", compact = false }) {
    if (compact) {
        return (
            <div className={`relative flex flex-col items-end gap-2 select-none ${className}`}>
                {/* Frame 1: Gold Vinyl */}
                <div className="w-28 h-18 gold-double-border bg-[#131b1e]/95 rounded-sm p-1.5 flex items-center justify-center shadow-lg">
                    <VinylRecord color="gold" size={60} spinSpeed={14} />
                </div>

                {/* Frame 2: Cassettes */}
                <div className="w-32 h-20 gold-double-border bg-[#131b1e]/95 rounded-sm p-1.5 flex flex-col justify-around shadow-lg">
                    <div className="w-full h-5 rounded bg-gradient-to-r from-[#4a2e2b] via-[#6e433b] to-[#3a221f] border border-[#c5a059]/50 flex items-center px-1.5 justify-between">
                        <span className="text-[6px] font-bold text-[#e8d5b5] truncate font-serif">Syd&apos;s Secret</span>
                        <div className="w-2 h-2 rounded-full border border-[#c5a059] bg-[#1a1110]" />
                    </div>
                    <div className="w-full h-5 rounded bg-gradient-to-r from-[#2a4542] via-[#3d635f] to-[#1e3330] border border-[#c5a059]/50 flex items-center px-1.5 justify-between">
                        <span className="text-[6px] font-bold text-[#e8d5b5] truncate font-serif">Zeppelin Rarity</span>
                        <div className="w-2 h-2 rounded-full border border-[#c5a059] bg-[#0d1c1a]" />
                    </div>
                </div>

                {/* Frame 3: Stacked Vinyls */}
                <div className="w-32 h-24 gold-double-border bg-[#131b1e]/95 rounded-sm p-1.5 flex items-center justify-center relative overflow-hidden shadow-lg">
                    <div className="absolute left-1 bottom-1 opacity-90">
                        <VinylRecord color="silver" size={55} spinSpeed={22} />
                    </div>
                    <div className="absolute right-1 top-1">
                        <VinylRecord color="gold" size={60} spinSpeed={16} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative flex flex-col items-center gap-5 select-none ${className}`}>
            {/* Top Frame Box: Gold Vinyl Record */}
            <div className="relative w-48 h-32 md:w-56 md:h-36 gold-double-border bg-[#131b1e]/90 rounded-sm p-3 flex items-center justify-center overflow-hidden transform hover:scale-105 transition-transform duration-300 shadow-2xl">
                <div className="absolute inset-1 border border-[#c5a059]/30 pointer-events-none" />
                <VinylRecord color="gold" size={120} spinSpeed={14} />
            </div>

            {/* Middle Frame Box: Stacked Cassette Tapes Display */}
            <div className="relative w-56 h-36 md:w-64 md:h-40 gold-double-border bg-[#131b1e]/95 rounded-sm p-3 flex flex-col justify-around overflow-hidden transform hover:scale-105 transition-transform duration-300 shadow-2xl">
                <div className="absolute inset-1 border border-[#c5a059]/30 pointer-events-none" />

                {/* Cassette 1: Syd's Secret */}
                <div className="relative w-full h-8 rounded bg-gradient-to-r from-[#4a2e2b] via-[#6e433b] to-[#3a221f] border border-[#c5a059]/50 flex items-center px-3 justify-between shadow-md transform -rotate-1">
                    <div className="w-20 h-4 bg-[#e8d5b5] rounded-sm flex items-center justify-center px-1">
                        <span className="text-[8px] font-bold text-[#3a221f] truncate font-serif">Syd&apos;s Secret</span>
                    </div>
                    <div className="flex gap-2 items-center">
                        <div className="w-3.5 h-3.5 rounded-full border border-[#c5a059] bg-[#1a1110] flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-[#e8d5b5] rounded-full" />
                        </div>
                        <div className="w-3.5 h-3.5 rounded-full border border-[#c5a059] bg-[#1a1110] flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-[#e8d5b5] rounded-full" />
                        </div>
                    </div>
                </div>

                {/* Cassette 2: Zeppelin Rarity */}
                <div className="relative w-full h-8 rounded bg-gradient-to-r from-[#2a4542] via-[#3d635f] to-[#1e3330] border border-[#c5a059]/50 flex items-center px-3 justify-between shadow-md transform rotate-1">
                    <div className="w-24 h-4 bg-[#e8d5b5] rounded-sm flex items-center justify-center px-1">
                        <span className="text-[8px] font-bold text-[#1e3330] truncate font-serif">Zeppelin Rarity</span>
                    </div>
                    <div className="flex gap-2 items-center">
                        <div className="w-3.5 h-3.5 rounded-full border border-[#c5a059] bg-[#0d1c1a] flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-[#e8d5b5] rounded-full" />
                        </div>
                        <div className="w-3.5 h-3.5 rounded-full border border-[#c5a059] bg-[#0d1c1a] flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-[#e8d5b5] rounded-full" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Frame Box: Dual Gold & Silver Vinyl Stack Display */}
            <div className="relative w-52 h-44 md:w-60 md:h-48 gold-double-border bg-[#131b1e]/90 rounded-sm p-3 flex items-center justify-center overflow-hidden transform hover:scale-105 transition-transform duration-300 shadow-2xl">
                <div className="absolute inset-1 border border-[#c5a059]/30 pointer-events-none" />

                {/* Silver Vinyl (underneath) */}
                <div className="absolute left-4 bottom-3 opacity-90">
                    <VinylRecord color="silver" size={110} spinSpeed={22} />
                </div>

                {/* Gold Vinyl (front) */}
                <div className="absolute right-3 top-3">
                    <VinylRecord color="gold" size={115} spinSpeed={16} />
                </div>
            </div>
        </div>
    );
}
