"use client";

import { usePlayerStore } from "@/store/playerStore";
import NowPlayingBar from "@/components/ui/NowPlayingBar";
import { formatTime } from "@/utils/format";
import usePlaylistStore from "@/store/playlistStore";
import { useState, useRef } from "react";

export default function SongRow({
    song,
    index,
    showIndex = false,
    showAlbum = false,
    onPlay,
    contextMenu = true,
}) {
    const currentTrack = usePlayerStore((s) => s.currentTrack);
    const isPlaying = usePlayerStore((s) => s.isPlaying);
    const playlists = usePlaylistStore((s) => s.playlists);
    const addTrack = usePlaylistStore((s) => s.addTrack);

    const isActive = currentTrack?.id === song.id;

    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const handleClick = () => {
        if (onPlay) onPlay();
    };

    const handleAddToPlaylist = (e, playlistId) => {
        e.stopPropagation();
        addTrack(playlistId, song);
        setMenuOpen(false);
    };

    return (
        <div
            onClick={handleClick}
            className={`group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors relative
                ${isActive ? "bg-[#1a3a27]" : "hover:bg-[#282828]"}`}
        >
            {/* INDEX / NOW PLAYING INDICATOR */}
            <div className="w-8 flex justify-center shrink-0">
                {isActive ? (
                    <NowPlayingBar isPlaying={isPlaying} />
                ) : showIndex ? (
                    <span className="text-sm text-[#B3B3B3] group-hover:hidden">
                        {index + 1}
                    </span>
                ) : null}
                {!isActive && (
                    <span className="text-sm text-white hidden group-hover:inline">
                        ▶
                    </span>
                )}
            </div>

            {/* COVER */}
            <img
                src={song.cover}
                alt={song.title}
                className="w-10 h-10 rounded-md object-cover bg-[#282828] shrink-0"
            />

            {/* TITLE + ARTIST */}
            <div className="flex flex-col flex-1 overflow-hidden min-w-0">
                <p
                    className={`font-medium truncate text-sm ${
                        isActive ? "text-[#1db954]" : "text-white"
                    }`}
                >
                    {song.title}
                </p>
                <p className="text-xs text-[#B3B3B3] truncate">{song.artist}</p>
            </div>

            {/* ALBUM (optional) */}
            {showAlbum && (
                <p className="hidden md:block text-xs text-[#B3B3B3] truncate w-40 shrink-0">
                    {song.album}
                </p>
            )}

            {/* DURATION + CONTEXT MENU */}
            <div className="flex items-center gap-3 shrink-0 ml-2">
                <span className="text-xs text-[#B3B3B3]">
                    {formatTime(song.duration)}
                </span>

                {contextMenu && playlists.length > 0 && (
                    <div className="relative" ref={menuRef}>
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
                            <div className="absolute right-0 bottom-full mb-1 w-48 bg-[#282828] rounded-lg shadow-xl z-50 py-1">
                                <p className="text-xs text-[#B3B3B3] px-3 py-1">
                                    Add to playlist
                                </p>
                                {playlists.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={(e) =>
                                            handleAddToPlaylist(e, p.id)
                                        }
                                        className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#383838] transition"
                                    >
                                        {p.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
