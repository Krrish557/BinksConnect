"use client";

import VinylRecord from "./theme/VinylRecord";
import SoundWaves from "./theme/SoundWaves";
import FramedMediaStack from "./theme/FramedMediaStack";

export default function AuthLayout({ children }) {
    return (
        <main className="min-h-screen w-full bg-vintage-slate text-[#eae2d0] relative overflow-hidden flex flex-col justify-between selection:bg-[#c5a059] selection:text-black">
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
            <div className="hidden lg:block w-full pt-8 text-center z-10">
                <h2 className="text-2xl xl:text-3xl font-serif tracking-wide gold-text-gradient drop-shadow-md">
                    Drop the needle and dive back in.
                </h2>
            </div>

            {/* Main Center Grid Layout */}
            <div className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:py-10 flex flex-col lg:flex-row items-center justify-between gap-8">

                {/* LEFT / MOBILE CENTER: Login Box & Overlapping Rotating Blue Vinyl */}
                <div className="relative w-full max-w-md mx-auto lg:mx-0 flex flex-col items-center lg:items-start">
                    
                    {/* Mobile Slogan Banner */}
                    <div className="block lg:hidden text-center mb-6">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <div className="flex gap-1 items-end h-7">
                                <div className="w-1.5 h-6 bg-[#dfb872] rounded-full animate-pulse" />
                                <div className="w-1.5 h-4 bg-[#dfb872] rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                                <div className="w-1.5 h-7 bg-[#dfb872] rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                                <div className="w-1.5 h-5 bg-[#dfb872] rounded-full animate-pulse" style={{ animationDelay: "0.1s" }} />
                            </div>
                            <h1 className="text-2xl font-bold font-serif tracking-tight gold-text-gradient">
                                BinksConnect
                            </h1>
                        </div>
                        <p className="text-base font-serif italic text-[#dfb872]/90">
                            Drop the needle and dive back in.
                        </p>
                    </div>

                    {/* Main Form Card */}
                    <div className="relative z-20 w-full bg-[#141f22]/95 backdrop-blur-md rounded-xl p-6 md:p-8 gold-double-border">

                        {/* Card Header (Desktop Logo) */}
                        <div className="hidden lg:flex items-center gap-3 mb-8">
                            {/* Equalizer Icon */}
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

                        {/* Child Form Content */}
                        {children}
                    </div>

                    {/* Overlapping Blue Rotating Vinyl Record (Positioned behind/next to card) */}
                    <div className="absolute -z-10 -right-24 lg:-right-36 top-1/2 -translate-y-1/2 opacity-90 hidden sm:block">
                        <VinylRecord color="blue" size={320} spinSpeed={18} />
                    </div>
                </div>

                {/* CENTER BACKGROUND: Growing & Shrinking Music Waves */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-full max-w-2xl opacity-75 pointer-events-none">
                    <SoundWaves mode="full" />
                </div>

                {/* RIGHT SIDE: Desktop Framed Wall Display / Mobile Bottom Stack */}
                <div className="relative z-10 w-full lg:w-auto flex justify-center lg:justify-end">
                    <FramedMediaStack />
                </div>
            </div>

            {/* Bottom Ambient Soundwave Equalizer Strip */}
            <div className="w-full pb-4 opacity-50 pointer-events-none">
                <SoundWaves mode="bars" />
            </div>
        </main>
    );
}
