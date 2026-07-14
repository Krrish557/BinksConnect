"use client";

import { useRouter, usePathname } from "next/navigation";
import useAuthStore from "@/store/authStore";

const NAV = [
    { name: "Home",      path: "/",          icon: "🏠" },
    { name: "Search",    path: "/search",    icon: "🔍" },
    { name: "Library",   path: "/library",   icon: "🎵" },
    { name: "Upload",    path: "/upload",    icon: "📤", telegramOnly: true },
    { name: "Playlists", path: "/playlists", icon: "📁" },
];

export default function MobileNav() {
    const router = useRouter();
    const pathname = usePathname();
    const user = useAuthStore((s) => s.user);

    const navItems = NAV.filter((item) => !item.telegramOnly || user?.provider === "telegram");

    return (
        <div className="md:hidden shrink-0 bg-[#111] border-t border-white/10">
            <div className="flex justify-around items-center h-16 px-2">
                {navItems.map((item) => {
                    const isActive =
                        item.path === "/"
                            ? pathname === "/"
                            : pathname.startsWith(item.path);

                    return (
                        <button
                            key={item.name}
                            onClick={() => router.push(item.path)}
                            className={`flex flex-col items-center gap-0.5 text-xs px-3 py-1 rounded-lg transition-colors ${
                                isActive
                                    ? "text-white"
                                    : "text-[#B3B3B3]"
                            }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="font-medium">{item.name}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
