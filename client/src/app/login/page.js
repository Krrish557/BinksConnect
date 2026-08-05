"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
    motion,
    useMotionValue,
    useReducedMotion,
    useSpring,
    useTransform,
} from "framer-motion";
import useAuthStore from "@/store/authStore";
import VinylRecord from "@/components/theme/VinylRecord";
import Waveform from "@/components/theme/Waveform";
import BackgroundScene from "@/components/theme/BackgroundScene";

const AudioAmbience = dynamic(() => import("@/components/theme/AudioAmbience"), { ssr: false });
const VintageCollage = dynamic(() => import("@/components/theme/VintageCollage"), {
    ssr: false,
    loading: () => null,
});

const EASE = [0.22, 1, 0.36, 1];

export default function LoginPage() {
    const router = useRouter();
    const login = useAuthStore((s) => s.login);
    const reduced = useReducedMotion();

    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [rememberDevice, setRememberDevice] = useState(true);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!identifier.trim() || !password) {
            setError("Enter your username or email and password.");
            return;
        }
        setLoading(true);
        try {
            await login(identifier.trim(), password, rememberDevice);
            router.replace("/");
        } catch (err) {
            setError(err.message || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ── Mouse parallax (GPU transforms) ─────────────────────
    const mx = useMotionValue(0);
    const my = useMotionValue(0);
    const sx = useSpring(mx, { stiffness: 45, damping: 18, mass: 0.8 });
    const sy = useSpring(my, { stiffness: 45, damping: 18, mass: 0.8 });

    const k = reduced ? 0 : 1;
    const bgX = useTransform(sx, (v) => v * 0.2 * k); // ~2px
    const bgY = useTransform(sy, (v) => v * 0.2 * k);
    const vinylX = useTransform(sx, (v) => v * 0.1 * k); // ~1px
    const vinylY = useTransform(sy, (v) => v * 0.1 * k);
    const waveX = useTransform(sx, (v) => v * 0.3 * k);
    const waveY = useTransform(sy, (v) => v * 0.3 * k);
    const collageX = useTransform(sx, (v) => v * 0.4 * k); // ~4px
    const collageY = useTransform(sy, (v) => v * 0.4 * k);

    const handleMouseMove = useCallback((e) => {
        if (e.pointerType === "touch") return;
        mx.set((e.clientX / window.innerWidth - 0.5) * 20);
        my.set((e.clientY / window.innerHeight - 0.5) * 20);
    }, [mx, my]);

    const cardEnter = reduced ? {} : { initial: { opacity: 0, y: 26 }, animate: { opacity: 1, y: 0 } };
    const heroEnter = () =>
        reduced ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 } };

    return (
        <main
            className="premium-login relative h-screen w-full overflow-x-hidden overflow-y-auto lg:overflow-hidden text-[#eae2d0]"
            onMouseMove={handleMouseMove}
        >
            {/* Ambient background */}
            <BackgroundScene bgX={bgX} bgY={bgY} />

            {/* Two-panel layout */}
            <div className="relative z-10 grid h-full min-h-[520px] grid-cols-12">
                {/* ── LEFT: Login card (30%) ─────────────────────── */}
                <section className="relative z-20 col-span-12 lg:col-span-4 flex items-stretch justify-center lg:justify-start lg:pl-[clamp(28px,4vw,80px)]">
                    <motion.aside
                        className="login-card w-full max-w-[400px] lg:h-full min-h-[100vh] lg:min-h-0 p-8 sm:p-10 flex flex-col"
                        {...cardEnter}
                        transition={{ duration: 0.9, ease: EASE, delay: 0.05 }}
                    >
                        {/* Logo */}
                        <header className="flex items-center gap-3 mb-8 lg:mb-10 shrink-0">
                            <Image
                                src="/logo.png"
                                alt="BinksConnect logo"
                                width={1024}
                                height={1024}
                                priority
                                className="h-10 w-10 rounded-full object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                            />
                            <h1 className="text-2xl sm:text-[1.7rem] font-bold tracking-tight gold-text-gradient">
                                BinksConnect
                            </h1>
                        </header>

                        {/* Form (vertically centered in the full-height card) */}
                        <div className="flex-1 flex flex-col justify-center py-4 min-h-0">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label htmlFor="login-identifier" className="sr-only">
                                        Username or Email
                                    </label>
                                    <input
                                        id="login-identifier"
                                        type="text"
                                        className="vintage-input"
                                        placeholder="Username or Email"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        autoComplete="username"
                                        aria-required="true"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="login-password" className="sr-only">
                                        Password
                                    </label>
                                    <input
                                        id="login-password"
                                        type="password"
                                        className="vintage-input"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete="current-password"
                                        aria-required="true"
                                    />
                                    <div className="flex justify-end mt-2">
                                        <Link href="/forgot-password" className="gold-link text-xs tracking-wide">
                                            Forgot Password?
                                        </Link>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2.5 pt-1">
                                    <input
                                        type="checkbox"
                                        id="rememberDevice"
                                        className="vintage-check"
                                        checked={rememberDevice}
                                        onChange={(e) => setRememberDevice(e.target.checked)}
                                    />
                                    <label
                                        htmlFor="rememberDevice"
                                        className="text-xs text-[var(--v-beige-muted)] cursor-pointer select-none tracking-wide"
                                    >
                                        Remember this device
                                    </label>
                                </div>

                                {error && (
                                    <p
                                        role="alert"
                                        className="text-xs text-[#e0a489] bg-[#3a2220]/60 border border-[#8a4b3c]/40 rounded-md px-3.5 py-2.5"
                                    >
                                        {error}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    className="vintage-btn text-sm"
                                    disabled={loading}
                                >
                                    {loading ? "Logging in…" : "Log In"}
                                </button>
                            </form>

                            <p className="text-xs mt-8 text-center text-[var(--v-beige-muted)] tracking-wide">
                                Don&apos;t have an account?{" "}
                                <Link
                                    href="/register"
                                    className="gold-link gold-link-strong font-semibold"
                                >
                                    Create one.
                                </Link>
                            </p>
                        </div>

                        {/* Mobile decorative strip (kept below the form, never over buttons) */}
                        <div className="relative h-32 mt-6 lg:hidden shrink-0 pointer-events-none select-none">
                            <div className="absolute left-1 -bottom-1 opacity-90">
                                <VinylRecord color="blue" size={118} spinSpeed={20} isInteractive={false} />
                            </div>
                            <div className="absolute left-[118px] bottom-4 w-32 h-10 opacity-60">
                                <Waveform className="w-full h-full" />
                            </div>
                            <div className="absolute right-0 bottom-2 opacity-80">
                                <VinylRecord color="gold" size={64} spinSpeed={16} isInteractive={false} />
                            </div>
                        </div>
                    </motion.aside>
                </section>

                {/* ── RIGHT: Hero (70%) ─────────────────────────── */}
                <section className="relative z-10 col-span-8 hidden lg:block">
                    {/* Headline */}
                    <motion.h2
                        className="absolute top-[9vh] left-0 right-0 text-center font-light tracking-[0.35em] text-2xl xl:text-[2.1rem] text-[var(--v-gold)]"
                        {...heroEnter()}
                        transition={{ duration: 1, ease: EASE, delay: 0.25 }}
                        style={{ textShadow: "0 2px 18px rgba(184, 154, 91, 0.25)" }}
                    >
                        Drop the needle and dive back in.
                    </motion.h2>

                    {/* Main vinyl record (tucks ~40% behind the card) */}
                    <div className="absolute top-1/2 -translate-y-1/2" style={{ left: "-128px" }}>
                        <motion.div
                            style={{ x: vinylX, y: vinylY, willChange: "transform" }}
                            {...heroEnter()}
                            transition={{ duration: 1.1, ease: EASE, delay: 0.5 }}
                        >
                            <VinylRecord color="blue" size={320} spinSpeed={20} isInteractive={false} />
                        </motion.div>
                    </div>

                    {/* Horizontal waveform to the right of the vinyl */}
                    <div
                        className="absolute top-1/2 -translate-y-1/2"
                        style={{ left: "260px", width: "min(22vw, 340px)" }}
                    >
                        <motion.div
                            style={{ x: waveX, y: waveY, willChange: "transform" }}
                            {...heroEnter()}
                            transition={{ duration: 1, ease: EASE, delay: 0.8 }}
                        >
                            <Waveform className="w-full h-[76px]" />
                        </motion.div>
                    </div>

                    {/* Right-side floating framed collage */}
                    <div className="absolute top-1/2 -translate-y-1/2" style={{ right: "2.5vw" }}>
                        <motion.div
                            style={{ x: collageX, y: collageY, willChange: "transform" }}
                            {...heroEnter()}
                            transition={{ duration: 1, ease: EASE, delay: 1.05 }}
                        >
                            <VintageCollage />
                        </motion.div>
                    </div>
                </section>
            </div>

            {/* Ambient audio + mute toggle */}
            <AudioAmbience />
        </main>
    );
}
