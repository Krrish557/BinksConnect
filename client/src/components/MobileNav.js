"use client";

import { useRouter, usePathname } from "next/navigation";
import { usePlayerStore } from "@/store/playerStore";

export default function MobileNav() {
    const router = useRouter();
    const pathname = usePathname();
    const { openPlayer } = usePlayerStore();

    const navItems = [
        { name: "Home", path: "/", icon: "🏠" },
        { name: "Search", path: "/search", icon: "🔍" },
        { name: "Library", path: "/library", icon: "🎵" },
        { name: "Playlists", path: "/playlists", icon: "📁" }, // ✅ NEW
    ];

    return (
        <div onClick={openPlayer} className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-50">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.path;

                    return (
                        <button
                            key={item.name}
                            onClick={() => router.push(item.path)}
                            className={`flex flex-col items-center text-xs ${isActive ? "text-white" : "text-gray-400"
                                }`}
                        >
                            <span className="text-lg">{item.icon}</span>
                            {item.name}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}