"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";
import { apiClient } from "@/services/apiClient";

export default function SettingsPage() {
    const router = useRouter();
    const { user, logout, checkAuth } = useAuthStore();
    const [serverInfo, setServerInfo] = useState(null);
    const [uploadStatus, setUploadStatus] = useState(null);

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

    useEffect(() => {
        if (user?.provider === "telegram") {
            async function loadStatus() {
                try {
                    const data = await apiClient.get("/api/upload/status");
                    setUploadStatus(data);
                } catch {
                    // ignore
                }
            }
            loadStatus();
        }
    }, [user]);

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
                            {serverInfo.serverUrl && (
                                <div className="flex items-center justify-between">
                                    <span className="text-[#B3B3B3] text-sm">Server</span>
                                    <span className="text-white font-medium text-sm truncate max-w-[200px]">
                                        {serverInfo.serverUrl}
                                    </span>
                                </div>
                            )}
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

            {user?.provider === "telegram" && uploadStatus && (
                <section className="mb-8">
                    <h2 className="text-xl font-bold text-white mb-4">Library Stats</h2>
                    <div className="bg-[#181818] rounded-xl p-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-2xl font-bold text-white">{uploadStatus.trackCount || 0}</p>
                                <p className="text-[#B3B3B3] text-sm">Tracks</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{uploadStatus.albumCount || 0}</p>
                                <p className="text-[#B3B3B3] text-sm">Albums</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{uploadStatus.artistCount || 0}</p>
                                <p className="text-[#B3B3B3] text-sm">Artists</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{uploadStatus.mappingCount || 0}</p>
                                <p className="text-[#B3B3B3] text-sm">Files on Telegram</p>
                            </div>
                        </div>
                        {uploadStatus.channels?.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-white/5">
                                <p className="text-[#B3B3B3] text-sm mb-2">Storage Channels</p>
                                {uploadStatus.channels.map((ch) => (
                                    <div key={ch.channel_id} className="flex items-center gap-2 text-sm">
                                        <span className={ch.is_active ? "text-green-400" : "text-red-400"}>●</span>
                                        <span className="text-white">{ch.title || ch.channel_id}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}

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
                    <p>BinksConnect v0.2.0</p>
                    <p className="mt-1">A provider-agnostic personal music server</p>
                </div>
            </section>
        </main>
    );
}
