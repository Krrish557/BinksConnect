"use client";

import { useEffect, useState } from "react";
import useAuthStore from "@/store/authStore";
import { usePlayerStore } from "@/store/playerStore";
import { musicEngine } from "@/core/engine";
import SongRow from "@/components/SongRow";
import LoadingState from "@/components/ui/LoadingState";
import EmptyState from "@/components/ui/EmptyState";

export default function FavouriteSongsPage() {
    const user = useAuthStore((s) => s.user);
    const setQueue = usePlayerStore((s) => s.setQueue);

    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            if (!user) return;
            setLoading(true);
            try {
                const data = await musicEngine.getStarredItems();
                setSongs(data.songs);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [user]);

    if (loading) return <LoadingState message="Loading favourites..." />;

    return (
        <main className="px-6 pt-8 pb-10">
            <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl">❤️</div>
                <div>
                    <h1 className="text-3xl font-bold text-white">Liked Songs</h1>
                    <p className="text-sm text-[#B3B3B3] mt-0.5">
                        {songs.length} songs
                    </p>
                </div>
            </div>

            {songs.length > 0 && (
                <button
                    onClick={() => setQueue(songs, 0)}
                    className="bg-[#1db954] hover:bg-[#1ed760] text-black font-bold px-8 py-3 rounded-full transition-colors mb-6 flex items-center gap-2"
                >
                    ▶ Play All
                </button>
            )}

            {songs.length === 0 ? (
                <EmptyState
                    icon="❤️"
                    title="No liked songs yet"
                    subtitle="Star songs to see them here"
                />
            ) : (
                <div className="space-y-1">
                    {songs.map((song, i) => (
                        <SongRow
                            key={song.id}
                            song={song}
                            index={i}
                            showIndex
                            showAlbum
                            onPlay={() => setQueue(songs, i)}
                        />
                    ))}
                </div>
            )}
        </main>
    );
}
