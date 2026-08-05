"use client";

import VinylRecord from "./VinylRecord";

export default function FramedMediaStack({ className = "" }) {
    return (
        <div className={`relative select-none ${className}`}>
            {/* Single Unified Double-Gold Framed Aesthetic Card */}
            <div className="relative w-64 md:w-80 gold-double-border bg-[#121c1f]/90 backdrop-blur-md rounded-md p-5 flex flex-col items-center gap-6 shadow-2xl overflow-hidden transform hover:scale-[1.02] transition-transform duration-300">
                
                {/* Decorative Inner Framing Accent */}
                <div className="absolute inset-1.5 border border-[#c5a059]/25 pointer-events-none rounded-sm" />

                {/* Section 1: Single Gold Vinyl Record */}
                <div className="relative py-1 flex items-center justify-center">
                    <VinylRecord color="gold" size={130} spinSpeed={20} />
                </div>

                {/* Divider Line */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-[#c5a059]/40 to-transparent" />

                {/* Section 2: Cassette Tapes Stack */}
                <div className="w-full flex flex-col gap-2.5 px-1">
                    {/* Cassette 1: Syd's Secret */}
                    <div className="relative w-full h-9 rounded bg-gradient-to-r from-[#4a2e2b] via-[#6e433b] to-[#3a221f] border border-[#c5a059]/50 flex items-center px-3 justify-between shadow-md transform -rotate-1 hover:rotate-0 transition-transform">
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
                    <div className="relative w-full h-9 rounded bg-gradient-to-r from-[#2a4542] via-[#3d635f] to-[#1e3330] border border-[#c5a059]/50 flex items-center px-3 justify-between shadow-md transform rotate-1 hover:rotate-0 transition-transform">
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

                {/* Divider Line */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-[#c5a059]/40 to-transparent" />

                {/* Section 3: Stacked Gold & Silver Vinyl Records */}
                <div className="relative w-full h-36 flex items-center justify-center">
                    {/* Silver Vinyl (behind) */}
                    <div className="absolute left-2 bottom-1 opacity-85">
                        <VinylRecord color="silver" size={110} spinSpeed={26} />
                    </div>
                    {/* Gold Vinyl (front) */}
                    <div className="absolute right-2 top-1">
                        <VinylRecord color="gold" size={115} spinSpeed={18} />
                    </div>
                </div>

            </div>
        </div>
    );
}
