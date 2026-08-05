"use client";

import { useEffect, useState } from "react";
import { usePlayerStore } from "@/store/playerStore";
import useAuthStore from "@/store/authStore";
import { albumService } from "@/services/albumService";
import { trackService } from "@/services/trackService";
import { cacheService } from "@/services/cacheService";
import { apiClient } from "@/services/apiClient";
import HorizontalScroller from "@/components/HorizontalScroller";
import AlbumCard from "@/components/AlbumCard";
import ArtistCard from "@/components/ArtistCard";
import SongRow from "@/components/SongRow";
import LoadingState from "@/components/ui/LoadingState";
import MarketOverview from "@/components/MarketOverview";

export default function HomePage() {
    const { setQueue, recentlyPlayed, setShuffle } = usePlayerStore();
    const { isInitializing, init } = useAuthStore();

    const [recentAlbums, setRecentAlbums] = useState(() => cacheService.get("albums_recent_12")?.data || []);
    const [newestAlbums, setNewestAlbums] = useState(() => cacheService.get("albums_newest_12")?.data || []);
    const [frequentAlbums, setFrequentAlbums] = useState(() => cacheService.get("albums_frequent_12")?.data || []);
    const [starredAlbums, setStarredAlbums] = useState(() => cacheService.get("tracks_starred")?.data?.albums || []);
    const [starredArtists, setStarredArtists] = useState(() => cacheService.get("tracks_starred")?.data?.artists || []);
    const [randomSongs, setRandomSongs] = useState(() => cacheService.get("tracks_random_12")?.data || []);
    const [loading, setLoading] = useState(() => !cacheService.get("albums_recent_12")?.data);
    const [refreshingRecs, setRefreshingRecs] = useState(false);

    useEffect(() => {
        init();
    }, [init]);

    useEffect(() => {
        if (isInitializing) return;

        async function load() {
            if (recentAlbums.length === 0) setLoading(true);
            try {
                const [recent, newest, frequent, starred, random] =
                    await Promise.all([
                        albumService.getRecent(12),
                        albumService.getNewest(12),
                        albumService.getFrequent(12),
                        trackService.getStarred(),
                        trackService.getRandom(12),
                    ]);

                setRecentAlbums(recent);
                setNewestAlbums(newest);
                setFrequentAlbums(frequent);
                setStarredAlbums(starred.albums);
                setStarredArtists(starred.artists);
                setRandomSongs(random);
            } catch (err) {
                console.error("Home load error:", err);
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [isInitializing]);

    const playSong = (index) => setQueue(randomSongs, index);

    const handleShuffleRecommendation = () => {
        if (!randomSongs || randomSongs.length === 0) return;
        const shuffled = [...randomSongs].sort(() => Math.random() - 0.5);
        setShuffle(true);
        setQueue(shuffled, 0);
    };

    const handleRefreshRecommendations = async () => {
        setRefreshingRecs(true);
        try {
            const fresh = await trackService.getRandom(12);
            setRandomSongs(fresh);
        } catch (err) {
            console.error("Failed to refresh recommendations:", err);
        } finally {
            setRefreshingRecs(false);
        }
    };

    if (loading) return <LoadingState message="Loading your music..." />;

    return (
        <main className="px-6 pt-8 pb-10">
            {/* SHUFFLE RECOMMENDATION HERO */}
            <section className="mb-10 bg-gradient-to-r from-emerald-950/70 via-stone-900/90 to-indigo-950/70 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#1db954]/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-2 max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1db954]/15 border border-[#1db954]/30 text-[#1db954] text-xs font-semibold uppercase tracking-wider">
                            <span>🔀 Quick Mix</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                            Shuffle Recommendations
                        </h2>
                        <p className="text-sm text-[#B3B3B3]">
                            Discover an instant, randomized mix of tracks recommended directly from your library.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <button
                            onClick={handleShuffleRecommendation}
                            disabled={randomSongs.length === 0}
                            className="bg-[#1db954] hover:bg-[#1ed760] disabled:opacity-50 text-black font-bold px-6 py-3 rounded-full flex items-center gap-2.5 shadow-lg hover:scale-105 transition-all cursor-pointer"
                        >
                            <span className="text-lg">🔀</span>
                            <span>Shuffle & Play</span>
                        </button>
                        <button
                            onClick={handleRefreshRecommendations}
                            disabled={refreshingRecs}
                            className="bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-3 rounded-full flex items-center gap-2 border border-white/10 transition-all cursor-pointer"
                            title="Get new recommendations"
                        >
                            <span className={`text-sm ${refreshingRecs ? "animate-spin" : ""}`}>🔄</span>
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>

                {randomSongs.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-3 overflow-x-auto scrollbar-hide">
                        <span className="text-xs font-semibold text-[#B3B3B3] uppercase tracking-wider shrink-0 mr-2">
                            Includes:
                        </span>
                        {randomSongs.slice(0, 6).map((song, i) => (
                            <div
                                key={`rec-preview-${song.id}-${i}`}
                                onClick={() => {
                                    const shuffled = [song, ...randomSongs.filter((s) => s.id !== song.id)];
                                    setShuffle(true);
                                    setQueue(shuffled, 0);
                                }}
                                className="flex items-center gap-2 bg-black/40 hover:bg-black/70 border border-white/5 hover:border-white/20 rounded-lg px-2.5 py-1.5 shrink-0 transition cursor-pointer group"
                            >
                                <img
                                    src={apiClient.resolveUrl(song.cover)}
                                    alt={song.title}
                                    className="w-7 h-7 rounded object-cover"
                                />
                                <span className="text-xs text-white font-medium truncate max-w-[120px]">
                                    {song.title}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* MARKET OVERVIEW SECTION */}
            <MarketOverview />

            {recentlyPlayed.length > 0 && (
                <section className="mb-10">
                    <h2 className="text-xl font-bold text-white mb-4">
                        Recently Played
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {recentlyPlayed.slice(0, 6).map((track, i) => (
                            <button
                                key={`${track.id}-${i}`}
                                onClick={() => {
                                    setQueue(recentlyPlayed, i);
                                }}
                                className="flex items-center gap-3 bg-[#282828] hover:bg-[#383838] rounded-lg overflow-hidden transition-colors group"
                            >
                                <img
                                    src={apiClient.resolveUrl(track.cover)}
                                    alt={track.title}
                                    className="w-16 h-16 object-cover shrink-0"
                                />
                                <p className="font-semibold text-sm text-white truncate pr-3">
                                    {track.title}
                                </p>
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {randomSongs.length > 0 && (
                <section className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white">
                            Recommended For You
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleShuffleRecommendation}
                                className="text-xs bg-[#282828] hover:bg-[#383838] text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 transition font-semibold"
                            >
                                <span>🔀</span> Shuffle Play
                            </button>
                            <button
                                onClick={handleRefreshRecommendations}
                                disabled={refreshingRecs}
                                className="text-xs bg-[#282828] hover:bg-[#383838] text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 transition font-semibold"
                            >
                                <span className={refreshingRecs ? "animate-spin" : ""}>🔄</span> Refresh
                            </button>
                        </div>
                    </div>
                    <div className="space-y-1">
                        {randomSongs.map((song, i) => (
                            <SongRow
                                key={song.id}
                                song={song}
                                index={i}
                                showIndex
                                onPlay={() => playSong(i)}
                            />
                        ))}
                    </div>
                </section>
            )}

            {recentAlbums.length > 0 && (
                <HorizontalScroller title="Recently Played" seeAllHref="/albums">
                    {recentAlbums.map((album) => (
                        <AlbumCard
                            key={album.id}
                            album={album}
                        />
                    ))}
                </HorizontalScroller>
            )}

            {newestAlbums.length > 0 && (
                <HorizontalScroller title="New Releases" seeAllHref="/albums">
                    {newestAlbums.map((album) => (
                        <AlbumCard
                            key={album.id}
                            album={album}
                        />
                    ))}
                </HorizontalScroller>
            )}

            {starredAlbums.length > 0 && (
                <HorizontalScroller title="Favourite Albums" seeAllHref="/albums">
                    {starredAlbums.map((album) => (
                        <AlbumCard
                            key={album.id}
                            album={album}
                        />
                    ))}
                </HorizontalScroller>
            )}

            {starredArtists.length > 0 && (
                <HorizontalScroller title="Favourite Artists" seeAllHref="/artists">
                    {starredArtists.map((artist) => (
                        <ArtistCard
                            key={artist.id}
                            artist={artist}
                        />
                    ))}
                </HorizontalScroller>
            )}

            {frequentAlbums.length > 0 && (
                <HorizontalScroller title="Most Played" seeAllHref="/albums">
                    {frequentAlbums.map((album) => (
                        <AlbumCard
                            key={album.id}
                            album={album}
                        />
                    ))}
                </HorizontalScroller>
            )}
        </main>
    );
}
