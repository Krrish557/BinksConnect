"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import useAuthStore from "@/store/authStore";

const NAV = [
    { label: "Home",      path: "/",           icon: "🏠" },
    { label: "Search",    path: "/search",      icon: "🔍" },
    { label: "Library",   path: "/library",     icon: "🎵" },
    { label: "Albums",    path: "/albums",      icon: "💿" },
    { label: "Artists",   path: "/artists",     icon: "🎤" },
    { label: "Playlists", path: "/playlists",   icon: "📁" },
    { label: "Upload",    path: "/upload",      icon: "📤", telegramOnly: true },
    { label: "Settings",  path: "/settings",    icon: "⚙️" },
];

export default function Sidebar() {
    const pathname = usePathname();
    const logout = useAuthStore((s) => s.logout);
    const user = useAuthStore((s) => s.user);

    const navItems = NAV.filter((item) => !item.telegramOnly || user?.provider === "telegram");

    return (
        <aside className="hidden md:flex flex-col w-20 lg:w-64 shrink-0 bg-[#111] border-r border-white/5 overflow-hidden">
            {/* LOGO */}
            <div className="px-3 lg:px-6 py-6 border-b border-white/5">
                <h1 className="text-xl font-bold text-white lg:block hidden">
                    🎵 BinksConnect
                </h1>
                <h1 className="text-xl font-bold text-white lg:hidden">🎵</h1>
            </div>

            {/* NAV */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive =
                        item.path === "/"
                            ? pathname === "/"
                            : pathname.startsWith(item.path);

                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium
                                ${
                                    isActive
                                        ? "bg-[#282828] text-white"
                                        : "text-[#B3B3B3] hover:text-white hover:bg-[#1a1a1a]"
                                }`}
                        >
                            <span className="text-lg">{item.icon}</span>
                            <span className="lg:block hidden">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* LOGOUT */}
            <div className="px-3 py-4 border-t border-white/5">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#B3B3B3] hover:text-white hover:bg-[#1a1a1a] w-full transition-colors"
                >
                    <span className="text-lg">🚪</span>
                    <span className="lg:block hidden">Logout</span>
                </button>
            </div>
        </aside>
    );
}
