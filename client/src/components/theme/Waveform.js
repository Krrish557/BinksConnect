"use client";

import { useMemo } from "react";

export default function Waveform({ className = "", bars = 150 }) {
    const barsData = useMemo(() => {
        return Array.from({ length: bars }, (_, i) => {
            const base =
                0.28 +
                0.72 *
                    Math.abs(
                        0.55 * Math.sin(i * 0.31 + 1.2) +
                            0.45 * Math.sin(i * 0.083 + 4.7) +
                            0.22 * Math.sin(i * 0.019 + 0.6)
                    );
            const height = Math.max(7, Math.min(52, base * 52));
            return {
                x: i * 4 + 0.5,
                delay: -((i * 0.19) % 4.2),
                dur: 4 + (i % 7) * 0.35,
                height,
            };
        });
    }, [bars]);

    return (
        <div
            className={`pointer-events-none select-none ${className}`}
            aria-hidden="true"
            style={{
                filter: "drop-shadow(0 0 8px rgba(184, 154, 91, 0.35))",
            }}
        >
            <svg
                viewBox="0 0 600 60"
                className="w-full h-full"
                preserveAspectRatio="none"
                fill="none"
            >
                {barsData.map((b, i) => (
                    <rect
                        key={i}
                        className="wave-bar"
                        x={b.x}
                        y={30 - b.height / 2}
                        width="1.5"
                        height={b.height}
                        rx="0.75"
                        fill="#B89A5B"
                        opacity={0.75}
                        style={{
                            "--wave-delay": `${b.delay}s`,
                            "--wave-dur": `${b.dur}s`,
                        }}
                    />
                ))}
            </svg>
        </div>
    );
}
