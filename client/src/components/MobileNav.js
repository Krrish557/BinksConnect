"use client";

import { useRouter, usePathname } from "next/navigation";
import useAuthStore from "@/store/authStore";

const NAV = [
    { name: "Home",      path: "/",          icon: "🏠" },
    { name: "Market",    path: "/market",    icon: "📊" },
    { name: "Search",    path: "/search",    icon: "🔍" },
    { name: "Library",   path: "/library",   icon: "🎵" },
    { name: "Playlists", path: "/playlists", icon: "📁" },
];

export default function MobileNav() {
    const router = useRouter();
    const pathname = usePathname();

    const navItems = NAV;

    return (
        <nav className="md:hidden shrink-0 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/10 sticky bottom-0 z-40 safe-area-pb">
            <div className="flex justify-around items-center h-16 px-1">
                {navItems.map((item) => {
                    const isActive =
                        item.path === "/"
                            ? pathname === "/"
                            : pathname.startsWith(item.path);

                    return (
                        <button
                            key={item.name}
                            onClick={() => router.push(item.path)}
                            className={`flex flex-col items-center justify-center gap-1 text-[11px] px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 ${
                                isActive
                                    ? "text-[#1db954] font-bold bg-[#1db954]/10 border border-[#1db954]/20"
                                    : "text-[#B3B3B3] hover:text-white"
                            }`}
                        >
                            <span className="text-lg leading-none">{item.icon}</span>
                            <span className="leading-none">{item.name}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
