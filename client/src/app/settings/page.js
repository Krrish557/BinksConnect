"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";

export default function SettingsPage() {
    const router = useRouter();
    const { user, logout, devices, loadingDevices, fetchDevices, revokeDevice, revokeOtherDevices } = useAuthStore();
    const [navUrl, setNavUrl] = useState("");
    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        fetchDevices();
    }, []);

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

            {/* ACCOUNT SECTION */}
            <section className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4">Account</h2>
                <div className="bg-[#181818] rounded-xl p-5 space-y-3 border border-white/5">
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
                        className="w-full text-left px-5 py-4 bg-[#202020] hover:bg-[#282828] rounded-xl transition-colors text-red-400 hover:text-red-300 flex items-center justify-between border border-white/5 cursor-pointer"
                    >
                        <span>{loggingOut ? "Logging out..." : "Log out"}</span>
                        <span className="text-sm">↩</span>
                    </button>
                </div>
            </section>

            {/* REMEMBERED DEVICES & ACTIVE SESSIONS SECTION */}
            <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-white">Remembered Devices & Sessions</h2>
                        <p className="text-xs text-[#B3B3B3] mt-0.5">Manage devices authorized to access your account</p>
                    </div>
                    {devices.length > 1 && (
                        <button
                            onClick={revokeOtherDevices}
                            className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg transition font-medium cursor-pointer"
                        >
                            Log Out All Other Devices
                        </button>
                    )}
                </div>

                <div className="bg-[#181818] rounded-xl p-5 space-y-3 border border-white/5">
                    {loadingDevices ? (
                        <p className="text-sm text-[#B3B3B3]">Loading devices...</p>
                    ) : devices.length === 0 ? (
                        <p className="text-sm text-[#B3B3B3]">No active sessions found.</p>
                    ) : (
                        <div className="space-y-3">
                            {devices.map((device) => (
                                <div
                                    key={device.sessionId}
                                    className="flex items-center justify-between p-3.5 bg-[#222222] rounded-lg border border-white/5"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">
                                            {device.deviceName?.toLowerCase().includes("mobile") || device.deviceName?.toLowerCase().includes("ios") || device.deviceName?.toLowerCase().includes("android") ? "📱" : "💻"}
                                        </span>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-white">
                                                    {device.deviceName || "Recognized Device"}
                                                </p>
                                                {device.isCurrent && (
                                                    <span className="text-[10px] bg-[#1db954]/20 text-[#1db954] border border-[#1db954]/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                        Current Device
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-[#B3B3B3] mt-0.5">
                                                {device.ipAddress ? `IP: ${device.ipAddress} • ` : ""}
                                                Last active: {device.lastActive ? new Date(device.lastActive).toLocaleString() : "Recently"}
                                            </p>
                                        </div>
                                    </div>

                                    {!device.isCurrent && (
                                        <button
                                            onClick={() => revokeDevice(device.sessionId)}
                                            className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-1.5 rounded-md transition font-medium border border-transparent hover:border-red-500/20 cursor-pointer"
                                        >
                                            Revoke
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* NAVIDROME SECTION */}
            <section className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4">Navidrome</h2>
                <div className="bg-[#181818] rounded-xl p-5 space-y-4 border border-white/5">
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
                        className="w-full text-left px-5 py-4 bg-[#202020] hover:bg-[#282828] rounded-xl transition-colors text-[#B3B3B3] hover:text-[#1db954] flex items-center justify-between border border-white/5 cursor-pointer"
                    >
                        <span>Open Navidrome login page</span>
                        <span className="text-sm">↗</span>
                    </button>
                </div>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">About</h2>
                <div className="bg-[#181818] rounded-xl p-5 text-sm text-[#B3B3B3] border border-white/5">
                    <p>BinksConnect v0.2.0</p>
                    <p className="mt-1">A provider-agnostic personal music server</p>
                </div>
            </section>
        </main>
    );
}
