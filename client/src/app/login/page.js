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
            setError("Enter your username/email and password.");
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
        "w-full px-4 py-3 bg-[#282828] text-white rounded-lg outline-none focus:ring-2 focus:ring-[#1db954] transition text-sm placeholder-[#7a7a7a]";

    return (
        <AuthLayout title="Welcome back" subtitle="Log in with your username or email">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-[#B3B3B3] mb-1.5">
                        Username or email
                    </label>
                    <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="username or you@example.com"
                        autoComplete="username"
                        className={inputClass}
                    />
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium text-[#B3B3B3]">
                            Password
                        </label>
                        <Link
                            href="/forgot-password"
                            className="text-xs text-[#1db954] hover:underline"
                        >
                            Forgot password?
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

                <div className="flex items-center gap-2 pt-1">
                    <input
                        type="checkbox"
                        id="rememberDevice"
                        checked={rememberDevice}
                        onChange={(e) => setRememberDevice(e.target.checked)}
                        className="w-4 h-4 rounded accent-[#1db954] bg-[#282828] border-white/10 cursor-pointer"
                    />
                    <label htmlFor="rememberDevice" className="text-xs text-[#B3B3B3] cursor-pointer select-none">
                        Remember this device & stay logged in
                    </label>
                </div>

                {error && (
                    <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-full bg-[#1db954] text-black font-bold text-sm hover:bg-[#1ed760] transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                    {loading ? "Logging in..." : "Log in"}
                </button>
            </form>

            <p className="text-sm text-[#B3B3B3] mt-6 text-center">
                New to BinksConnect?{" "}
                <Link href="/register" className="text-[#1db954] hover:underline font-medium">
                    Create an account
                </Link>
            </p>
        </AuthLayout>
    );
}
