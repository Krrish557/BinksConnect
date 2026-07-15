"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePlayerStore } from "@/store/playerStore";
import SyncedLyrics from "@/components/SyncedLyrics";
import { apiClient } from "@/services/apiClient";

export default function LyricsPage() {
    const router = useRouter();
    const currentTrack = usePlayerStore((s) => s.currentTrack);
    const currentTime = usePlayerStore((s) => s.currentTime);
    const lyrics = usePlayerStore((s) => s.lyrics);
    const fetchLyrics = usePlayerStore((s) => s.fetchLyrics);
    const seek = usePlayerStore((s) => s.seek);

    useEffect(() => {
        if (currentTrack) {
            fetchLyrics(currentTrack);
        }
    }, [currentTrack?.id]);

    useEffect(() => {
        const handler = (e) => {
            if (e.detail?.time !== undefined) {
                seek(e.detail.time);
            }
        };
        window.addEventListener("lyricsSeek", handler);
        return () => window.removeEventListener("lyricsSeek", handler);
    }, [seek]);

    const handleEscape = useCallback(
        (e) => {
            if (e.key === "Escape") router.back();
        },
        [router]
    );

    useEffect(() => {
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [handleEscape]);

    const coverUrl = currentTrack?.cover ? apiClient.resolveUrl(currentTrack.cover) : null;

    return (
        <div className="relative w-full h-full min-h-[calc(100vh-6rem)] md:min-h-[calc(100vh-8rem)] overflow-hidden">
            {/* Blurred background */}
            {coverUrl ? (
                <div
                    className="absolute inset-0 bg-cover bg-center scale-110 blur-3xl opacity-30"
                    style={{ backgroundImage: `url(${coverUrl})` }}
                />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-[#1a3a27] to-[#0a0a0a] opacity-60" />
            )}
            <div className="absolute inset-0 bg-black/60" />

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full px-6 py-6 md:px-12 md:py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 shrink-0">
                    <button
                        onClick={() => router.back()}
                        className="text-[#B3B3B3] hover:text-white transition-colors text-sm flex items-center gap-2"
                    >
                        <span className="text-lg">←</span>
                        <span className="hidden sm:inline">Back</span>
                    </button>
                    <h1 className="text-[#B3B3B3] text-sm font-medium uppercase tracking-wider">
                        Lyrics
                    </h1>
                    <div className="w-16" />
                </div>

                {/* Track info */}
                {currentTrack && (
                    <div className="flex items-center gap-4 mb-8 shrink-0">
                        {coverUrl && (
                            <img
                                src={coverUrl}
                                alt={currentTrack.title}
                                className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover shadow-2xl"
                            />
                        )}
                        <div className="overflow-hidden">
                            <h2 className="text-white text-xl md:text-2xl font-bold truncate">
                                {currentTrack.title}
                            </h2>
                            <p className="text-[#B3B3B3] text-sm md:text-base truncate">
                                {currentTrack.artist}
                            </p>
                        </div>
                    </div>
                )}

                {/* Lyrics area */}
                <div className="flex-1 min-h-0 overflow-hidden">
                    {!currentTrack ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <p className="text-[#B3B3B3] text-lg mb-2">
                                    No track playing
                                </p>
                                <p className="text-[#737373] text-sm">
                                    Start playing a track to see lyrics here
                                </p>
                            </div>
                        </div>
                    ) : (
                        <SyncedLyrics lyrics={lyrics} currentTime={currentTime} />
                    )}
                </div>
            </div>
        </div>
    );
}
