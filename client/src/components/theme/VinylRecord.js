"use client";

import { useState } from "react";

export default function VinylRecord({
    color = "blue",
    size = 400,
    spinSpeed = 18,
    isInteractive = true,
    className = "",
    style = {},
}) {
    const [isHovered, setIsHovered] = useState(false);

    // Dynamic metallic vinyl tones based on color variant
    const vinylGradients = {
        blue: {
            outer: "radial-gradient(circle at 35% 35%, #24465e 0%, #152d3e 30%, #0d1e2b 65%, #08121a 100%)",
            sheen: "conic-gradient(from 45deg at 50% 50%, rgba(255,255,255,0.18) 0deg, transparent 40deg, transparent 140deg, rgba(255,255,255,0.22) 180deg, transparent 220deg, transparent 320deg, rgba(255,255,255,0.18) 360deg)",
            label: "radial-gradient(circle at 35% 35%, #f6e3b2 0%, #d8b26e 45%, #9b7738 85%, #694e1e 100%)",
            labelText: "#4a3611",
        },
        gold: {
            outer: "radial-gradient(circle at 35% 35%, #e6ca82 0%, #b89547 35%, #7a5d23 70%, #443210 100%)",
            sheen: "conic-gradient(from 45deg at 50% 50%, rgba(255,255,255,0.25) 0deg, transparent 45deg, transparent 135deg, rgba(255,255,255,0.3) 180deg, transparent 225deg, transparent 315deg, rgba(255,255,255,0.25) 360deg)",
            label: "radial-gradient(circle at 35% 35%, #fff5db 0%, #edd392 50%, #af883e 100%)",
            labelText: "#543c11",
        },
        silver: {
            outer: "radial-gradient(circle at 35% 35%, #a8b2b9 0%, #647078 35%, #3d464d 70%, #1e2429 100%)",
            sheen: "conic-gradient(from 45deg at 50% 50%, rgba(255,255,255,0.25) 0deg, transparent 40deg, transparent 140deg, rgba(255,255,255,0.35) 180deg, transparent 220deg, transparent 320deg, rgba(255,255,255,0.25) 360deg)",
            label: "radial-gradient(circle at 35% 35%, #f4e8c1 0%, #cbb06d 60%, #876d33 100%)",
            labelText: "#3d3012",
        },
    };

    const scheme = vinylGradients[color] || vinylGradients.blue;
    const currentSpeed = isHovered ? Math.max(4, spinSpeed * 0.4) : spinSpeed;

    return (
        <div
            className={`relative select-none pointer-events-auto transition-transform duration-500 ease-out ${className}`}
            style={{
                width: size,
                height: size,
                filter: "drop-shadow(0 15px 30px rgba(0, 0, 0, 0.65))",
                transform: isHovered && isInteractive ? "scale(1.04)" : "scale(1)",
                ...style,
            }}
            onMouseEnter={() => isInteractive && setIsHovered(true)}
            onMouseLeave={() => isInteractive && setIsHovered(false)}
        >
            {/* Spinning Disc Container */}
            <div
                className="w-full h-full rounded-full relative overflow-hidden flex items-center justify-center"
                style={{
                    background: scheme.outer,
                    animation: `spinVinyl ${currentSpeed}s linear infinite`,
                    boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.1), inset 0 0 40px rgba(0,0,0,0.8)",
                }}
            >
                {/* Metallic Sheen Overlay */}
                <div
                    className="absolute inset-0 rounded-full mix-blend-screen pointer-events-none opacity-80"
                    style={{ background: scheme.sheen }}
                />

                {/* Micro Grooves SVG Pattern */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" viewBox="0 0 400 400">
                    {Array.from({ length: 18 }).map((_, i) => (
                        <circle
                            key={i}
                            cx="200"
                            cy="200"
                            r={45 + i * 8.5}
                            fill="none"
                            stroke="rgba(255,255,255,0.15)"
                            strokeWidth={i % 3 === 0 ? "1.2" : "0.5"}
                        />
                    ))}
                    <circle cx="200" cy="200" r="192" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                    <circle cx="200" cy="200" r="42" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" />
                </svg>

                {/* Center Gold Label */}
                <div
                    className="relative rounded-full flex flex-col items-center justify-center border-2 border-[#caa35e]/60 shadow-inner"
                    style={{
                        width: size * 0.32,
                        height: size * 0.32,
                        background: scheme.label,
                        boxShadow: "0 0 12px rgba(0,0,0,0.4), inset 0 0 8px rgba(255,255,255,0.4)",
                    }}
                >
                    {/* Concentric Label Rings */}
                    <div className="absolute inset-1.5 rounded-full border border-[#4a3611]/20 pointer-events-none" />
                    <div className="absolute inset-3 rounded-full border border-[#4a3611]/15 pointer-events-none" />

                    {/* Subtle Label Text */}
                    <span
                        className="text-[9px] font-extrabold tracking-widest uppercase mb-0.5"
                        style={{ color: scheme.labelText, fontFamily: "serif" }}
                    >
                        BINKS
                    </span>
                    <span
                        className="text-[6px] tracking-wider uppercase font-semibold opacity-80"
                        style={{ color: scheme.labelText }}
                    >
                        33 1/3 RPM
                    </span>

                    {/* Spindle Hole */}
                    <div className="w-3.5 h-3.5 bg-[#0b1214] rounded-full border border-black/40 shadow-inner mt-1 relative">
                        <div className="absolute inset-0.5 bg-black/60 rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}
