"use client";

import NowPlayingBar from "@/components/ui/NowPlayingBar";
import { usePlayerStore } from "@/store/playerStore";
import { apiClient } from "@/services/apiClient";

export default function QueueItem({ track, isActive, index, onClick }) {
    const isPlaying = usePlayerStore((s) => s.isPlaying);

    return (
        <div
            onClick={onClick}
            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                isActive ? "bg-[#1a3a27]" : "hover:bg-[#1f1f1f]"
            }`}
        >
            {/* COVER */}
            <img
                src={apiClient.resolveUrl(track.cover)}
                alt={track.title}
                className="w-10 h-10 rounded-md object-cover shrink-0"
            />

            {/* TEXT */}
            <div className="flex flex-col flex-1 overflow-hidden">
                <p
                    className={`truncate text-sm ${
                        isActive ? "text-[#1db954]" : "text-white"
                    }`}
                >
                    {track.title}
                </p>
                <p className="text-xs text-[#B3B3B3] truncate">{track.artist}</p>
            </div>

            {/* RIGHT — equalizer or index */}
            <div className="shrink-0">
                {isActive ? (
                    <NowPlayingBar isPlaying={isPlaying} />
                ) : (
                    <span className="text-xs text-[#B3B3B3]">{index + 1}</span>
                )}
            </div>
        </div>
    );
}
