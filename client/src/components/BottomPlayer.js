"use client";

import usePlayerStore from "@/store/playerStore";

export default function BottomPlayer() {
    const { currentSong, isPlaying } =
        usePlayerStore();

    return (
        <div className="fixed bottom-0 md:left-20 lg:left-64 left-0 right-0 h-20 bg-[#181818] border-t border-zinc-700 flex items-center px-4 md:px-6 z-40">
            <div>
                <p className="font-semibold">
                    {currentSong
                        ? currentSong.title
                        : "No song playing"}
                </p>

                <p className="text-sm text-zinc-400">
                    {isPlaying ? "Playing" : "Paused"}
                </p>
            </div>
        </div>
    );
}