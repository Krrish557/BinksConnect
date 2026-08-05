"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import useAuthStore from "@/store/authStore";

const NAV = [
    { label: "Home", path: "/", icon: "🏠" },
    { label: "Search", path: "/search", icon: "🔍" },
    { label: "Library", path: "/library", icon: "🎵" },
    { label: "Albums", path: "/albums", icon: "💿" },
    { label: "Artists", path: "/artists", icon: "🎤" },
    { label: "Playlists", path: "/playlists", icon: "📁" },
    { label: "Upload", path: "/upload", icon: "📤" },
    { label: "Settings", path: "/settings", icon: "⚙️" },
];

export default function Sidebar() {
    const pathname = usePathname();
    const user = useAuthStore((s) => s.user);

    const navItems = NAV;

    return (
        <aside className="hidden md:flex flex-col w-20 lg:w-64 shrink-0 p-2 select-none">
            <div className="flex flex-col h-full bg-[#181818]/90 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                {/* LOGO */}
                <div className="px-4 lg:px-6 py-5 border-b border-white/5 flex items-center gap-3">
                    <Image
                        src="/logo.png"
                        alt="BinksConnect logo"
                        width={1024}
                        height={1024}
                        className="w-10 h-10 rounded-xl object-cover shrink-0"
                    />
                    <div className="lg:block hidden min-w-0">
                        <h1 className="text-base font-extrabold text-white tracking-tight truncate">
                            BinksConnect
                        </h1>
                    </div>
                </div>

                {/* NAV */}
                <nav className="flex-1 px-2.5 py-4 space-y-1.5 overflow-y-auto scrollbar-hide">
                    {navItems.map((item) => {
                        const isActive =
                            item.path === "/"
                                ? pathname === "/"
                                : pathname.startsWith(item.path);

                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-200 text-sm font-semibold group ${isActive
                                    ? "bg-gradient-to-r from-[#1db954]/20 to-[#1db954]/5 text-[#1db954] border-l-4 border-[#1db954] shadow-sm"
                                    : "text-[#B3B3B3] hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                <span className={`text-xl transition-transform group-hover:scale-110 ${isActive ? "text-[#1db954]" : ""}`}>
                                    {item.icon}
                                </span>
                                <span className="lg:block hidden truncate">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* USER PROFILE MINICARD */}
                {user && (
                    <div className="p-3 border-t border-white/5 bg-black/20">
                        <Link
                            href="/settings"
                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition group"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow">
                                {user.username ? user.username[0].toUpperCase() : "U"}
                            </div>
                            <div className="lg:block hidden min-w-0">
                                <p className="text-xs font-bold text-white truncate group-hover:text-[#1db954] transition">
                                    {user.username || "User"}
                                </p>

                            </div>
                        </Link>
                    </div>
                )}
            </div>
        </aside>
    );
}
