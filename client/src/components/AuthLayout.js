"use client";

import Image from "next/image";
import VinylRecord from "./theme/VinylRecord";
import SoundWaves from "./theme/SoundWaves";
import FramedMediaStack from "./theme/FramedMediaStack";

export default function AuthLayout({ children }) {
    return (
        <main className="min-h-screen h-screen w-full bg-vintage-slate text-[#eae2d0] relative flex flex-col justify-between items-center selection:bg-[#c5a059] selection:text-[#171B1C] overflow-y-auto lg:overflow-hidden">
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
            <div className="hidden lg:block w-full pt-4 pb-2 text-center z-10 shrink-0">
                <h2 className="text-3xl font-serif tracking-wider gold-text-gradient drop-shadow-md">
                    Drop the needle and dive back in.
                </h2>
            </div>

            {/* Main Center Container */}
            <div className="relative z-10 flex-1 min-h-0 w-full max-w-7xl mx-auto px-4 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-16">

                {/* LEFT: Full-height Login Card & Overlapping Rotating Blue Vinyl */}
                <div className="relative w-full max-w-[380px] lg:max-w-[420px] mx-auto lg:mx-0 lg:self-stretch flex flex-col">

                    {/* Main Form Card Box — full viewport height */}
                    <div className="relative z-10 w-full lg:flex-1 bg-[#141f22]/95 backdrop-blur-md rounded-xl p-7 sm:p-8 lg:p-10 gold-double-border shadow-2xl overflow-hidden flex flex-col min-h-[100vh] lg:min-h-0">
                        {/* Card Header: mobile name+tagline / desktop logo */}
                        <div className="mb-6 lg:mb-10 shrink-0">
                            {/* Mobile Top Header (Android View: Name & Tagline above form) */}
                            <div className="block lg:hidden text-center">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <Image
                                        src="/logo.png"
                                        alt="BinksConnect logo"
                                        width={1024}
                                        height={1024}
                                        className="h-8 w-8 rounded-full object-contain"
                                    />
                                    <h1 className="text-2xl font-bold font-serif tracking-tight gold-text-gradient">
                                        BinksConnect
                                    </h1>
                                </div>
                                <p className="text-sm font-serif italic text-[#dfb872]/90">
                                    Drop the needle and dive back in.
                                </p>
                            </div>

                            {/* Card Header (Desktop Logo inside card) */}
                            <div className="hidden lg:flex items-center gap-3">
                                <Image
                                    src="/logo.png"
                                    alt="BinksConnect logo"
                                    width={1024}
                                    height={1024}
                                    className="h-10 w-10 rounded-full object-contain"
                                />
                                <h1 className="text-3xl font-bold font-serif tracking-tight gold-text-gradient">
                                    BinksConnect
                                </h1>
                            </div>
                        </div>

                        {/* Form Content — centered within the full-height card */}
                        <div className="flex-1 flex flex-col justify-center min-h-0">
                            {children}
                        </div>

                        {/* MOBILE DECORATIVE ELEMENTS — moved to the bottom of the card,
                            below all buttons so they never hover over interactive content */}
                        <div className="lg:hidden relative w-full h-32 mt-8 shrink-0 pointer-events-none z-10">
                            {/* Blue Vinyl overlapping bottom left corner */}
                            <div className="absolute -left-2 bottom-0">
                                <VinylRecord color="blue" size={118} spinSpeed={18} />
                            </div>

                            {/* Soundwave bars */}
                            <div className="absolute left-[118px] bottom-5 w-24 h-8 opacity-60">
                                <SoundWaves mode="bars" />
                            </div>

                            {/* Stacked Cassettes & Vinyls bottom right */}
                            <div className="absolute right-0 bottom-1">
                                <FramedMediaStack compact={true} />
                            </div>
                        </div>
                    </div>

                    {/* DESKTOP OVERLAPPING BLUE VINYL RECORD */}
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

            {/* Bottom Ambient Soundwave Equalizer Strip (desktop only) */}
            <div className="hidden lg:block w-full pb-2 opacity-40 pointer-events-none shrink-0">
                <SoundWaves mode="bars" />
            </div>
        </main>
    );
}
