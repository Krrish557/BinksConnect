"use client";

import VinylRecord from "./VinylRecord";

export default function FramedMediaStack({ className = "" }) {
    return (
        <div className={`relative flex flex-col items-center gap-6 p-4 select-none ${className}`}>
            {/* Top Frame: Gold Vinyl Display */}
            <div className="relative w-48 h-32 md:w-56 md:h-36 gold-double-border bg-[#131b1e]/90 rounded-sm p-3 flex items-center justify-center overflow-hidden transform hover:scale-105 transition-transform duration-300 shadow-2xl">
                <div className="absolute inset-1 border border-[#c5a059]/30 pointer-events-none" />
                <VinylRecord color="gold" size={120} spinSpeed={14} />
            </div>

            {/* Middle Frame: Stacked Cassette Tapes Display */}
            <div className="relative w-56 h-36 md:w-64 md:h-40 gold-double-border bg-[#131b1e]/95 rounded-sm p-3 flex flex-col justify-around overflow-hidden transform hover:scale-105 transition-transform duration-300 shadow-2xl">
                <div className="absolute inset-1 border border-[#c5a059]/30 pointer-events-none" />

                {/* Cassette 1: Syd's Secret */}
                <div className="relative w-full h-8 rounded bg-gradient-to-r from-[#4a2e2b] via-[#6e433b] to-[#3a221f] border border-[#c5a059]/50 flex items-center px-3 justify-between shadow-md transform -rotate-1">
                    <div className="w-16 h-4 bg-[#e8d5b5] rounded-sm flex items-center justify-center px-1">
                        <span className="text-[7px] font-bold text-[#3a221f] truncate font-serif">Syd&apos;s Secret</span>
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
                    <div className="w-20 h-4 bg-[#e8d5b5] rounded-sm flex items-center justify-center px-1">
                        <span className="text-[7px] font-bold text-[#1e3330] truncate font-serif">Zeppelin Rarity</span>
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

            {/* Bottom Frame: Dual Gold & Silver Vinyl Stack Display */}
            <div className="relative w-52 h-44 md:w-60 md:h-48 gold-double-border bg-[#131b1e]/90 rounded-sm p-3 flex items-center justify-center overflow-hidden transform hover:scale-105 transition-transform duration-300 shadow-2xl">
                <div className="absolute inset-1 border border-[#c5a059]/30 pointer-events-none" />

                {/* Silver Vinyl (underneath) */}
                <div className="absolute left-4 bottom-3 opacity-90">
                    <VinylRecord color="silver" size={110} spinSpeed={22} />
                </div>

                {/* Gold Vinyl (overlapping top) */}
                <div className="absolute right-3 top-3">
                    <VinylRecord color="gold" size={115} spinSpeed={16} />
                </div>
            </div>
        </div>
    );
}
