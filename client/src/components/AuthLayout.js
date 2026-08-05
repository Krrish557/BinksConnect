"use client";

import VinylRecord from "./theme/VinylRecord";
import SoundWaves from "./theme/SoundWaves";
import FramedMediaStack from "./theme/FramedMediaStack";

export default function AuthLayout({ children }) {
    return (
        <main className="min-h-screen w-full bg-vintage-slate text-[#eae2d0] relative overflow-hidden flex flex-col justify-between items-center selection:bg-[#c5a059] selection:text-black py-4 lg:py-6">
            {/* Background Watermark Pattern (Vinyl & Cassette Line Art) */}
            <div className="absolute inset-0 opacity-[0.07] pointer-events-none mix-blend-overlay">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <pattern id="vinylPattern" width="220" height="220" patternUnits="userSpaceOnUse">
                        <circle cx="110" cy="110" r="85" fill="none" stroke="#dfb872" strokeWidth="1.5" />
                        <circle cx="110" cy="110" r="60" fill="none" stroke="#dfb872" strokeWidth="1" />
                        <circle cx="110" cy="110" r="35" fill="none" stroke="#dfb872" strokeWidth="0.8" />
                        <circle cx="110" cy="110" r="15" fill="none" stroke="#dfb872" strokeWidth="1.5" />
                        <rect x="15" y="15" width="50" height="30" rx="3" fill="none" stroke="#dfb872" strokeWidth="1" />
                        <rect x="155" y="165" width="50" height="30" rx="3" fill="none" stroke="#dfb872" strokeWidth="1" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#vinylPattern)" />
                </svg>
            </div>

            {/* Desktop Top Tagline Banner */}
            <div className="hidden lg:block w-full pt-4 pb-2 text-center z-10">
                <h2 className="text-3xl font-serif tracking-wider gold-text-gradient drop-shadow-md">
                    Drop the needle and dive back in.
                </h2>
            </div>

            {/* Main Center Container */}
            <div className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 my-auto flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-16">

                {/* LEFT / CENTER: Login Card & Overlapping Rotating Blue Vinyl */}
                <div className="relative w-full max-w-[380px] lg:max-w-[420px] mx-auto lg:mx-0 flex flex-col items-center lg:items-start my-auto">
                    
                    {/* Mobile Top Header (Android View: Name & Tagline above card) */}
                    <div className="block lg:hidden text-center mb-4">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <div className="flex gap-1 items-end h-7">
                                <div className="w-1.5 h-6 bg-[#dfb872] rounded-full animate-pulse" />
                                <div className="w-1.5 h-4 bg-[#dfb872] rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                                <div className="w-1.5 h-7 bg-[#dfb872] rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                                <div className="w-1.5 h-5 bg-[#dfb872] rounded-full animate-pulse" style={{ animationDelay: "0.15s" }} />
                            </div>
                            <h1 className="text-2xl font-bold font-serif tracking-tight gold-text-gradient">
                                BinksConnect
                            </h1>
                        </div>
                        <p className="text-sm font-serif italic text-[#dfb872]/90">
                            Drop the needle and dive back in.
                        </p>
                    </div>

                    {/* Main Form Card Box */}
                    <div className="relative z-10 w-full bg-[#141f22]/95 backdrop-blur-md rounded-xl p-6 sm:p-8 gold-double-border shadow-2xl overflow-visible">

                        {/* Card Header (Desktop Logo inside card) */}
                        <div className="hidden lg:flex items-center gap-3 mb-6">
                            <div className="flex gap-1 items-end h-8">
                                <div className="w-1.5 h-7 bg-gradient-to-t from-[#c5a059] to-[#f4e2b8] rounded-full animate-pulse" />
                                <div className="w-1.5 h-5 bg-gradient-to-t from-[#c5a059] to-[#f4e2b8] rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                                <div className="w-1.5 h-8 bg-gradient-to-t from-[#c5a059] to-[#f4e2b8] rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                                <div className="w-1.5 h-6 bg-gradient-to-t from-[#c5a059] to-[#f4e2b8] rounded-full animate-pulse" style={{ animationDelay: "0.15s" }} />
                            </div>
                            <h1 className="text-3xl font-bold font-serif tracking-tight gold-text-gradient">
                                BinksConnect
                            </h1>
                        </div>

                        {/* Form Content */}
                        {children}

                        {/* MOBILE OVERLAPPING ELEMENTS (Z-Index > Card z-30) */}
                        <div className="lg:hidden relative w-full h-24 mt-4 overflow-visible pointer-events-none z-30">
                            {/* Blue Vinyl overlapping bottom left corner */}
                            <div className="absolute -left-12 -bottom-10 pointer-events-auto">
                                <VinylRecord color="blue" size={170} spinSpeed={18} />
                            </div>

                            {/* Soundwave bars radiating behind bottom vinyl */}
                            <div className="absolute left-14 bottom-2 w-32 h-10 opacity-70 pointer-events-none">
                                <SoundWaves mode="bars" />
                            </div>

                            {/* Stacked Cassettes & Vinyls overlapping bottom right corner */}
                            <div className="absolute -right-6 -bottom-10 pointer-events-auto">
                                <FramedMediaStack compact={true} />
                            </div>
                        </div>
                    </div>

                    {/* DESKTOP OVERLAPPING BLUE VINYL RECORD */}
                    {/* Positioned centered on the right edge of the card */}
                    <div className="absolute -z-10 -right-28 lg:-right-36 top-1/2 -translate-y-1/2 opacity-95 hidden lg:block pointer-events-auto">
                        <VinylRecord color="blue" size={340} spinSpeed={20} />
                    </div>
                </div>

                {/* DESKTOP CENTER SOUND WAVES */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-full max-w-3xl opacity-65 pointer-events-none hidden lg:block">
                    <SoundWaves mode="full" />
                </div>

                {/* DESKTOP RIGHT SIDE FRAMED MEDIA DISPLAY */}
                <div className="hidden lg:flex z-10 w-auto justify-end my-auto">
                    <FramedMediaStack compact={false} />
                </div>
            </div>

            {/* Bottom Ambient Soundwave Equalizer Strip */}
            <div className="w-full pb-2 opacity-40 pointer-events-none">
                <SoundWaves mode="bars" />
            </div>
        </main>
    );
}
