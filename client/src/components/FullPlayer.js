"use client";

import { usePlayerStore } from "@/store/playerStore";
import QueueItem from "./QueueItem";

export default function FullPlayer() {
    const {
        currentTrack,
        isPlaying,
        togglePlay,
        next,
        previous,
        currentTime,
        duration,
        seek,
        closePlayer,
        queue,
        currentIndex,
        setQueue,
    } = usePlayerStore();

    if (!currentTrack) return null;

    const format = (t) => {
        if (!t) return "0:00";
        const m = Math.floor(t / 60);
        const s = Math.floor(t % 60);
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const playFromQueue = (index) => {
        setQueue(queue, index);
    };

    return (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col">

            {/* HEADER */}
            <div className="p-4 flex items-center justify-between">
                <button onClick={closePlayer}>↓</button>
                <p className="text-sm text-gray-400">Now Playing</p>
                <div />
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 overflow-y-auto px-6">

                {/* COVER */}
                <div className="flex justify-center">
                    <img
                        src={currentTrack.cover}
                        className="w-72 h-72 rounded-lg object-cover"
                    />
                </div>

                {/* INFO */}
                <div className="mt-6 text-center">
                    <h2 className="text-xl font-bold">
                        {currentTrack.title}
                    </h2>
                    <p className="text-gray-400">
                        {currentTrack.artist}
                    </p>
                </div>

                {/* SEEK */}
                <div className="mt-6">
                    <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={currentTime}
                        onChange={(e) => seek(Number(e.target.value))}
                        className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-400">
                        <span>{format(currentTime)}</span>
                        <span>{format(duration)}</span>
                    </div>
                </div>

                {/* CONTROLS */}
                <div className="flex justify-center gap-6 mt-6 text-2xl">
                    <button onClick={previous}>⏮</button>
                    <button onClick={togglePlay}>
                        {isPlaying ? "⏸" : "▶"}
                    </button>
                    <button onClick={next}>⏭</button>
                </div>

                {/* ================= QUEUE ================= */}
                <div className="mt-10">

                    <h3 className="text-lg font-semibold mb-4">
                        Up Next
                    </h3>

                    <div className="space-y-2">
                        {queue.map((track, index) => (
                            <QueueItem
                                key={`${track.id}-${index}`}
                                track={track}
                                index={index}
                                isActive={index === currentIndex}
                                onClick={() => playFromQueue(index)}
                            />
                        ))}
                    </div>

                </div>

            </div>
        </div>
    );
}