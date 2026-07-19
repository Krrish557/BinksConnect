"use client";

import { useEffect, useState } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { albumService } from "@/services/albumService";
import { trackService } from "@/services/trackService";
import { apiClient } from "@/services/apiClient";
import HorizontalScroller from "@/components/HorizontalScroller";
import AlbumCard from "@/components/AlbumCard";
import ArtistCard from "@/components/ArtistCard";
import SongRow from "@/components/SongRow";
import LoadingState from "@/components/ui/LoadingState";

export default function HomePage() {
    const { setQueue, recentlyPlayed } = usePlayerStore();

    const [recentAlbums, setRecentAlbums] = useState([]);
    const [newestAlbums, setNewestAlbums] = useState([]);
    const [frequentAlbums, setFrequentAlbums] = useState([]);
    const [starredAlbums, setStarredAlbums] = useState([]);
    const [starredArtists, setStarredArtists] = useState([]);
    const [randomSongs, setRandomSongs] = useState([]);
    const [loading, setLoading] = useState(true);

    const hour = new Date().getHours();
    const greeting =
        hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const [recent, newest, frequent, starred, random] =
                    await Promise.all([
                        albumService.getRecent(12),
                        albumService.getNewest(12),
                        albumService.getFrequent(12),
                        trackService.getStarred(),
                        trackService.getRandom(10),
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
    }, []);

    const playSong = (index) => setQueue(randomSongs, index);

    if (loading) return <LoadingState message="Loading your music..." />;

    return (
        <main className="px-6 pt-8 pb-10">
            <h1 className="text-3xl font-bold text-white mb-8">{greeting}</h1>

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

            {randomSongs.length > 0 && (
                <section className="mb-10">
                    <h2 className="text-xl font-bold text-white mb-4">
                        Discover
                    </h2>
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
