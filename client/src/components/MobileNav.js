"use client";

import { useRouter, usePathname } from "next/navigation";

const NAV = [
    { name: "Home",      path: "/",          icon: "🏠" },
    { name: "Search",    path: "/search",    icon: "🔍" },
    { name: "Library",   path: "/library",   icon: "🎵" },
    { name: "Playlists", path: "/playlists", icon: "📁" },
];

export default function MobileNav() {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <div className="md:hidden shrink-0 bg-[#111] border-t border-white/10">
            <div className="flex justify-around items-center h-16 px-2">
                {NAV.map((item) => {
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
