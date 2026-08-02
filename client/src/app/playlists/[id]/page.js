"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import usePlaylistStore from "@/store/playlistStore";
import { usePlayerStore } from "@/store/playerStore";
import { trackService } from "@/services/trackService";
import { searchService } from "@/services/searchService";
import { apiClient } from "@/services/apiClient";
import SongRow from "@/components/SongRow";
import EmptyState from "@/components/ui/EmptyState";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableTrackRow({ song, index, onPlay, onRemove }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: song.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : "auto",
    };

    return (
        <div ref={setNodeRef} style={style} className="group relative">
            <div className="flex items-center">
                <div
                    {...attributes}
                    {...listeners}
                    className="shrink-0 text-[#B3B3B3] hover:text-white cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity text-xs select-none px-2"
                >
                    ⠿
                </div>
                <div className="flex-1">
                    <SongRow
                        song={song}
                        index={index}
                        showIndex
                        contextMenu={false}
                        onPlay={onPlay}
                    />
                </div>
                <button
                    onClick={() => onRemove(song.id)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-[#B3B3B3] hover:text-red-400 text-xs px-2 py-1 rounded transition mr-3"
                >
                    Remove
                </button>
            </div>
        </div>
    );
}

function PlaylistBuilderPanel({ playlist, onAddTrack, onRemoveTrack }) {
    const [query, setQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all"); // "all" | "starred" | "random"
    const [songs, setSongs] = useState([]);
    const [starredSongs, setStarredSongs] = useState([]);
    const [randomSongs, setRandomSongs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [lastAddedTrack, setLastAddedTrack] = useState(null);
    const [similarTracks, setSimilarTracks] = useState([]);
    const [loadingSimilar, setLoadingSimilar] = useState(false);
    const [addingAll, setAddingAll] = useState(false);

    const setQueue = usePlayerStore((s) => s.setQueue);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        Promise.all([
            trackService.getTracks(0),
            trackService.getStarred().catch(() => ({ songs: [] })),
            trackService.getRandom(12).catch(() => []),
        ]).then(([tracksRes, starredRes, randomRes]) => {
            if (isMounted) {
                setSongs(Array.isArray(tracksRes) ? tracksRes : tracksRes.songs || []);
                setStarredSongs(starredRes.songs || []);
                setRandomSongs(randomRes || []);
                setLoading(false);
            }
        }).catch(() => {
            if (isMounted) setLoading(false);
        });
        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        let isMounted = true;
        if (!query.trim()) {
            if (activeTab === "all") {
                trackService.getTracks(0).then((res) => {
                    if (isMounted) setSongs(Array.isArray(res) ? res : res.songs || []);
                }).catch(() => {});
            }
            return;
        }

        setLoading(true);
        const timer = setTimeout(() => {
            searchService.search(query).then((res) => {
                if (isMounted) {
                    setSongs(res.songs || []);
                    setLoading(false);
                }
            }).catch(() => {
                if (isMounted) setLoading(false);
            });
        }, 250);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [query, activeTab]);

    const handleToggleTrack = async (song) => {
        const inPlaylist = playlist.tracks.some((t) => t.id === song.id);
        if (inPlaylist) {
            onRemoveTrack(playlist.id, song.id);
        } else {
            onAddTrack(playlist.id, song);
            setLastAddedTrack(song);

            setLoadingSimilar(true);
            try {
                const similar = await trackService.getSimilar(song.id);
                setSimilarTracks(similar || []);
            } catch (err) {
                console.error("Failed to fetch similar tracks:", err);
            } finally {
                setLoadingSimilar(false);
            }
        }
    };

    const handleAddAllSimilar = async () => {
        setAddingAll(true);
        try {
            const unadded = similarTracks.filter((s) => !isInPlaylist(s.id));
            for (const simSong of unadded) {
                await onAddTrack(playlist.id, simSong);
            }
        } catch (err) {
            console.error("Failed to add all similar tracks:", err);
        } finally {
            setAddingAll(false);
        }
    };

    const isInPlaylist = (songId) => playlist.tracks.some((t) => t.id === songId);

    const getDisplayedSongs = () => {
        if (query.trim()) return songs;
        if (activeTab === "starred") return starredSongs;
        if (activeTab === "random") return randomSongs;
        return songs;
    };

    const displayedSongs = getDisplayedSongs();
    const unaddedSimilarCount = similarTracks.filter((s) => !isInPlaylist(s.id)).length;

    return (
        <div className="mt-6 bg-[#181818]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl animate-fade-in">
            {/* BUILDER HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black text-white flex items-center gap-2">
                            <span>✨ Playlist Builder</span>
                        </h2>
                        <span className="text-xs bg-[#1db954]/20 text-[#1db954] border border-[#1db954]/30 px-3 py-1 rounded-full font-bold">
                            {playlist.tracks.length} {playlist.tracks.length === 1 ? "song" : "songs"} in playlist
                        </span>
                    </div>
                    <p className="text-xs text-[#B3B3B3] mt-1">
                        Build your playlist seamlessly. Search or filter below, click <span className="text-[#1db954] font-bold">➕ Add</span>, and recommended similar songs & vibes will pop up instantly!
                    </p>
                </div>
            </div>

            {/* CONTROLS & FILTER PILLS */}
            <div className="space-y-4 mb-6">
                {/* SEARCH INPUT */}
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-[#B3B3B3]">🔍</span>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search tracks by title, artist, album or genre..."
                        className="w-full pl-12 pr-10 py-3.5 bg-[#242424] text-white rounded-xl outline-none focus:ring-2 focus:ring-[#1db954] transition text-sm placeholder-[#7a7a7a]"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery("")}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#B3B3B3] hover:text-white"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* FILTER TABS */}
                {!query && (
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                        <button
                            onClick={() => setActiveTab("all")}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                                activeTab === "all"
                                    ? "bg-white text-black shadow-md"
                                    : "bg-[#282828] hover:bg-[#383838] text-[#B3B3B3] hover:text-white"
                            }`}
                        >
                            🔥 All Library ({songs.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("starred")}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                                activeTab === "starred"
                                    ? "bg-white text-black shadow-md"
                                    : "bg-[#282828] hover:bg-[#383838] text-[#B3B3B3] hover:text-white"
                            }`}
                        >
                            ⭐ Favorites ({starredSongs.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("random")}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                                activeTab === "random"
                                    ? "bg-white text-black shadow-md"
                                    : "bg-[#282828] hover:bg-[#383838] text-[#B3B3B3] hover:text-white"
                            }`}
                        >
                            🔀 Recommended Mix ({randomSongs.length})
                        </button>
                    </div>
                )}
            </div>

            {/* SIMILAR SONGS RECOMMENDATION POPUP DOCK */}
            {lastAddedTrack && (
                <div className="mb-8 bg-gradient-to-r from-emerald-950/70 via-stone-900/95 to-purple-950/70 border border-[#1db954]/50 rounded-2xl p-5 shadow-2xl animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-[#1db954]/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2.5">
                            <span className="text-lg">⚡</span>
                            <div>
                                <h3 className="text-sm font-extrabold text-white">
                                    Recommended Additions (Similar to <span className="text-[#1db954]">&quot;{lastAddedTrack.title}&quot;</span>)
                                </h3>
                                <p className="text-[11px] text-[#B3B3B3]">
                                    Handpicked tracks from the same album, same artist, and matching vibes.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {unaddedSimilarCount > 0 && (
                                <button
                                    onClick={handleAddAllSimilar}
                                    disabled={addingAll}
                                    className="bg-[#1db954] hover:bg-[#1ed760] text-black text-xs font-extrabold px-3.5 py-1.5 rounded-full shadow-lg transition hover:scale-105 cursor-pointer disabled:opacity-50"
                                >
                                    {addingAll ? "Adding..." : `➕ Add All (${unaddedSimilarCount})`}
                                </button>
                            )}
                            <button
                                onClick={() => { setLastAddedTrack(null); setSimilarTracks([]); }}
                                className="text-xs text-[#B3B3B3] hover:text-white px-2 py-1 cursor-pointer"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>

                    {loadingSimilar ? (
                        <p className="text-xs text-[#B3B3B3] py-2">Finding similar songs, artists & vibes...</p>
                    ) : similarTracks.length === 0 ? (
                        <p className="text-xs text-[#B3B3B3] py-2">No additional recommendations found for this track.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 relative z-10">
                            {similarTracks.map((simSong) => {
                                const added = isInPlaylist(simSong.id);
                                return (
                                    <div
                                        key={`sim-${simSong.id}`}
                                        className={`flex items-center justify-between p-2.5 rounded-xl border transition group ${
                                            added
                                                ? "bg-[#1a3a27]/60 border-[#1db954]/40"
                                                : "bg-black/60 hover:bg-black/90 border-white/10"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0 pr-2">
                                            <div className="relative shrink-0 group/cover">
                                                <img
                                                    src={apiClient.resolveUrl(simSong.cover)}
                                                    alt={simSong.title}
                                                    className="w-10 h-10 rounded-lg object-cover shadow"
                                                />
                                                <button
                                                    onClick={() => setQueue([simSong], 0)}
                                                    className="absolute inset-0 bg-black/60 rounded-lg opacity-0 group-hover/cover:opacity-100 flex items-center justify-center text-white text-xs transition"
                                                    title="Preview song"
                                                >
                                                    ▶
                                                </button>
                                            </div>

                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-white truncate">
                                                    {simSong.title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <p className="text-[11px] text-[#B3B3B3] truncate">
                                                        {simSong.artist}
                                                    </p>
                                                    {simSong.similarityReason && (
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1db954]/20 text-[#1db954] border border-[#1db954]/30 font-semibold shrink-0">
                                                            {simSong.similarityReason}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleToggleTrack(simSong)}
                                            className={`shrink-0 px-3 py-1 rounded-full text-xs font-extrabold transition cursor-pointer flex items-center gap-1 ${
                                                added
                                                    ? "bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/30"
                                                    : "bg-[#1db954] hover:bg-[#1ed760] text-black shadow-md hover:scale-105"
                                            }`}
                                            title={added ? "Remove from playlist" : "Add to playlist"}
                                        >
                                            <span>{added ? "➖" : "➕"}</span>
                                            <span>{added ? "Added" : "Add"}</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* SONG LIST */}
            <div className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-extrabold uppercase text-[#B3B3B3] tracking-wider">
                        {query ? `Search Results for "${query}"` : activeTab === "starred" ? "Favorite Songs" : activeTab === "random" ? "Recommended Discovery Mix" : "All Library Songs"}
                    </h3>
                    <span className="text-xs text-[#B3B3B3]">Showing {displayedSongs.length} tracks</span>
                </div>

                {loading ? (
                    <div className="py-8 text-center text-sm text-[#B3B3B3]">
                        <p className="animate-pulse">Loading tracks...</p>
                    </div>
                ) : displayedSongs.length === 0 ? (
                    <div className="py-8 text-center text-sm text-[#B3B3B3] bg-[#202020] rounded-xl border border-white/5">
                        <p>No songs found for this selection.</p>
                    </div>
                ) : (
                    displayedSongs.map((song) => {
                        const added = isInPlaylist(song.id);
                        return (
                            <div
                                key={song.id}
                                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition group ${
                                    added
                                        ? "bg-[#1a3a27]/50 border-[#1db954]/40 shadow-sm"
                                        : "bg-[#202020] hover:bg-[#282828] border-white/5"
                                }`}
                            >
                                <div className="flex items-center gap-3.5 min-w-0 pr-4">
                                    <div className="relative shrink-0 group/cover">
                                        <img
                                            src={apiClient.resolveUrl(song.cover)}
                                            alt={song.title}
                                            className="w-11 h-11 rounded-lg object-cover shrink-0 shadow-md"
                                        />
                                        <button
                                            onClick={() => setQueue([song], 0)}
                                            className="absolute inset-0 bg-black/60 rounded-lg opacity-0 group-hover/cover:opacity-100 flex items-center justify-center text-white text-xs transition"
                                            title="Preview song"
                                        >
                                            ▶
                                        </button>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-white truncate">
                                                {song.title}
                                            </p>
                                            {added && (
                                                <span className="text-[10px] bg-[#1db954]/20 text-[#1db954] px-1.5 py-0.5 rounded font-bold">
                                                    In Playlist
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-[#B3B3B3] truncate mt-0.5">
                                            {song.artist} &bull; {song.album || "Single"}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleToggleTrack(song)}
                                    className={`shrink-0 px-4 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold transition cursor-pointer ${
                                        added
                                            ? "bg-red-500/15 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                                            : "bg-[#1db954] hover:bg-[#1ed760] text-black shadow-md hover:scale-105"
                                    }`}
                                    title={added ? "Remove from playlist" : "Add to playlist"}
                                >
                                    <span>{added ? "➖" : "➕"}</span>
                                    <span>{added ? "Remove" : "Add"}</span>
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export default function PlaylistDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { getPlaylist, addTrack, removeTrack, renamePlaylist, deletePlaylist, reorderTracks } =
        usePlaylistStore();
    const setQueue = usePlayerStore((s) => s.setQueue);

    const playlist = getPlaylist(id);

    const [editing, setEditing] = useState(false);
    const [nameInput, setNameInput] = useState("");
    const [isBuilding, setIsBuilding] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const handleDragEnd = useCallback(
        (event) => {
            const { active, over } = event;
            if (!over || active.id === over.id || !playlist) return;
            const oldIndex = playlist.tracks.findIndex((t) => t.id === active.id);
            const newIndex = playlist.tracks.findIndex((t) => t.id === over.id);
            if (oldIndex === -1 || newIndex === -1) return;

            const newTrackIds = playlist.tracks.map((t) => t.id);
            const [moved] = newTrackIds.splice(oldIndex, 1);
            newTrackIds.splice(newIndex, 0, moved);
            reorderTracks(id, newTrackIds);
        },
        [playlist, id, reorderTracks]
    );

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
        <main className="pb-10 px-4 sm:px-6">
            {/* HERO */}
            <div
                className="pt-10 pb-6 rounded-2xl mb-4 px-6"
                style={{
                    background: "linear-gradient(180deg, #2a1a4a 0%, #121212 100%)",
                }}
            >
                <div className="flex flex-col md:flex-row gap-6 items-end">
                    {/* COVER */}
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
                                    className="bg-[#1db954] text-black font-bold px-4 py-1.5 rounded-lg text-sm cursor-pointer"
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
            <div className="flex flex-wrap items-center gap-3 py-3">
                {playlist.tracks.length > 0 && (
                    <button
                        onClick={() => setQueue(playlist.tracks, 0)}
                        className="bg-[#1db954] hover:bg-[#1ed760] text-black font-bold px-8 py-3 rounded-full transition-colors flex items-center gap-2 cursor-pointer"
                    >
                        ▶ Play
                    </button>
                )}
                <button
                    onClick={() => setIsBuilding(!isBuilding)}
                    className={`px-5 py-3 rounded-full font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
                        isBuilding
                            ? "bg-[#1db954] text-black shadow-lg"
                            : "bg-[#282828] hover:bg-[#383838] text-white border border-white/10"
                    }`}
                >
                    <span>✨</span>
                    <span>{isBuilding ? "Close Builder" : "Build / Add Songs"}</span>
                </button>
                <button
                    onClick={handleDelete}
                    className="text-[#B3B3B3] hover:text-red-400 font-medium text-sm transition-colors ml-auto cursor-pointer"
                >
                    🗑 Delete playlist
                </button>
            </div>

            {/* PLAYLIST BUILDER PANEL */}
            {isBuilding && (
                <PlaylistBuilderPanel
                    playlist={playlist}
                    onAddTrack={addTrack}
                    onRemoveTrack={removeTrack}
                />
            )}

            {/* SONG LIST */}
            <div className="mt-6">
                <h2 className="text-xl font-bold text-white mb-4">Playlist Tracks</h2>
                {playlist.tracks.length === 0 ? (
                    <EmptyState
                        icon="🎵"
                        title="No songs yet"
                        subtitle='Click "✨ Build / Add Songs" above to search and add tracks!'
                    />
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={playlist.tracks.map((t) => t.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-1">
                                {playlist.tracks.map((song, index) => (
                                    <SortableTrackRow
                                        key={song.id}
                                        song={song}
                                        index={index}
                                        onPlay={() => setQueue(playlist.tracks, index)}
                                        onRemove={(trackId) => removeTrack(id, trackId)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>
        </main>
    );
}
