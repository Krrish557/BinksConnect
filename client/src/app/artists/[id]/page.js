"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import useAuthStore from "@/store/authStore";
import { usePlayerStore } from "@/store/playerStore";
import { artistService } from "@/services/artistService";
import { albumService } from "@/services/albumService";
import { apiClient } from "@/services/apiClient";
import AlbumCard from "@/components/AlbumCard";
import SongRow from "@/components/SongRow";
import LoadingState from "@/components/ui/LoadingState";
import HorizontalScroller from "@/components/HorizontalScroller";

export default function ArtistPage() {
    const { id } = useParams();
    const user = useAuthStore((s) => s.user);
    const setQueue = usePlayerStore((s) => s.setQueue);

    const [artist, setArtist] = useState(null);
    const [topSongs, setTopSongs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            if (!user || !id) return;
            setLoading(true);
            try {
                const data = await artistService.getArtist(id);
                setArtist(data);

                if (data?.album?.length > 0) {
                    const firstAlbum = await albumService.getAlbum(
                        data.album[0].id
                    );
                    if (firstAlbum?.songs) {
                        setTopSongs(firstAlbum.songs.slice(0, 5));
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [user, id]);

    if (loading) return <LoadingState message="Loading artist..." />;
    if (!artist) return null;

    return (
        <main className="pb-10">
            <div
                className="px-6 pt-10 pb-6"
                style={{
                    background: "linear-gradient(180deg, #1a2a4a 0%, #121212 100%)",
                }}
            >
                <div className="flex flex-col md:flex-row gap-6 items-end">
                    <div className="w-40 h-40 rounded-full bg-[#282828] flex items-center justify-center text-6xl shrink-0 overflow-hidden shadow-2xl">
                        👤
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase text-[#B3B3B3] mb-1">
                            Artist
                        </p>
                        <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
                            {artist.name}
                        </h1>
                        <p className="text-[#B3B3B3] text-sm mt-2">
                            {artist.albumCount} albums
                        </p>
                    </div>
                </div>
            </div>

            {topSongs.length > 0 && (
                <div className="px-6 py-4">
                    <button
                        onClick={() => setQueue(topSongs, 0)}
                        className="bg-[#1db954] hover:bg-[#1ed760] text-black font-bold px-8 py-3 rounded-full transition-colors"
                    >
                        ▶ Play
                    </button>
                </div>
            )}

            {topSongs.length > 0 && (
                <section className="px-3 mb-8">
                    <h2 className="text-xl font-bold text-white px-3 mb-3">
                        Popular
                    </h2>
                    <div className="space-y-1">
                        {topSongs.map((song, i) => (
                            <SongRow
                                key={song.id}
                                song={song}
                                index={i}
                                showIndex
                                onPlay={() => setQueue(topSongs, i)}
                            />
                        ))}
                    </div>
                </section>
            )}

            {artist.album?.length > 0 && (
                <div className="px-6">
                    <HorizontalScroller title="Albums">
                        {artist.album.map((album) => (
                            <AlbumCard
                                key={album.id}
                                album={album}
                            />
                        ))}
                    </HorizontalScroller>
                </div>
            )}
        </main>
    );
}
