"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import usePlaylistStore from "@/store/playlistStore";
import { usePlayerStore } from "@/store/playerStore";
import SongRow from "@/components/SongRow";
import EmptyState from "@/components/ui/EmptyState";

export default function PlaylistDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { getPlaylist, removeTrack, renamePlaylist, deletePlaylist } =
        usePlaylistStore();
    const setQueue = usePlayerStore((s) => s.setQueue);

    const playlist = getPlaylist(id);

    const [editing, setEditing] = useState(false);
    const [nameInput, setNameInput] = useState("");

    if (!playlist) {
        return (
            <EmptyState
                icon="😕"
                title="Playlist not found"
                subtitle="It may have been deleted"
            />
        );
    }

    const handleRename = () => {
        const name = nameInput.trim();
        if (name) renamePlaylist(id, name);
        setEditing(false);
    };

    const handleDelete = () => {
        if (confirm(`Delete "${playlist.name}"?`)) {
            deletePlaylist(id);
            router.push("/playlists");
        }
    };

    const totalDuration = playlist.tracks.reduce(
        (acc, t) => acc + (t.duration || 0),
        0
    );

    return (
        <main className="pb-10">
            {/* HERO */}
            <div
                className="px-6 pt-10 pb-6"
                style={{
                    background: "linear-gradient(180deg, #2a1a4a 0%, #121212 100%)",
                }}
            >
                <div className="flex flex-col md:flex-row gap-6 items-end">
                    {/* COVER (mosaic or placeholder) */}
                    <div className="w-48 h-48 rounded-xl bg-[#282828] flex items-center justify-center shrink-0 overflow-hidden shadow-2xl">
                        {playlist.tracks.length > 0 ? (
                            <div className="grid grid-cols-2 w-full h-full">
                                {playlist.tracks.slice(0, 4).map((t, i) => (
                                    <img
                                        key={i}
                                        src={t.cover}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                ))}
                            </div>
                        ) : (
                            <span className="text-6xl">🎵</span>
                        )}
                    </div>

                    <div>
                        <p className="text-xs font-bold uppercase text-[#B3B3B3] mb-1">
                            Playlist
                        </p>

                        {editing ? (
                            <div className="flex gap-2 items-center mb-2">
                                <input
                                    autoFocus
                                    value={nameInput}
                                    onChange={(e) => setNameInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleRename();
                                        if (e.key === "Escape") setEditing(false);
                                    }}
                                    className="bg-[#383838] text-white px-3 py-1.5 rounded-lg text-2xl font-bold outline-none focus:ring-2 focus:ring-[#1db954]"
                                />
                                <button
                                    onClick={handleRename}
                                    className="bg-[#1db954] text-black font-bold px-4 py-1.5 rounded-lg text-sm"
                                >
                                    Save
                                </button>
                            </div>
                        ) : (
                            <h1
                                onClick={() => {
                                    setNameInput(playlist.name);
                                    setEditing(true);
                                }}
                                className="text-4xl md:text-5xl font-black text-white leading-tight mb-2 cursor-pointer hover:opacity-80 transition-opacity"
                                title="Click to rename"
                            >
                                {playlist.name}
                            </h1>
                        )}

                        <p className="text-[#B3B3B3] text-sm">
                            {playlist.tracks.length}{" "}
                            {playlist.tracks.length === 1 ? "song" : "songs"}
                            {totalDuration > 0 && (
                                <>
                                    {" "}
                                    &bull;{" "}
                                    {Math.floor(totalDuration / 60)} min
                                </>
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {/* ACTION ROW */}
            <div className="flex items-center gap-4 px-6 py-5">
                {playlist.tracks.length > 0 && (
                    <button
                        onClick={() => setQueue(playlist.tracks, 0)}
                        className="bg-[#1db954] hover:bg-[#1ed760] text-black font-bold px-8 py-3 rounded-full transition-colors flex items-center gap-2"
                    >
                        ▶ Play
                    </button>
                )}
                <button
                    onClick={handleDelete}
                    className="text-[#B3B3B3] hover:text-red-400 font-medium text-sm transition-colors"
                >
                    🗑 Delete playlist
                </button>
            </div>

            {/* SONG LIST */}
            <div className="px-3">
                {playlist.tracks.length === 0 ? (
                    <EmptyState
                        icon="🎵"
                        title="No songs yet"
                        subtitle='Find songs and add them using the "⋯" menu'
                    />
                ) : (
                    <div className="space-y-1">
                        {playlist.tracks.map((song, index) => (
                            <div key={`${song.id}-${index}`} className="group relative">
                                <SongRow
                                    song={song}
                                    index={index}
                                    showIndex
                                    contextMenu={false}
                                    onPlay={() => setQueue(playlist.tracks, index)}
                                />
                                <button
                                    onClick={() => removeTrack(id, song.id)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-[#B3B3B3] hover:text-red-400 text-xs px-2 py-1 rounded transition"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
