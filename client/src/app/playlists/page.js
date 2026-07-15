"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import usePlaylistStore from "@/store/playlistStore";
import { smartPlaylistService } from "@/services/smartPlaylistService";
import { usePlayerStore } from "@/store/playerStore";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import SongRow from "@/components/SongRow";

const SMART_PLAYLIST_TYPES = [
    { value: "most_played", label: "Most Played" },
    { value: "recently_added", label: "Recently Added" },
    { value: "frequently_played", label: "Frequently Played" },
    { value: "forgotten_gems", label: "Forgotten Gems" },
    { value: "random", label: "Random Mix" },
];

export default function PlaylistsPage() {
    const router = useRouter();
    const { playlists, createPlaylist, deletePlaylist, loadPlaylists, _loaded } = usePlaylistStore();
    const setQueue = usePlayerStore((s) => s.setQueue);

    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const [smartPlaylists, setSmartPlaylists] = useState([]);
    const [creatingSmart, setCreatingSmart] = useState(false);
    const [smartName, setSmartName] = useState("");
    const [smartType, setSmartType] = useState("most_played");
    const [expandedSmart, setExpandedSmart] = useState(null);
    const [smartTracks, setSmartTracks] = useState([]);

    useEffect(() => {
        loadPlaylists();
        smartPlaylistService.getSmartPlaylists()
            .then((sp) => setSmartPlaylists(sp))
            .catch((err) => console.error("Load smart playlists error:", err));
    }, []);

    const handleCreate = async () => {
        const name = newName.trim() || "New Playlist";
        const id = await createPlaylist(name);
        setNewName("");
        setCreating(false);
        if (id) router.push(`/playlists/${id}`);
    };

    const handleCreateSmart = async () => {
        const name = smartName.trim() || SMART_PLAYLIST_TYPES.find((t) => t.value === smartType)?.label || "Smart Playlist";
        try {
            await smartPlaylistService.createSmartPlaylist(name, smartType, 50);
            setSmartName("");
            setCreatingSmart(false);
            smartPlaylistService.getSmartPlaylists()
                .then((sp) => setSmartPlaylists(sp))
                .catch(() => {});
        } catch (err) {
            console.error("Create smart playlist error:", err);
        }
    };

    const handleExpandSmart = async (sp) => {
        if (expandedSmart === sp.id) {
            setExpandedSmart(null);
            setSmartTracks([]);
            return;
        }
        try {
            const result = await smartPlaylistService.getSmartPlaylist(sp.id);
            setExpandedSmart(sp.id);
            setSmartTracks(result.tracks || []);
        } catch (err) {
            console.error("Load smart playlist error:", err);
        }
    };

    const handleDeleteSmart = async (e, sp) => {
        e.stopPropagation();
        if (confirm(`Delete "${sp.name}"?`)) {
            await smartPlaylistService.deleteSmartPlaylist(sp.id);
            smartPlaylistService.getSmartPlaylists()
                .then((sp) => setSmartPlaylists(sp))
                .catch(() => {});
            if (expandedSmart === sp.id) {
                setExpandedSmart(null);
                setSmartTracks([]);
            }
        }
    };

    if (!_loaded) return <LoadingState message="Loading playlists..." />;

    return (
        <main className="px-6 pt-8 pb-10">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-white">Your Playlists</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => { setCreatingSmart(true); setCreating(false); }}
                        className="bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-2.5 rounded-full text-sm transition-colors"
                    >
                        + Smart Playlist
                    </button>
                    <button
                        onClick={() => { setCreating(true); setCreatingSmart(false); }}
                        className="bg-[#1db954] hover:bg-[#1ed760] text-black font-bold px-5 py-2.5 rounded-full text-sm transition-colors"
                    >
                        + New Playlist
                    </button>
                </div>
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

            {/* SMART PLAYLIST CREATE FORM */}
            {creatingSmart && (
                <div className="bg-[#282828] rounded-xl p-5 mb-6 space-y-3">
                    <div className="flex gap-3 items-center">
                        <input
                            type="text"
                            autoFocus
                            value={smartName}
                            onChange={(e) => setSmartName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleCreateSmart();
                                if (e.key === "Escape") setCreatingSmart(false);
                            }}
                            placeholder="Smart playlist name..."
                            className="flex-1 bg-[#383838] text-white px-4 py-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1db954] transition"
                        />
                        <select
                            value={smartType}
                            onChange={(e) => setSmartType(e.target.value)}
                            className="bg-[#383838] text-white px-4 py-2.5 rounded-lg text-sm outline-none"
                        >
                            {SMART_PLAYLIST_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleCreateSmart}
                            className="bg-[#1db954] hover:bg-[#1ed760] text-black font-bold px-5 py-2.5 rounded-lg text-sm transition"
                        >
                            Create
                        </button>
                        <button
                            onClick={() => setCreatingSmart(false)}
                            className="text-[#B3B3B3] hover:text-white px-3 py-2.5 text-sm transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* SMART PLAYLISTS */}
            {smartPlaylists.length > 0 && (
                <section className="mb-8">
                    <h2 className="text-xl font-bold text-white mb-3">Smart Playlists</h2>
                    <div className="space-y-2">
                        {smartPlaylists.map((sp) => (
                            <div key={sp.id}>
                                <div
                                    onClick={() => handleExpandSmart(sp)}
                                    className="flex items-center gap-4 p-4 bg-[#181818] hover:bg-[#282828] rounded-xl cursor-pointer transition-colors group"
                                >
                                    <div className="w-14 h-14 rounded-lg bg-[#282828] flex items-center justify-center text-2xl shrink-0">
                                        ⚡
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-white truncate">{sp.name}</p>
                                        <p className="text-xs text-[#B3B3B3] mt-0.5">
                                            {SMART_PLAYLIST_TYPES.find((t) => t.value === sp.ruleType)?.label || sp.ruleType}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteSmart(e, sp)}
                                        className="opacity-0 group-hover:opacity-100 text-[#B3B3B3] hover:text-red-400 text-sm px-2 py-1 rounded transition"
                                    >
                                        🗑
                                    </button>
                                </div>
                                {expandedSmart === sp.id && smartTracks.length > 0 && (
                                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-white/10 pl-2">
                                        {smartTracks.slice(0, 10).map((track, i) => (
                                            <SongRow
                                                key={track.id}
                                                song={track}
                                                index={i}
                                                showIndex
                                                onPlay={() => setQueue(smartTracks, i)}
                                            />
                                        ))}
                                        {smartTracks.length > 10 && (
                                            <p className="text-xs text-[#B3B3B3] pl-3 py-1">
                                                + {smartTracks.length - 10} more songs
                                            </p>
                                        )}
                                    </div>
                                )}
                                {expandedSmart === sp.id && smartTracks.length === 0 && (
                                    <p className="text-sm text-[#B3B3B3] pl-6 py-2">
                                        No tracks match this rule yet
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* EMPTY */}
            {playlists.length === 0 && smartPlaylists.length === 0 && !creating && !creatingSmart && (
                <EmptyState
                    icon="📁"
                    title="No playlists yet"
                    subtitle='Click "New Playlist" to create your first one'
                />
            )}

            {/* LIST */}
            {playlists.length > 0 && (
                <section>
                    <h2 className="text-xl font-bold text-white mb-3">Your Playlists</h2>
                    <div className="space-y-2">
                        {playlists.map((playlist) => (
                            <div
                                key={playlist.id}
                                onClick={() => router.push(`/playlists/${playlist.id}`)}
                                className="flex items-center gap-4 p-4 bg-[#181818] hover:bg-[#282828] rounded-xl cursor-pointer transition-colors group"
                                >
                                {/* PLACEHOLDER COVER */}
                                <div className="w-14 h-14 rounded-lg bg-[#282828] flex items-center justify-center text-2xl shrink-0">
                                    {playlist.tracks && playlist.tracks[0] ? (
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
                                        {playlist.tracks ? playlist.tracks.length : playlist.trackCount || 0}{" "}
                                        {(playlist.tracks ? playlist.tracks.length : playlist.trackCount || 0) === 1 ? "song" : "songs"}
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
                </section>
            )}
        </main>
    );
}
