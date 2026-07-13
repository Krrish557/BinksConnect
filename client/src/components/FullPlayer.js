"use client";

import { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "@/store/playerStore";
import QueueItem from "./QueueItem";
import { formatTime } from "@/utils/format";
import { apiClient } from "@/services/apiClient";

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
        volume,
        setVolume,
        isShuffle,
        isRepeat,
        toggleShuffle,
        toggleRepeat,
    } = usePlayerStore();

    const [tab, setTab] = useState("queue"); // "queue" | "related"
    const startYRef = useRef(null);
    const containerRef = useRef(null);

    // Swipe down to close
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const onTouchStart = (e) => {
            startYRef.current = e.touches[0].clientY;
        };

        const onTouchEnd = (e) => {
            if (startYRef.current === null) return;
            const dy = e.changedTouches[0].clientY - startYRef.current;
            if (dy > 80) closePlayer();
            startYRef.current = null;
        };

        el.addEventListener("touchstart", onTouchStart, { passive: true });
        el.addEventListener("touchend", onTouchEnd, { passive: true });
        return () => {
            el.removeEventListener("touchstart", onTouchStart);
            el.removeEventListener("touchend", onTouchEnd);
        };
    }, [closePlayer]);

    if (!currentTrack) return null;

    const progress = duration ? (currentTime / duration) * 100 : 0;

    const playFromQueue = (index) => setQueue(queue, index);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[200] flex flex-col"
            style={{
                background: "linear-gradient(180deg, #1a1a2e 0%, #111 60%)",
            }}
        >
            {/* DRAG HANDLE (mobile) */}
            <div className="flex justify-center pt-3 pb-1 md:hidden">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            {/* HEADER */}
            <div className="flex items-center justify-between px-6 py-4">
                <button
                    onClick={closePlayer}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition text-white text-lg"
                >
                    ↓
                </button>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#B3B3B3]">
                    Now Playing
                </p>
                <div className="w-9" />
            </div>

            {/* SCROLLABLE BODY */}
            <div className="flex-1 overflow-y-auto px-6 pb-8">

                {/* COVER */}
                <div className="flex justify-center my-4">
                    <img
                        src={apiClient.resolveUrl(currentTrack.cover)}
                        alt={currentTrack.title}
                        className={`rounded-2xl object-cover shadow-2xl transition-all duration-300 ${
                            isPlaying
                                ? "w-72 h-72 md:w-80 md:h-80"
                                : "w-60 h-60 md:w-72 md:h-72 opacity-80"
                        }`}
                    />
                </div>

                {/* TRACK INFO */}
                <div className="flex items-center justify-between mt-6 mb-4">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold text-white truncate">
                            {currentTrack.title}
                        </h2>
                        <p className="text-[#B3B3B3] mt-1 truncate">
                            {currentTrack.artist}
                        </p>
                    </div>
                    <div className="ml-4 text-[#B3B3B3] text-2xl">♡</div>
                </div>

                {/* SEEK BAR */}
                <div className="mb-5">
                    <div className="relative h-1.5 group/seek cursor-pointer">
                        <div className="w-full h-1.5 bg-white/10 rounded-full">
                            <div
                                className="h-1.5 bg-[#1db954] rounded-full relative"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow opacity-0 group-hover/seek:opacity-100 transition-opacity" />
                            </div>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            value={currentTime}
                            onChange={(e) => seek(Number(e.target.value))}
                            className="absolute inset-0 w-full opacity-0 cursor-pointer"
                        />
                    </div>
                    <div className="flex justify-between mt-1.5 text-xs text-[#B3B3B3]">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* CONTROLS */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={toggleShuffle}
                        className={`text-xl transition-colors ${
                            isShuffle ? "text-[#1db954]" : "text-[#B3B3B3] hover:text-white"
                        }`}
                    >
                        ⇄
                    </button>

                    <button
                        onClick={previous}
                        className="text-[#B3B3B3] hover:text-white transition-colors text-3xl"
                    >
                        ⏮
                    </button>

                    <button
                        onClick={togglePlay}
                        className="bg-white text-black rounded-full w-16 h-16 flex items-center justify-center text-2xl hover:scale-105 transition-transform shadow-lg"
                    >
                        {isPlaying ? "⏸" : "▶"}
                    </button>

                    <button
                        onClick={next}
                        className="text-[#B3B3B3] hover:text-white transition-colors text-3xl"
                    >
                        ⏭
                    </button>

                    <button
                        onClick={toggleRepeat}
                        className={`text-xl transition-colors ${
                            isRepeat ? "text-[#1db954]" : "text-[#B3B3B3] hover:text-white"
                        }`}
                    >
                        ↺
                    </button>
                </div>

                {/* VOLUME */}
                <div className="flex items-center gap-3 mb-8">
                    <span className="text-sm text-[#B3B3B3]">🔉</span>
                    <div className="relative flex-1 h-1 group/vol">
                        <div className="w-full h-1 bg-white/10 rounded-full">
                            <div
                                className="h-1 bg-[#B3B3B3] rounded-full"
                                style={{ width: `${volume * 100}%` }}
                            />
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={(e) => setVolume(Number(e.target.value))}
                            className="absolute inset-0 w-full opacity-0 cursor-pointer"
                        />
                    </div>
                    <span className="text-sm text-[#B3B3B3]">🔊</span>
                </div>

                {/* QUEUE TABS */}
                <div className="flex gap-4 border-b border-white/10 mb-4">
                    {["queue"].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`pb-2 text-sm font-semibold capitalize transition-colors border-b-2 ${
                                tab === t
                                    ? "text-white border-[#1db954]"
                                    : "text-[#B3B3B3] border-transparent hover:text-white"
                            }`}
                        >
                            Up Next
                        </button>
                    ))}
                </div>

                {/* QUEUE LIST */}
                <div className="space-y-1">
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
    );
}
