"use client";

import Sidebar from "./Sidebar";
import BottomPlayer from "./BottomPlayer";
import MobileNav from "./MobileNav";
import FullPlayer from "./FullPlayer";
import KeyboardShortcuts from "./KeyboardShortcuts";
import { usePlayerStore } from "@/store/playerStore";

export default function AppLayout({ children }) {
    const isPlayerOpen = usePlayerStore((s) => s.isPlayerOpen);
    const currentTrack = usePlayerStore((s) => s.currentTrack);

    return (
        <div className="h-screen w-full bg-[#121212] text-white flex flex-col overflow-hidden">

            {/* MAIN AREA — flex row fills remaining vertical space */}
            <div className="flex flex-1 min-h-0">

                {/* DESKTOP SIDEBAR */}
                <Sidebar />

                {/* CONTENT — fills remaining width, scrolls independently */}
                <main className="flex-1 overflow-y-auto min-w-0">
                    {children}
                </main>
            </div>

            {/* BOTTOM PLAYER — participates in flex layout, occupies real height */}
            <div
                className={`shrink-0 bg-[#181818] border-t border-white/5 transition-all
                    ${currentTrack ? "h-20 md:h-24" : "h-12 md:h-14"}`}
            >
                <BottomPlayer />
            </div>

            {/* MOBILE NAV — static flex child, only visible on mobile */}
            <MobileNav />

            {/* FULL PLAYER OVERLAY — still fixed since it's a fullscreen overlay */}
            {isPlayerOpen && <FullPlayer />}

            {/* KEYBOARD SHORTCUTS */}
            <KeyboardShortcuts />
        </div>
    );
}
