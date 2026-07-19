"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";

export default function LoginPage() {
    const router = useRouter();
    const { login, isAuthenticated } = useAuthStore();
    const [serverUrl, setServerUrl] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isAuthenticated) {
            router.replace("/");
        }
    }, [isAuthenticated, router]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await login(serverUrl, username, password, "navidrome");
            router.push("/");
        } catch (err) {
            setError(err.message || "Connection failed. Check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#121212] flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black text-white mb-2">
                        Binks<span className="text-[#1db954]">Connect</span>
                    </h1>
                    <p className="text-[#B3B3B3]">Connect to your Navidrome server</p>
                </div>

                {error && (
                    <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#B3B3B3] mb-1.5">Server URL</label>
                        <input
                            type="text"
                            value={serverUrl}
                            onChange={(e) => setServerUrl(e.target.value)}
                            placeholder="https://music.example.com"
                            required
                            className="w-full px-4 py-3 bg-[#282828] text-white rounded-lg outline-none focus:ring-2 focus:ring-[#1db954] transition text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#B3B3B3] mb-1.5">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="admin"
                            required
                            className="w-full px-4 py-3 bg-[#282828] text-white rounded-lg outline-none focus:ring-2 focus:ring-[#1db954] transition text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#B3B3B3] mb-1.5">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full px-4 py-3 bg-[#282828] text-white rounded-lg outline-none focus:ring-2 focus:ring-[#1db954] transition text-sm"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#1db954] hover:bg-[#1ed760] disabled:opacity-50 text-black font-bold py-3 rounded-full transition-colors mt-6"
                    >
                        {loading ? "Connecting..." : "Connect"}
                    </button>
                </form>
            </div>
        </div>
    );
}
