"use client";

export default function SoundWaves({ className = "", mode = "full" }) {
    // Mode "rings": concentric pulsing soundwave arcs
    // Mode "bars": vertical audio equalizer spectrum bars growing & shrinking
    // Mode "full": combined rings and spectrum bars

    const barHeights = [40, 75, 25, 90, 50, 100, 65, 30, 85, 45, 95, 60, 35, 80, 55, 100, 70, 40, 85, 30, 65, 95, 50, 80];

    return (
        <div className={`pointer-events-none select-none ${className}`}>
            {/* Concentric Pulsing Soundwave Arcs */}
            {(mode === "rings" || mode === "full") && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute rounded-full border border-[#caa35e]/35 animate-wave-pulse"
                            style={{
                                width: `${260 + i * 90}px`,
                                height: `${260 + i * 90}px`,
                                animationDelay: `${i * 0.6}s`,
                                animationDuration: `${2.8 + i * 0.4}s`,
                                boxShadow: i % 2 === 0 ? "0 0 15px rgba(202, 163, 94, 0.15)" : "none",
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Dynamic Equalizer Spectrum Bars (Growing & Shrinking) */}
            {(mode === "bars" || mode === "full") && (
                <div className="flex items-center justify-center gap-1 md:gap-1.5 h-24 px-4">
                    {barHeights.map((h, i) => (
                        <div
                            key={i}
                            className="w-1 md:w-1.5 rounded-full bg-gradient-to-t from-[#8a6b33] via-[#d8b26e] to-[#f9e9c3]"
                            style={{
                                height: `${h}%`,
                                animation: `barEqualize ${1.1 + (i % 5) * 0.3}s ease-in-out infinite alternate`,
                                animationDelay: `${(i * 0.08) % 1.2}s`,
                                opacity: 0.75 + (i % 3) * 0.1,
                                filter: "drop-shadow(0 0 4px rgba(216, 178, 110, 0.4))",
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
