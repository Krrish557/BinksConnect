"use client";

import Sidebar from "./Sidebar";
import BottomPlayer from "./BottomPlayer";

export default function AppLayout({ children }) {
    return (
        <div className="min-h-screen bg-black text-white flex">
            <Sidebar />

            <main className="flex-1 p-6 pb-24">
                {children}
            </main>

            <BottomPlayer />
        </div>
    );
}