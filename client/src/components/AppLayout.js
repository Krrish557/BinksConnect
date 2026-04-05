"use client";

import Sidebar from "./Sidebar";
import BottomPlayer from "./BottomPlayer";
import MobileNav from "./MobileNav";

export default function AppLayout({ children }) {
    return (
        <div className="min-h-screen bg-[#121212] text-white">
            <Sidebar />

            <main className="ml-0 md:ml-20 lg:ml-64 p-4 md:p-6 pb-36">
                {children}
            </main>

            <BottomPlayer />
            <MobileNav />
        </div>
    );
}