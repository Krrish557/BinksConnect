"use client";

import { useEffect, useState } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { trackService } from "@/services/trackService";
import { formatTime } from "@/utils/format";
import { apiClient } from "@/services/apiClient";

export default function BottomPlayer() {
    const {
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isShuffle,
        isRepeat,
        bufferProgress,
        nextTrackProgress,
        nextTrackId,
        togglePlay,
        next,
        previous,
        seek,
        setVolume,
        toggleShuffle,
        toggleRepeat,
        openPlayer,
    } = usePlayerStore();

    const [isFavorited, setIsFavorited] = useState(false);

    useEffect(() => {
        if (!currentTrack) return;
        trackService.checkFavorites([currentTrack.id]).then((res) => {
            setIsFavorited(!!res.favorited[currentTrack.id]);
        }).catch(() => {});
    }, [currentTrack?.id]);

    const handleToggleFavorite = async (e) => {
        e.stopPropagation();
        if (!currentTrack) return;
        try {
            const res = await trackService.toggleFavorite(currentTrack.id);
            setIsFavorited(res.isFavorited);
        } catch (err) {
            console.error("Toggle favorite error:", err);
        }
    };

    const progress = duration ? (currentTime / duration) * 100 : 0;

    if (!currentTrack) {
        return (
            <div className="h-full flex items-center justify-center text-[#94866B] text-sm">
                No track selected
            </div>
        );
    }

    return (
        <div className="h-full px-4 flex items-center gap-4">
            <div
                onClick={openPlayer}
                className="flex items-center gap-3 w-1/4 min-w-0 cursor-pointer group"
            >
                <img
                    src={apiClient.resolveUrl(currentTrack.cover)}
                    alt={currentTrack.title}
                    className="w-12 h-12 rounded-md object-cover shrink-0 shadow"
                />
                <div className="min-w-0 hidden md:block">
                    <p className="font-semibold text-sm text-white truncate group-hover:text-[#A08C55] transition-colors">
                        {currentTrack.title}
                    </p>
                    <p className="text-xs text-[#94866B] truncate">
                        {currentTrack.artist}
                    </p>
                    {nextTrackId && nextTrackProgress < 100 && (
                        <p className="text-[10px] text-[#94866B]/60 truncate mt-0.5">
                            Next ready: {Math.round(nextTrackProgress)}%
                        </p>
                    )}
                </div>
            </div>

            <div
                className="flex flex-col items-center flex-1 gap-1"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleShuffle}
                        className={`text-base transition-colors hidden md:block cursor-pointer ${
                            isShuffle ? "text-[#A08C55]" : "text-[#94866B] hover:text-white"
                        }`}
                        title="Shuffle"
                    >
                        ⇄
                    </button>

                    <button
                        onClick={previous}
                        className="text-[#94866B] hover:text-white transition-colors text-base cursor-pointer"
                    >
                        ⏮
                    </button>

                    <button
                        onClick={togglePlay}
                        className="bg-[#A08C55] hover:bg-[#C0A871] text-[#171B1C] rounded-full w-10 h-10 flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-[#A08C55]/20 cursor-pointer font-bold"
                    >
                        {isPlaying ? "⏸" : "▶"}
                    </button>

                    <button
                        onClick={next}
                        className="text-[#94866B] hover:text-white transition-colors text-base cursor-pointer"
                    >
                        ⏭
                    </button>

                    <button
                        onClick={toggleRepeat}
                        className={`text-base transition-colors hidden md:block cursor-pointer ${
                            isRepeat ? "text-[#A08C55]" : "text-[#94866B] hover:text-white"
                        }`}
                        title="Repeat"
                    >
                        ↺
                    </button>
                </div>

                <div className="flex items-center gap-2 w-full max-w-md">
                    <span className="text-xs text-[#94866B] w-8 text-right shrink-0">
                        {formatTime(currentTime)}
                    </span>

                    <div className="relative flex-1 h-1 group/seek">
                        <div className="w-full h-1 bg-[#2E3435] rounded-full">
                            <div
                                className="h-1 bg-[#A08C55] rounded-full relative"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/seek:opacity-100 transition-opacity" />
                            </div>
                        </div>
                        <div
                            className="absolute top-0 left-0 h-1 bg-[#D8C8A0]/25 rounded-full pointer-events-none"
                            style={{ width: `${bufferProgress}%` }}
                        />
                        <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            value={currentTime}
                            onChange={(e) => seek(Number(e.target.value))}
                            className="absolute inset-0 w-full opacity-0 cursor-pointer"
                        />
                    </div>

                    <span className="text-xs text-[#94866B] w-8 shrink-0">
                        {formatTime(duration)}
                    </span>
                </div>
            </div>

            <div
                className="hidden md:flex items-center gap-2 w-1/4 justify-end"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={handleToggleFavorite}
                    className={`text-lg transition-colors ${
                        isFavorited ? "text-[#A08C55]" : "text-[#94866B] hover:text-white"
                    }`}
                    title={isFavorited ? "Remove from favorites" : "Add to favorites"}
                >
                    {isFavorited ? "♥" : "♡"}
                </button>
                <span className="text-sm text-[#94866B]">
                    {volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
                </span>
                <div className="relative w-24 h-1 group/vol">
                    <div className="w-full h-1 bg-[#2E3435] rounded-full">
                        <div
                            className="h-1 bg-[#94866B] group-hover/vol:bg-[#A08C55] rounded-full transition-colors"
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
