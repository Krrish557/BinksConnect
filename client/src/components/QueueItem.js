"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import NowPlayingBar from "@/components/ui/NowPlayingBar";
import { usePlayerStore } from "@/store/playerStore";
import { apiClient } from "@/services/apiClient";

export default function QueueItem({ track, isActive, index, onClick }) {
    const isPlaying = usePlayerStore((s) => s.isPlaying);
    const playNext = usePlayerStore((s) => s.playNext);
    const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);
    const router = useRouter();

    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: `${track?.id || "empty"}-${index}` });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : "auto",
    };

    useEffect(() => {
        if (!menuOpen) return;
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [menuOpen]);

    if (!track) return null;

    const handlePlayNext = (e) => {
        e.stopPropagation();
        playNext(track);
        setMenuOpen(false);
    };

    const handleRemove = (e) => {
        e.stopPropagation();
        removeFromQueue(index);
        setMenuOpen(false);
    };

    const handleGoToAlbum = (e) => {
        e.stopPropagation();
        setMenuOpen(false);
        if (track.albumId) router.push(`/albums/${track.albumId}`);
    };

    const handleGoToArtist = (e) => {
        e.stopPropagation();
        setMenuOpen(false);
        if (track.artistId) router.push(`/artists/${track.artistId}`);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={onClick}
            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors group ${
                isActive ? "bg-[#1a3a27]" : "hover:bg-[#1f1f1f]"
            }`}
        >
            {/* DRAG HANDLE */}
            <div
                {...attributes}
                {...listeners}
                className="shrink-0 text-[#B3B3B3] hover:text-white cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity text-xs select-none px-1"
                onClick={(e) => e.stopPropagation()}
            >
                ⠿
            </div>

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

            {/* CONTEXT MENU */}
            <div className="relative shrink-0" ref={menuRef}>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen((v) => !v);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-[#B3B3B3] hover:text-white text-lg leading-none px-1"
                >
                    ⋯
                </button>

                {menuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-44 bg-[#282828] rounded-lg shadow-xl z-50 py-1">
                        <button
                            onClick={handlePlayNext}
                            className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#383838] transition"
                        >
                            Play Next
                        </button>
                        <button
                            onClick={handleRemove}
                            className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#383838] transition"
                        >
                            Remove from Queue
                        </button>
                        <div className="border-t border-white/10 my-1" />
                        {track.albumId && (
                            <button
                                onClick={handleGoToAlbum}
                                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#383838] transition"
                            >
                                Go to Album
                            </button>
                        )}
                        {track.artistId && (
                            <button
                                onClick={handleGoToArtist}
                                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#383838] transition"
                            >
                                Go to Artist
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* RIGHT — equalizer or index */}
            <div className="shrink-0 w-8 flex justify-center">
                {isActive ? (
                    <NowPlayingBar isPlaying={isPlaying} />
                ) : (
                    <span className="text-xs text-[#B3B3B3]">{index + 1}</span>
                )}
            </div>
        </div>
    );
}
