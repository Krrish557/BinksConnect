"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";
import { usePlayerStore } from "@/store/playerStore";
import usePlaylistStore from "@/store/playlistStore";
import { providerManager } from "@/core/providerManager";

export default function SettingsPage() {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const volume = usePlayerStore((s) => s.volume);
    const setVolume = usePlayerStore((s) => s.setVolume);
    const playlists = usePlaylistStore((s) => s.playlists);
    const router = useRouter();

    const [reconnecting, setReconnecting] = useState(false);

    const handleReconnect = async () => {
        setReconnecting(true);
        try {
            await providerManager.reconnect();
        } catch (err) {
            router.push("/onboarding");
        } finally {
            setReconnecting(false);
        }
    };

    const handleSwitchProvider = () => {
        logout();
        router.push("/onboarding");
    };

    const session = providerManager.getSession();

    return (
        <main className="px-6 pt-8 pb-10 max-w-2xl">
            <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

            {/* PROVIDER */}
            <section className="mb-8">
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#B3B3B3] mb-4">
                    Provider
                </h2>
                <div className="bg-[#181818] rounded-xl p-5 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-[#B3B3B3]">Connected to</span>
                        <span className="text-sm text-white font-medium flex items-center gap-2">
                            <span>🎵</span>
                            {session?.displayName || session?.providerId || "—"}
                        </span>
                    </div>
                    <div className="flex justify-between items-center border-t border-white/5 pt-3">
                        <span className="text-sm text-[#B3B3B3]">Server</span>
                        <span className="text-sm text-white font-medium truncate max-w-xs">
                            {user?.serverUrl || "—"}
                        </span>
                    </div>
                    <div className="flex justify-between items-center border-t border-white/5 pt-3">
                        <span className="text-sm text-[#B3B3B3]">Username</span>
                        <span className="text-sm text-white font-medium">
                            {user?.username || "—"}
                        </span>
                    </div>
                    <div className="flex gap-2 border-t border-white/5 pt-3">
                        <button
                            onClick={handleReconnect}
                            disabled={reconnecting}
                            className="flex-1 text-center text-sm font-semibold text-[#1db954] hover:text-[#1ed760] py-2 rounded-lg hover:bg-[#282828] transition-colors disabled:opacity-50"
                        >
                            {reconnecting ? "Reconnecting..." : "Reconnect"}
                        </button>
                        <button
                            onClick={handleSwitchProvider}
                            className="flex-1 text-center text-sm font-semibold text-[#B3B3B3] hover:text-white py-2 rounded-lg hover:bg-[#282828] transition-colors"
                        >
                            Switch provider
                        </button>
                    </div>
                </div>
            </section>

            {/* PLAYBACK */}
            <section className="mb-8">
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#B3B3B3] mb-4">
                    Playback
                </h2>
                <div className="bg-[#181818] rounded-xl p-5">
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-white">Default volume</span>
                        <div className="flex items-center gap-3 flex-1 max-w-xs">
                            <span className="text-sm text-[#B3B3B3]">🔉</span>
                            <div className="relative flex-1 h-1">
                                <div className="w-full h-1 bg-[#383838] rounded-full">
                                    <div
                                        className="h-1 bg-[#1db954] rounded-full"
                                        style={{ width: `${volume * 100}%` }}
                                    />
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={volume}
                                    onChange={(e) => setVolume(Number(e.target.value))}
                                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                                />
                            </div>
                            <span className="text-sm text-[#B3B3B3] w-8 text-right">
                                {Math.round(volume * 100)}%
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* PLAYLISTS */}
            <section className="mb-8">
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#B3B3B3] mb-4">
                    Playlists
                </h2>
                <div className="bg-[#181818] rounded-xl p-5">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-[#B3B3B3]">
                            Saved playlists
                        </span>
                        <span className="text-sm text-white font-medium">
                            {playlists.length}
                        </span>
                    </div>
                </div>
            </section>

            {/* ACCOUNT */}
            <section className="mb-8">
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#B3B3B3] mb-4">
                    Account
                </h2>
                <div className="bg-[#181818] rounded-xl p-5">
                    <button
                        onClick={() => {
                            logout();
                            router.push("/onboarding");
                        }}
                        className="w-full text-center text-sm font-semibold text-red-400 hover:text-red-300 py-2 rounded-lg hover:bg-[#282828] transition-colors"
                    >
                        Log out
                    </button>
                </div>
            </section>

            {/* ABOUT */}
            <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#B3B3B3] mb-4">
                    About
                </h2>
                <div className="bg-[#181818] rounded-xl p-5 space-y-3">
                    <div className="flex justify-between">
                        <span className="text-sm text-[#B3B3B3]">App</span>
                        <span className="text-sm text-white">BinksConnect</span>
                    </div>
                    <div className="flex justify-between border-t border-white/5 pt-3">
                        <span className="text-sm text-[#B3B3B3]">Version</span>
                        <span className="text-sm text-white">1.0.0</span>
                    </div>
                    <div className="flex justify-between border-t border-white/5 pt-3">
                        <span className="text-sm text-[#B3B3B3]">Provider</span>
                        <span className="text-sm text-white">
                            {session?.displayName || user?.provider || "—"}
                        </span>
                    </div>
                </div>
            </section>
        </main>
    );
}
