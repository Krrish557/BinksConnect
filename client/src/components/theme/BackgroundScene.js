"use client";

import { motion } from "framer-motion";

function VinylSilhouette({ size }) {
    return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
            <circle cx="50" cy="50" r="48" stroke="#D8C8A0" strokeWidth="0.8" />
            {Array.from({ length: 8 }).map((_, i) => (
                <circle key={i} cx="50" cy="50" r={14 + i * 4.5} stroke="#D8C8A0" strokeWidth="0.4" />
            ))}
            <circle cx="50" cy="50" r="11" stroke="#B89A5B" strokeWidth="0.8" />
            <circle cx="50" cy="50" r="3" fill="#D8C8A0" />
        </svg>
    );
}

function CassetteSilhouette({ size }) {
    return (
        <svg width={size * 1.9} height={size} viewBox="0 0 190 100" fill="none" aria-hidden="true">
            <rect x="4" y="10" width="182" height="80" rx="8" stroke="#D8C8A0" strokeWidth="1" />
            <rect x="20" y="26" width="150" height="26" rx="2" stroke="#D8C8A0" strokeWidth="0.6" />
            <circle cx="62" cy="55" r="10" stroke="#D8C8A0" strokeWidth="0.7" />
            <circle cx="128" cy="55" r="10" stroke="#D8C8A0" strokeWidth="0.7" />
            <circle cx="62" cy="55" r="3.5" fill="#D8C8A0" />
            <circle cx="128" cy="55" r="3.5" fill="#D8C8A0" />
            <path d="M22 84l10-12M168 84l-10-12" stroke="#D8C8A0" strokeWidth="0.6" />
        </svg>
    );
}

function ReelSilhouette({ size }) {
    return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
            <circle cx="50" cy="50" r="46" stroke="#D8C8A0" strokeWidth="0.9" />
            <circle cx="50" cy="50" r="24" stroke="#D8C8A0" strokeWidth="0.6" />
            {Array.from({ length: 12 }).map((_, i) => {
                const a = (i / 12) * Math.PI * 2;
                return (
                    <line
                        key={i}
                        x1={50 + Math.cos(a) * 24}
                        y1={50 + Math.sin(a) * 24}
                        x2={50 + Math.cos(a) * 44}
                        y2={50 + Math.sin(a) * 44}
                        stroke="#D8C8A0"
                        strokeWidth="0.7"
                    />
                );
            })}
            <circle cx="50" cy="50" r="8" stroke="#B89A5B" strokeWidth="0.8" />
            <circle cx="50" cy="50" r="2.5" fill="#D8C8A0" />
        </svg>
    );
}

const SCATTER = [
    { type: "vinyl", x: "6%", y: "18%", s: 150, r: 24, o: 0.16, blur: 10 },
    { type: "reel", x: "42%", y: "8%", s: 120, r: -18, o: 0.14, blur: 12 },
    { type: "cassette", x: "74%", y: "22%", s: 110, r: 14, o: 0.15, blur: 9 },
    { type: "vinyl", x: "88%", y: "8%", s: 130, r: -30, o: 0.12, blur: 11 },
    { type: "cassette", x: "12%", y: "52%", s: 100, r: -12, o: 0.13, blur: 8 },
    { type: "vinyl", x: "33%", y: "40%", s: 170, r: 8, o: 0.1, blur: 14 },
    { type: "reel", x: "60%", y: "38%", s: 140, r: 26, o: 0.13, blur: 11 },
    { type: "vinyl", x: "82%", y: "58%", s: 120, r: -22, o: 0.12, blur: 10 },
    { type: "cassette", x: "95%", y: "78%", s: 105, r: 20, o: 0.14, blur: 9 },
    { type: "vinyl", x: "20%", y: "78%", s: 140, r: -15, o: 0.13, blur: 12 },
    { type: "reel", x: "48%", y: "86%", s: 130, r: 10, o: 0.1, blur: 13 },
    { type: "cassette", x: "66%", y: "92%", s: 90, r: -26, o: 0.12, blur: 8 },
    { type: "vinyl", x: "3%", y: "96%", s: 110, r: 34, o: 0.15, blur: 9 },
    { type: "vinyl", x: "56%", y: "60%", s: 160, r: 18, o: 0.09, blur: 15 },
    { type: "cassette", x: "90%", y: "42%", s: 95, r: -8, o: 0.13, blur: 10 },
    { type: "vinyl", x: "70%", y: "72%", s: 100, r: 40, o: 0.11, blur: 11 },
    { type: "reel", x: "26%", y: "22%", s: 100, r: -34, o: 0.12, blur: 10 },
    { type: "cassette", x: "36%", y: "66%", s: 110, r: 30, o: 0.1, blur: 12 },
];

const DUST = [
    { x: "14%", y: "24%", s: 2, d: "0s" },
    { x: "28%", y: "12%", s: 1.5, d: "-4s" },
    { x: "46%", y: "30%", s: 2.5, d: "-9s" },
    { x: "63%", y: "16%", s: 1.5, d: "-2s" },
    { x: "78%", y: "34%", s: 2, d: "-6s" },
    { x: "92%", y: "20%", s: 1.5, d: "-12s" },
    { x: "18%", y: "62%", s: 2, d: "-7s" },
    { x: "38%", y: "80%", s: 1.5, d: "-1s" },
    { x: "57%", y: "68%", s: 2.5, d: "-10s" },
    { x: "73%", y: "84%", s: 1.5, d: "-3s" },
    { x: "87%", y: "66%", s: 2, d: "-14s" },
    { x: "6%", y: "40%", s: 1.5, d: "-5s" },
];

function ScatterItem({ item }) {
    const { type, x, y, s, r, o, blur } = item;
    return (
        <div
            className="absolute"
            style={{
                left: x,
                top: y,
                transform: `translate(-50%, -50%) rotate(${r}deg)`,
                opacity: o,
                filter: `blur(${blur}px)`,
            }}
        >
            {type === "vinyl" && <VinylSilhouette size={s} />}
            {type === "cassette" && <CassetteSilhouette size={s} />}
            {type === "reel" && <ReelSilhouette size={s} />}
        </div>
    );
}

export default function BackgroundScene({ bgX, bgY }) {
    return (
        <motion.div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ x: bgX, y: bgY, willChange: "transform" }}
            aria-hidden="true"
        >
            {/* Layer 1: dark paper */}
            <div className="premium-bg-paper absolute inset-0" />

            {/* Layer 2: grain */}
            <div className="noise-layer absolute inset-0 opacity-[0.045] mix-blend-overlay" />

            {/* Layer 5: scratches */}
            <div className="scratch-layer absolute inset-0 opacity-[0.4]" />

            {/* Very background: blurred scattered media */}
            {SCATTER.map((item, i) => (
                <ScatterItem key={i} item={item} />
            ))}

            {/* Layer 4: dust particles */}
            {DUST.map((p, i) => (
                <span
                    key={i}
                    className="dust-particle"
                    style={{
                        left: p.x,
                        top: p.y,
                        width: p.s,
                        height: p.s,
                        animationDelay: p.d,
                    }}
                />
            ))}

            {/* Layer 3: soft light from top-left */}
            <div className="light-sweep absolute inset-0" />

            {/* Vignette */}
            <div className="vignette absolute inset-0" />
        </motion.div>
    );
}
