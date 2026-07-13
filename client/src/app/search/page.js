"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";
import { usePlayerStore } from "@/store/playerStore";
import { musicEngine } from "@/core/engine";
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
    const [results, setResults] = useState(null); // null = no search yet
    const [loading, setLoading] = useState(false);

    const debounceRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Debounced search
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
                const data = await musicEngine.search(query.trim());
                setResults(data);
            } catch (err) {
                console.error("Search error:", err);
            } finally {
                setLoading(false);
            }
        }, 350);

        return () => clearTimeout(debounceRef.current);
    }, [query, user]);

    const playSong = (songs, index) => setQueue(songs, index);

    const hasResults =
        results &&
        (results.songs.length > 0 ||
            results.albums.length > 0 ||
            results.artists.length > 0);

    return (
        <main className="px-6 pt-8 pb-10">
            <h1 className="text-3xl font-bold text-white mb-6">Search</h1>

            {/* SEARCH INPUT */}
            <div className="relative mb-8">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B3B3B3] text-lg">
                    🔍
                </span>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="What do you want to listen to?"
                    className="w-full pl-12 pr-10 py-3.5 rounded-full bg-white text-black placeholder-gray-500 text-sm font-medium outline-none focus:ring-2 focus:ring-[#1db954] transition"
                />
                {query && (
                    <button
                        onClick={() => setQuery("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* LOADING */}
            {loading && <LoadingState message="Searching..." />}

            {/* NO QUERY */}
            {!query && !loading && (
                <EmptyState
                    icon="🎵"
                    title="Search your library"
                    subtitle="Find songs, albums, and artists"
                />
            )}

            {/* NO RESULTS */}
            {!loading && query && results && !hasResults && (
                <EmptyState
                    icon="😕"
                    title={`No results for "${query}"`}
                    subtitle="Try a different search term"
                />
            )}

            {/* RESULTS */}
            {!loading && results && hasResults && (
                <div className="space-y-10">

                    {/* SONGS */}
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

                    {/* ALBUMS */}
                    {results.albums.length > 0 && (
                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">
                                Albums
                            </h2>
                            <div className="flex flex-wrap gap-4">
                                {results.albums.map((album) => (
                                    <AlbumCard
                                        key={album.id}
                                        album={album}
                                        coverUrl={album.coverUrl}
                                        onClick={() =>
                                            router.push(`/albums/${album.id}`)
                                        }
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ARTISTS */}
                    {results.artists.length > 0 && (
                        <section>
                            <h2 className="text-xl font-bold text-white mb-3">
                                Artists
                            </h2>
                            <div className="flex flex-wrap gap-4">
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
