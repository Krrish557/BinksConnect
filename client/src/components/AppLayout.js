"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import BottomPlayer from "./BottomPlayer";
import MobileNav from "./MobileNav";
import FullPlayer from "./FullPlayer";
import KeyboardShortcuts from "./KeyboardShortcuts";
import { usePlayerStore } from "@/store/playerStore";
import useAuthStore from "@/store/authStore";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

export default function AppLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const isPlayerOpen = usePlayerStore((s) => s.isPlayerOpen);
    const currentTrack = usePlayerStore((s) => s.currentTrack);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const isInitializing = useAuthStore((s) => s.isInitializing);
    const init = useAuthStore((s) => s.init);

    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

    useEffect(() => {
        init();
    }, [init]);

    useEffect(() => {
        if (isInitializing) return;
        if (isAuthenticated && isPublic) {
            router.replace("/");
        } else if (!isAuthenticated && !isPublic) {
            router.replace("/login");
        }
    }, [isInitializing, isAuthenticated, isPublic, router]);

    if (isInitializing) {
        return (
            <div className="h-screen w-full bg-[#121212] text-white flex items-center justify-center">
                <p className="text-sm text-[#B3B3B3]">Loading...</p>
            </div>
        );
    }

    if (isPublic) {
        return <>{children}</>;
    }

    return (
        <div className="h-screen w-full bg-[#0a0a0a] text-white flex flex-col overflow-hidden">

            {/* MAIN AREA — flex row fills remaining vertical space */}
            <div className="flex flex-1 min-h-0 gap-0">

                {/* DESKTOP SIDEBAR */}
                <Sidebar />

                {/* CONTENT — fills remaining width, scrolls independently with floating rounded container */}
                <main className="flex-1 overflow-y-auto min-w-0 m-0 md:m-2 md:ml-0 bg-[#121212] md:rounded-2xl border-0 md:border md:border-white/5 shadow-2xl">
                    {children}
                </main>
            </div>

            {/* BOTTOM PLAYER — participates in flex layout, occupies real height */}
            <div
                className={`shrink-0 bg-[#181818]/95 backdrop-blur-2xl border-t border-white/10 transition-all z-30
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
