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
            <h1 className="v-heading text-3xl font-bold mb-8">Settings</h1>

            {/* ACCOUNT SECTION */}
            <section className="mb-8">
                <h2 className="v-heading text-xl font-bold mb-4">Account</h2>
                <div className="bg-[#1C2123] rounded-xl p-5 space-y-3 border border-[#D8C8A0]/10">
                    <div>
                        <p className="text-xs text-[#94866B]">Username</p>
                        <p className="text-white font-medium">{user?.username || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs text-[#94866B]">Email</p>
                        <p className="text-white font-medium">{user?.email || "—"}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="w-full text-left px-5 py-4 bg-[#1D2223] hover:bg-[#262B2C] rounded-xl transition-colors text-[#E0A489] hover:text-[#EFC6AC] flex items-center justify-between border border-[#D8C8A0]/10 cursor-pointer"
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
                        <h2 className="v-heading text-xl font-bold">Remembered Devices & Sessions</h2>
                        <p className="text-xs text-[#94866B] mt-0.5">Manage devices authorized to access your account</p>
                    </div>
                    {devices.length > 1 && (
                        <button
                            onClick={revokeOtherDevices}
                            className="text-xs bg-red-500/10 hover:bg-red-500/20 text-[#E0A489] border border-red-500/20 px-3 py-1.5 rounded-lg transition font-medium cursor-pointer"
                        >
                            Log Out All Other Devices
                        </button>
                    )}
                </div>

                <div className="bg-[#1C2123] rounded-xl p-5 space-y-3 border border-[#D8C8A0]/10">
                    {loadingDevices ? (
                        <p className="text-sm text-[#94866B]">Loading devices...</p>
                    ) : devices.length === 0 ? (
                        <p className="text-sm text-[#94866B]">No active sessions found.</p>
                    ) : (
                        <div className="space-y-3">
                            {devices.map((device) => (
                                <div
                                    key={device.sessionId}
                                    className="flex items-center justify-between p-3.5 bg-[#222222] rounded-lg border border-[#D8C8A0]/10"
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
                                                    <span className="text-[10px] bg-[#A08C55]/20 text-[#A08C55] border border-[#A08C55]/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                        Current Device
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-[#94866B] mt-0.5">
                                                {device.ipAddress ? `IP: ${device.ipAddress} • ` : ""}
                                                Last active: {device.lastActive ? new Date(device.lastActive).toLocaleString() : "Recently"}
                                            </p>
                                        </div>
                                    </div>

                                    {!device.isCurrent && (
                                        <button
                                            onClick={() => revokeDevice(device.sessionId)}
                                            className="text-xs text-[#E0A489] hover:text-[#EFC6AC] hover:bg-red-500/10 px-3 py-1.5 rounded-md transition font-medium border border-transparent hover:border-red-500/20 cursor-pointer"
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
                <h2 className="v-heading text-xl font-bold mb-4">Navidrome</h2>
                <div className="bg-[#1C2123] rounded-xl p-5 space-y-4 border border-[#D8C8A0]/10">
                    <p className="text-sm text-[#94866B]">
                        Enter your Navidrome server URL to open its login page.
                    </p>
                    <input
                        type="text"
                        value={navUrl}
                        onChange={(e) => setNavUrl(e.target.value)}
                        placeholder="http://localhost:4533"
                        className="w-full px-4 py-3 bg-[#262B2C] text-white rounded-lg outline-none focus:ring-2 focus:ring-[#A08C55] transition text-sm"
                    />
                    <button
                        onClick={handleNavidromeLogin}
                        className="w-full text-left px-5 py-4 bg-[#1D2223] hover:bg-[#262B2C] rounded-xl transition-colors text-[#94866B] hover:text-[#A08C55] flex items-center justify-between border border-[#D8C8A0]/10 cursor-pointer"
                    >
                        <span>Open Navidrome login page</span>
                        <span className="text-sm">↗</span>
                    </button>
                </div>
            </section>

            <section>
                <h2 className="v-heading text-xl font-bold mb-4">About</h2>
                <div className="bg-[#1C2123] rounded-xl p-5 text-sm text-[#94866B] border border-[#D8C8A0]/10">
                    <p>BinksConnect v0.2.0</p>
                    <p className="mt-1">A provider-agnostic personal music server</p>
                </div>
            </section>
        </main>
    );
}
