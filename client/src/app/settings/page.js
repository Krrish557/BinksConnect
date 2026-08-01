"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";

export default function SettingsPage() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [navUrl, setNavUrl] = useState("");
    const [loggingOut, setLoggingOut] = useState(false);

    const handleNavidromeLogin = () => {
        const url = navUrl.trim() || "http://localhost:4533";
        window.open(url, "_blank", "noopener,noreferrer");
    };

    const handleLogout = async () => {
        setLoggingOut(true);
        await logout();
        router.replace("/login");
    };

    return (
        <main className="px-6 pt-8 pb-10 max-w-2xl">
            <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

            <section className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4">Account</h2>
                <div className="bg-[#181818] rounded-xl p-5 space-y-3">
                    <div>
                        <p className="text-xs text-[#B3B3B3]">Username</p>
                        <p className="text-white font-medium">{user?.username || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs text-[#B3B3B3]">Email</p>
                        <p className="text-white font-medium">{user?.email || "—"}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="w-full text-left px-5 py-4 bg-[#181818] hover:bg-[#282828] rounded-xl transition-colors text-red-400 hover:text-red-300 flex items-center justify-between border border-white/5"
                    >
                        <span>{loggingOut ? "Logging out..." : "Log out"}</span>
                        <span className="text-sm">↩</span>
                    </button>
                </div>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4">Navidrome</h2>
                <div className="bg-[#181818] rounded-xl p-5 space-y-4">
                    <p className="text-sm text-[#B3B3B3]">
                        Enter your Navidrome server URL to open its login page.
                    </p>
                    <input
                        type="text"
                        value={navUrl}
                        onChange={(e) => setNavUrl(e.target.value)}
                        placeholder="http://localhost:4533"
                        className="w-full px-4 py-3 bg-[#282828] text-white rounded-lg outline-none focus:ring-2 focus:ring-[#1db954] transition text-sm"
                    />
                    <button
                        onClick={handleNavidromeLogin}
                        className="w-full text-left px-5 py-4 bg-[#181818] hover:bg-[#282828] rounded-xl transition-colors text-[#B3B3B3] hover:text-[#1db954] flex items-center justify-between"
                    >
                        <span>Open Navidrome login page</span>
                        <span className="text-sm">↗</span>
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
