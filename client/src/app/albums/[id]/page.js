"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import useAuthStore from "@/store/authStore";
import { usePlayerStore } from "@/store/playerStore";
import { albumService } from "@/services/albumService";
import { apiClient } from "@/services/apiClient";
import SongRow from "@/components/SongRow";
import LoadingState from "@/components/ui/LoadingState";
import { formatDuration } from "@/utils/format";

export default function AlbumDetailPage() {
    const { id } = useParams();
    const user = useAuthStore((s) => s.user);
    const setQueue = usePlayerStore((s) => s.setQueue);

    const [album, setAlbum] = useState(null);
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            if (!user || !id) return;
            setLoading(true);
            try {
                const data = await albumService.getAlbum(id);
                if (!data) return;
                setAlbum(data.album);
                setSongs(data.songs);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [user, id]);

    if (loading) return <LoadingState message="Loading album..." />;
    if (!album) return null;

    const totalDuration = songs.reduce((acc, s) => acc + (s.duration || 0), 0);

    return (
        <main className="pb-10">
            <div
                className="relative px-6 pt-10 pb-6"
                style={{
                    background: "linear-gradient(180deg, #1a3a27 0%, #121212 100%)",
                }}
            >
                <div className="flex flex-col md:flex-row gap-6 items-end">
                    <img
                        src={apiClient.resolveUrl(album.coverUrl)}
                        alt={album.name}
                        className="w-48 h-48 rounded-xl object-cover shadow-2xl shrink-0"
                    />
                    <div className="flex flex-col">
                        <p className="text-xs font-bold uppercase text-[#B3B3B3] mb-1">
                            Album
                        </p>
                        <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-2">
                            {album.name}
                        </h1>
                        <p className="text-[#B3B3B3] text-sm">
                            {album.artist} &bull; {album.year} &bull;{" "}
                            {songs.length} songs,{" "}
                            {formatDuration(totalDuration)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 px-6 py-5">
                <button
                    onClick={() => setQueue(songs, 0)}
                    className="bg-[#1db954] hover:bg-[#1ed760] text-black font-bold px-8 py-3 rounded-full transition-colors flex items-center gap-2"
                >
                    ▶ Play
                </button>
                <button
                    onClick={() => {
                        const shuffled = [...songs].sort(() => Math.random() - 0.5);
                        setQueue(shuffled, 0);
                    }}
                    className="border border-[#B3B3B3] hover:border-white text-[#B3B3B3] hover:text-white font-bold px-6 py-3 rounded-full transition-colors text-sm"
                >
                    ⇄ Shuffle
                </button>
            </div>

            <div className="px-3">
                <div className="flex items-center gap-3 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#B3B3B3] border-b border-white/5 mb-2">
                    <div className="w-8 text-center">#</div>
                    <div className="w-10 shrink-0" />
                    <div className="flex-1">Title</div>
                    <div className="hidden md:block w-40 shrink-0">Album</div>
                    <div className="w-16 text-right shrink-0">Duration</div>
                </div>

                <div className="space-y-1">
                    {songs.map((song, index) => (
                        <SongRow
                            key={song.id}
                            song={song}
                            index={index}
                            showIndex
                            onPlay={() => setQueue(songs, index)}
                        />
                    ))}
                </div>
            </div>
        </main>
    );
}
