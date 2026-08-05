"use client";

import VinylRecord from "./theme/VinylRecord";
import SoundWaves from "./theme/SoundWaves";
import FramedMediaStack from "./theme/FramedMediaStack";

export default function AuthLayout({ children }) {
    return (
        <main className="min-h-screen w-full bg-vintage-slate text-[#eae2d0] relative overflow-hidden flex flex-col justify-between selection:bg-[#c5a059] selection:text-black">
            {/* Background Watermark Pattern (Vinyl & Cassette Line Art) */}
            <div className="absolute inset-0 opacity-[0.06] pointer-events-none mix-blend-overlay">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <pattern id="vinylPattern" width="240" height="240" patternUnits="userSpaceOnUse">
                        <circle cx="120" cy="120" r="95" fill="none" stroke="#dfb872" strokeWidth="1.5" />
                        <circle cx="120" cy="120" r="65" fill="none" stroke="#dfb872" strokeWidth="1" />
                        <circle cx="120" cy="120" r="38" fill="none" stroke="#dfb872" strokeWidth="0.8" />
                        <circle cx="120" cy="120" r="16" fill="none" stroke="#dfb872" strokeWidth="1.5" />
                        <rect x="20" y="20" width="55" height="32" rx="3" fill="none" stroke="#dfb872" strokeWidth="1" />
                        <rect x="165" y="175" width="55" height="32" rx="3" fill="none" stroke="#dfb872" strokeWidth="1" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#vinylPattern)" />
                </svg>
            </div>

            {/* Desktop Top Tagline Banner */}
            <div className="hidden lg:block w-full pt-8 pb-2 text-center z-10">
                <h2 className="text-3xl xl:text-4xl font-serif tracking-wider gold-text-gradient drop-shadow-md">
                    Drop the needle and dive back in.
                </h2>
            </div>

            {/* Main Center Grid Layout */}
            <div className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:py-10 flex flex-col lg:flex-row items-center justify-between gap-10">

                {/* LEFT / CENTER: Login Box & Overlapping Rotating Blue Vinyl */}
                <div className="relative w-full max-w-xl mx-auto lg:mx-0 flex flex-col items-center lg:items-start">
                    
                    {/* Mobile Slogan Banner */}
                    <div className="block lg:hidden text-center mb-6">
                        <div className="flex items-center justify-center gap-2.5 mb-2">
                            <div className="flex gap-1.5 items-end h-8">
                                <div className="w-1.5 h-7 bg-[#dfb872] rounded-full animate-pulse" />
                                <div className="w-1.5 h-4 bg-[#dfb872] rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                                <div className="w-1.5 h-8 bg-[#dfb872] rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                                <div className="w-1.5 h-5 bg-[#dfb872] rounded-full animate-pulse" style={{ animationDelay: "0.15s" }} />
                            </div>
                            <h1 className="text-3xl font-bold font-serif tracking-tight gold-text-gradient">
                                BinksConnect
                            </h1>
                        </div>
                        <p className="text-base font-serif italic text-[#dfb872]/90">
                            Drop the needle and dive back in.
                        </p>
                    </div>

                    {/* Main Form Card - Made Bigger & More Spacious */}
                    <div className="relative z-20 w-full bg-[#141f22]/95 backdrop-blur-md rounded-2xl p-8 sm:p-10 md:p-12 gold-double-border shadow-2xl">

                        {/* Card Header (Desktop Logo) */}
                        <div className="hidden lg:flex items-center gap-3.5 mb-8">
                            {/* Equalizer Icon */}
                            <div className="flex gap-1.5 items-end h-9">
                                <div className="w-2 h-8 bg-gradient-to-t from-[#c5a059] to-[#f4e2b8] rounded-full animate-pulse" />
                                <div className="w-2 h-5 bg-gradient-to-t from-[#c5a059] to-[#f4e2b8] rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                                <div className="w-2 h-9 bg-gradient-to-t from-[#c5a059] to-[#f4e2b8] rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                                <div className="w-2 h-6 bg-gradient-to-t from-[#c5a059] to-[#f4e2b8] rounded-full animate-pulse" style={{ animationDelay: "0.15s" }} />
                            </div>
                            <h1 className="text-4xl font-bold font-serif tracking-tight gold-text-gradient">
                                BinksConnect
                            </h1>
                        </div>

                        {/* Child Form Content */}
                        {children}
                    </div>

                    {/* Overlapping Blue Rotating Vinyl Record */}
                    <div className="absolute -z-10 -right-20 lg:-right-36 top-1/2 -translate-y-1/2 opacity-80 sm:opacity-90 hidden sm:block">
                        <VinylRecord color="blue" size={340} spinSpeed={24} />
                    </div>
                </div>

                {/* CENTER BACKGROUND: Slow Gentle Growing & Shrinking Music Waves */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-full max-w-3xl opacity-60 pointer-events-none">
                    <SoundWaves mode="full" />
                </div>

                {/* RIGHT SIDE / MOBILE BACKGROUND ARTIFACT: Single Clustered Aesthetic Card */}
                <div className="lg:relative fixed right-0 bottom-0 lg:bottom-auto lg:right-auto z-0 lg:z-10 opacity-25 lg:opacity-100 scale-75 sm:scale-90 lg:scale-100 origin-bottom-right pointer-events-none lg:pointer-events-auto transition-all">
                    <FramedMediaStack />
                </div>
            </div>

            {/* Bottom Ambient Soundwave Equalizer Strip */}
            <div className="w-full pb-4 opacity-40 pointer-events-none">
                <SoundWaves mode="bars" />
            </div>
        </main>
    );
}
