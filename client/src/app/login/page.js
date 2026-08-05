"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";
import AuthLayout from "@/components/AuthLayout";

export default function LoginPage() {
    const router = useRouter();
    const login = useAuthStore((s) => s.login);

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

    const inputClass =
        "w-full px-5 py-4 bg-[#1b272b] text-[#eae2d0] border border-[#5a482c] rounded-lg outline-none focus:border-[#dfb872] focus:ring-2 focus:ring-[#dfb872]/40 transition-all text-base placeholder-[#8b7a5c]";

    return (
        <AuthLayout>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-[#b8aa8f] mb-2 tracking-wide">
                        Username or Email
                    </label>
                    <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="Enter your username or email"
                        autoComplete="username"
                        className={inputClass}
                    />
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-[#b8aa8f] tracking-wide">
                            Password
                        </label>
                        <Link
                            href="/forgot-password"
                            className="text-xs sm:text-sm text-[#c5a059] hover:text-[#f4e2b8] transition hover:underline"
                        >
                            Forgot Password?
                        </Link>
                    </div>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className={inputClass}
                    />
                </div>

                <div className="flex items-center gap-3 pt-1">
                    <input
                        type="checkbox"
                        id="rememberDevice"
                        checked={rememberDevice}
                        onChange={(e) => setRememberDevice(e.target.checked)}
                        className="w-4 h-4 rounded accent-[#c5a059] bg-[#1b272b] border-[#5a482c] cursor-pointer"
                    />
                    <label htmlFor="rememberDevice" className="text-sm text-[#b8aa8f] cursor-pointer select-none">
                        Remember this device
                    </label>
                </div>

                {error && (
                    <p className="text-sm text-red-300 bg-red-950/50 border border-red-500/30 rounded-lg px-4 py-3">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-lg bg-[#233034] text-[#dfb872] font-bold text-base tracking-wide border border-[#7a6237] hover:bg-[#2c3b40] hover:text-[#fff0cf] hover:border-[#caa35e] transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                    {loading ? "Logging in..." : "Log In"}
                </button>
            </form>

            <p className="text-sm text-[#a39478] mt-8 text-center tracking-wide">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-[#dfb872] hover:text-[#fff0cf] hover:underline font-semibold ml-1">
                    Create one.
                </Link>
            </p>
        </AuthLayout>
    );
}
