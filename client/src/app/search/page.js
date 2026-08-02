"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";
import { usePlayerStore } from "@/store/playerStore";
import { searchService } from "@/services/searchService";
import { searchHistoryService } from "@/services/searchHistoryService";
import SongRow from "@/components/SongRow";
import AlbumCard from "@/components/AlbumCard";
import ArtistCard from "@/components/ArtistCard";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";

export default function SearchPage() {
    const user = useAuthStore((s) => s.user);
    const router = useRouter();
    const { setQueue } = usePlayerStore();

    const [query, setQuery] = useState("");
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchHistory, setSearchHistory] = useState([]);

    const debounceRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
        setSearchHistory(searchHistoryService.getHistory());
    }, []);

    useEffect(() => {
        if (!query.trim()) {
            setResults(null);
            return;
        }

        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            if (!user) return;
            setLoading(true);
            try {
                const data = await searchService.search(query.trim());
                setResults(data);
                const updated = searchHistoryService.addSearch(query.trim());
                setSearchHistory(updated);
            } catch (err) {
                console.error("Search error:", err);
            } finally {
                setLoading(false);
            }
        }, 350);

        return () => clearTimeout(debounceRef.current);
    }, [query, user]);

    const handleSelectHistory = (historyItem) => {
        setQuery(historyItem);
        const updated = searchHistoryService.addSearch(historyItem);
        setSearchHistory(updated);
    };

    const handleRemoveHistoryItem = (e, item) => {
        e.stopPropagation();
        const updated = searchHistoryService.removeSearch(item);
        setSearchHistory(updated);
    };

    const handleClearHistory = () => {
        const updated = searchHistoryService.clearHistory();
        setSearchHistory(updated);
    };

    const playSong = (songs, index) => setQueue(songs, index);

    const hasResults =
        results &&
        (results.songs.length > 0 ||
            results.albums.length > 0 ||
            results.artists.length > 0);

    return (
        <main className="px-4 sm:px-6 pt-6 sm:pt-8 pb-24 sm:pb-10">
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-6 tracking-tight">Search</h1>

            <div className="relative mb-6">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B3B3B3] text-lg">
                    🔍
                </span>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="What do you want to listen to?"
                    className="w-full pl-12 pr-10 py-3.5 rounded-full bg-[#242424] text-white placeholder-[#7a7a7a] text-sm font-medium outline-none focus:ring-2 focus:ring-[#1db954] transition border border-white/5"
                />
                {query && (
                    <button
                        onClick={() => setQuery("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B3B3B3] hover:text-white"
                    >
                        ✕
                    </button>
                )}
            </div>

            {!query && searchHistory.length > 0 && (
                <div className="mb-8 animate-fade-in">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-bold uppercase text-[#B3B3B3] tracking-wider flex items-center gap-2">
                            <span>🕒</span>
                            <span>Recent Searches</span>
                        </h2>
                        <button
                            onClick={handleClearHistory}
                            className="text-xs text-[#B3B3B3] hover:text-red-400 font-medium transition cursor-pointer"
                        >
                            Clear all
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {searchHistory.map((item) => (
                            <div
                                key={item}
                                onClick={() => handleSelectHistory(item)}
                                className="group flex items-center gap-2 px-3.5 py-2 bg-[#202020] hover:bg-[#2a2a2a] text-white rounded-full border border-white/5 text-xs font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm"
                            >
                                <span className="text-[#B3B3B3] group-hover:text-[#1db954] transition-colors">🕒</span>
                                <span>{item}</span>
                                <button
                                    onClick={(e) => handleRemoveHistoryItem(e, item)}
                                    className="text-[#B3B3B3] hover:text-white ml-1 p-0.5 rounded-full hover:bg-white/10"
                                    title="Remove from history"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {loading && <LoadingState message="Searching..." />}

            {!query && !loading && (
                <EmptyState
                    icon="🎵"
                    title="Search your library"
                    subtitle="Find songs, albums, and artists"
                />
            )}

            {!loading && query && results && !hasResults && (
                <EmptyState
                    icon="😕"
                    title={`No results for "${query}"`}
                    subtitle="Try a different search term"
                />
            )}

            {!loading && results && hasResults && (
                <div className="space-y-10 animate-fade-in">
                    {results.songs.length > 0 && (
                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">
                                Songs
                            </h2>
                            <div className="space-y-1">
                                {results.songs.map((song, i) => (
                                    <SongRow
                                        key={song.id}
                                        song={song}
                                        index={i}
                                        showAlbum
                                        onPlay={() => playSong(results.songs, i)}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {results.albums.length > 0 && (
                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">
                                Albums
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                                {results.albums.map((album) => (
                                    <AlbumCard
                                        key={album.id}
                                        album={album}
                                        onClick={() =>
                                            router.push(`/albums/${album.id}`)
                                        }
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {results.artists.length > 0 && (
                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">
                                Artists
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                                {results.artists.map((artist) => (
                                    <ArtistCard
                                        key={artist.id}
                                        artist={artist}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </main>
    );
}
