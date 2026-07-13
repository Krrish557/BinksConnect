"use client";

import { usePlayerStore } from "@/store/playerStore";
import { formatTime } from "@/utils/format";

export default function BottomPlayer() {
    const {
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isShuffle,
        isRepeat,
        togglePlay,
        next,
        previous,
        seek,
        setVolume,
        toggleShuffle,
        toggleRepeat,
        openPlayer,
    } = usePlayerStore();

    const progress = duration ? (currentTime / duration) * 100 : 0;

    if (!currentTrack) {
        return (
            <div className="h-full flex items-center justify-center text-[#B3B3B3] text-sm">
                No track selected
            </div>
        );
    }

    return (
        <div className="h-full px-4 flex items-center gap-4">

            {/* TRACK INFO — clicks open full player */}
            <div
                onClick={openPlayer}
                className="flex items-center gap-3 w-1/4 min-w-0 cursor-pointer group"
            >
                <img
                    src={currentTrack.cover}
                    alt={currentTrack.title}
                    className="w-12 h-12 rounded-md object-cover shrink-0 shadow"
                />
                <div className="min-w-0 hidden md:block">
                    <p className="font-semibold text-sm text-white truncate group-hover:text-[#1db954] transition-colors">
                        {currentTrack.title}
                    </p>
                    <p className="text-xs text-[#B3B3B3] truncate">
                        {currentTrack.artist}
                    </p>
                </div>
            </div>

            {/* CENTER — controls + seek */}
            <div
                className="flex flex-col items-center flex-1 gap-1"
                onClick={(e) => e.stopPropagation()}
            >
                {/* CONTROL BUTTONS */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleShuffle}
                        className={`text-sm transition-colors hidden md:block ${
                            isShuffle ? "text-[#1db954]" : "text-[#B3B3B3] hover:text-white"
                        }`}
                        title="Shuffle"
                    >
                        ⇄
                    </button>

                    <button
                        onClick={previous}
                        className="text-[#B3B3B3] hover:text-white transition-colors"
                    >
                        ⏮
                    </button>

                    <button
                        onClick={togglePlay}
                        className="bg-white text-black rounded-full w-9 h-9 flex items-center justify-center hover:scale-105 transition-transform shadow"
                    >
                        {isPlaying ? "⏸" : "▶"}
                    </button>

                    <button
                        onClick={next}
                        className="text-[#B3B3B3] hover:text-white transition-colors"
                    >
                        ⏭
                    </button>

                    <button
                        onClick={toggleRepeat}
                        className={`text-sm transition-colors hidden md:block ${
                            isRepeat ? "text-[#1db954]" : "text-[#B3B3B3] hover:text-white"
                        }`}
                        title="Repeat"
                    >
                        ↺
                    </button>
                </div>

                {/* SEEK BAR */}
                <div className="flex items-center gap-2 w-full max-w-md">
                    <span className="text-xs text-[#B3B3B3] w-8 text-right shrink-0">
                        {formatTime(currentTime)}
                    </span>

                    <div className="relative flex-1 h-1 group/seek">
                        <div className="w-full h-1 bg-[#383838] rounded-full">
                            <div
                                className="h-1 bg-[#1db954] rounded-full relative"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/seek:opacity-100 transition-opacity" />
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

                    <span className="text-xs text-[#B3B3B3] w-8 shrink-0">
                        {formatTime(duration)}
                    </span>
                </div>
            </div>

            {/* RIGHT — volume */}
            <div
                className="hidden md:flex items-center gap-2 w-1/4 justify-end"
                onClick={(e) => e.stopPropagation()}
            >
                <span className="text-sm text-[#B3B3B3]">
                    {volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
                </span>
                <div className="relative w-24 h-1 group/vol">
                    <div className="w-full h-1 bg-[#383838] rounded-full">
                        <div
                            className="h-1 bg-[#B3B3B3] group-hover/vol:bg-[#1db954] rounded-full transition-colors"
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
            </div>
        </div>
    );
}
