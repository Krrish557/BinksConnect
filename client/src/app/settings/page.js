"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";
import { apiClient } from "@/services/apiClient";

export default function SettingsPage() {
    const router = useRouter();
    const { user, logout, checkAuth } = useAuthStore();
    const [serverInfo, setServerInfo] = useState(null);

    useEffect(() => {
        async function load() {
            try {
                const data = await apiClient.get("/api/auth/me");
                setServerInfo(data);
            } catch {
                // Not authenticated
            }
        }
        load();
    }, []);

    const handleLogout = async () => {
        await logout();
        router.push("/onboarding");
    };

    return (
        <main className="px-6 pt-8 pb-10 max-w-2xl">
            <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

            <section className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4">Provider</h2>
                <div className="bg-[#181818] rounded-xl p-5">
                    {serverInfo ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[#B3B3B3] text-sm">Provider</span>
                                <span className="text-white font-medium capitalize">
                                    {serverInfo.providerId}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[#B3B3B3] text-sm">Server</span>
                                <span className="text-white font-medium text-sm truncate max-w-[200px]">
                                    {serverInfo.serverUrl}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[#B3B3B3] text-sm">Username</span>
                                <span className="text-white font-medium">
                                    {serverInfo.username}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-[#B3B3B3] text-sm">Not connected</p>
                    )}
                </div>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4">Account</h2>
                <div className="space-y-3">
                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-5 py-4 bg-[#181818] hover:bg-[#282828] rounded-xl transition-colors text-[#B3B3B3] hover:text-white"
                    >
                        Switch provider
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-5 py-4 bg-[#181818] hover:bg-red-900/30 rounded-xl transition-colors text-[#B3B3B3] hover:text-red-400"
                    >
                        Log out
                    </button>
                </div>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">About</h2>
                <div className="bg-[#181818] rounded-xl p-5 text-sm text-[#B3B3B3]">
                    <p>BinksConnect v0.1.0</p>
                    <p className="mt-1">A personal music ecosystem</p>
                </div>
            </section>
        </main>
    );
}
