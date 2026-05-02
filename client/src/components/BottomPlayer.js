"use client";

import { usePlayerStore } from "@/store/playerStore";

export default function BottomPlayer() {
    const {
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        togglePlay,
        next,
        previous,
        seek,
        openPlayer,
    } = usePlayerStore();

    const format = (t) => {
        if (!t) return "0:00";
        const m = Math.floor(t / 60);
        const s = Math.floor(t % 60);
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    if (!currentTrack) {
        return (
            <div className="h-full flex items-center justify-center text-gray-400">
                No track selected
            </div>
        );
    }

    return (
        <div className="h-full px-4 flex items-center justify-between">

            {/* ✅ ONLY THIS AREA OPENS PLAYER */}
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    openPlayer();
                }}
                className="flex items-center gap-3 w-1/4 cursor-pointer"
            >
                <img
                    src={currentTrack.cover}
                    className="w-12 h-12 rounded-md object-cover"
                />

                <div className="truncate">
                    <p className="font-semibold truncate">
                        {currentTrack.title}
                    </p>
                    <p className="text-sm text-gray-400 truncate">
                        {currentTrack.artist}
                    </p>
                </div>
            </div>

            {/* ✅ CONTROLS — MUST BLOCK PROPAGATION */}
            <div
                className="flex flex-col items-center w-1/2"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-4">
                    <button onClick={previous}>⏮</button>

                    <button
                        onClick={togglePlay}
                        className="bg-white text-black rounded-full px-4 py-1"
                    >
                        {isPlaying ? "⏸" : "▶"}
                    </button>

                    <button onClick={next}>⏭</button>
                </div>

                <div className="flex items-center gap-2 w-full mt-1">
                    <span className="text-xs">{format(currentTime)}</span>

                    <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={currentTime}
                        onChange={(e) => seek(Number(e.target.value))}
                        className="w-full"
                    />

                    <span className="text-xs">{format(duration)}</span>
                </div>
            </div>

            {/* RIGHT */}
            <div className="w-1/4 text-right text-sm text-gray-400">
                Volume
            </div>
        </div>
    );
}