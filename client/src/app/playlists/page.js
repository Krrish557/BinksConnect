"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import usePlaylistStore from "@/store/playlistStore";
import EmptyState from "@/components/ui/EmptyState";

export default function PlaylistsPage() {
    const router = useRouter();
    const { playlists, createPlaylist, deletePlaylist } = usePlaylistStore();

    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState("");

    const handleCreate = () => {
        const name = newName.trim() || "New Playlist";
        const id = createPlaylist(name);
        setNewName("");
        setCreating(false);
        router.push(`/playlists/${id}`);
    };

    return (
        <main className="px-6 pt-8 pb-10">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-white">Your Playlists</h1>
                <button
                    onClick={() => setCreating(true)}
                    className="bg-[#1db954] hover:bg-[#1ed760] text-black font-bold px-5 py-2.5 rounded-full text-sm transition-colors"
                >
                    + New Playlist
                </button>
            </div>

            {/* CREATE FORM */}
            {creating && (
                <div className="bg-[#282828] rounded-xl p-5 mb-6 flex gap-3 items-center">
                    <input
                        type="text"
                        autoFocus
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleCreate();
                            if (e.key === "Escape") setCreating(false);
                        }}
                        placeholder="Playlist name..."
                        className="flex-1 bg-[#383838] text-white px-4 py-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1db954] transition"
                    />
                    <button
                        onClick={handleCreate}
                        className="bg-[#1db954] hover:bg-[#1ed760] text-black font-bold px-5 py-2.5 rounded-lg text-sm transition"
                    >
                        Create
                    </button>
                    <button
                        onClick={() => setCreating(false)}
                        className="text-[#B3B3B3] hover:text-white px-3 py-2.5 text-sm transition"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* EMPTY */}
            {playlists.length === 0 && !creating && (
                <EmptyState
                    icon="📁"
                    title="No playlists yet"
                    subtitle='Click "New Playlist" to create your first one'
                />
            )}

            {/* LIST */}
            <div className="space-y-2">
                {playlists.map((playlist) => (
                    <div
                        key={playlist.id}
                        onClick={() => router.push(`/playlists/${playlist.id}`)}
                        className="flex items-center gap-4 p-4 bg-[#181818] hover:bg-[#282828] rounded-xl cursor-pointer transition-colors group"
                    >
                        {/* PLACEHOLDER COVER */}
                        <div className="w-14 h-14 rounded-lg bg-[#282828] flex items-center justify-center text-2xl shrink-0">
                            {playlist.tracks[0] ? (
                                <img
                                    src={playlist.tracks[0].cover}
                                    alt=""
                                    className="w-full h-full rounded-lg object-cover"
                                />
                            ) : (
                                "🎵"
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate">
                                {playlist.name}
                            </p>
                            <p className="text-xs text-[#B3B3B3] mt-0.5">
                                {playlist.tracks.length}{" "}
                                {playlist.tracks.length === 1 ? "song" : "songs"}
                            </p>
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete "${playlist.name}"?`)) {
                                    deletePlaylist(playlist.id);
                                }
                            }}
                            className="opacity-0 group-hover:opacity-100 text-[#B3B3B3] hover:text-red-400 text-sm px-2 py-1 rounded transition"
                        >
                            🗑
                        </button>
                    </div>
                ))}
            </div>
        </main>
    );
}
