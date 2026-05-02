"use client";

import Sidebar from "./Sidebar";
import BottomPlayer from "./BottomPlayer";
import MobileNav from "./MobileNav";
import FullPlayer from "./FullPlayer";
import { usePlayerStore } from "@/store/playerStore";

export default function AppLayout({ children }) {
    const isPlayerOpen = usePlayerStore((s) => s.isPlayerOpen);

    return (
        <div className="h-screen w-screen bg-black text-white flex flex-col">

            {/* MAIN AREA */}
            <div className="flex flex-1 overflow-hidden">

                {/* DESKTOP SIDEBAR */}
                <div className="hidden md:flex w-64 border-r border-gray-800">
                    <Sidebar />
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto pb-40 md:pb-24">
                    {children}
                </div>

            </div>

            {/* PLAYER (FIXED ABOVE NAVBAR) */}
            <div className="fixed bottom-16 left-0 right-0 md:bottom-0 z-50 bg-[#181818] border-t border-gray-800">
                <BottomPlayer />
            </div>

            {/* MOBILE NAV */}
            <MobileNav />

            {/* 🔥 FULL PLAYER (MUST BE HERE) */}
            {isPlayerOpen && <FullPlayer />}

        </div>
    );
}