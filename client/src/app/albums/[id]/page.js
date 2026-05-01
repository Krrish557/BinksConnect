"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import useAuthStore from "@/store/authStore";
import { fetchAlbumTracks } from "@/services/navidromeService";

export default function AlbumDetailsPage() {
    const { id } = useParams();
    const user = useAuthStore((state) => state.user);

    const [album, setAlbum] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadAlbum() {
            if (!user) return;

            try {
                const data = await fetchAlbumTracks(user, id);
                setAlbum(data);
            } catch (error) {
                console.error("Album load failed:", error);
            } finally {
                setLoading(false);
            }
        }

        loadAlbum();
    }, [user, id]);

    if (loading) {
        return (
            <main className="p-6">
                <p className="text-zinc-400">
                    Loading album...
                </p>
            </main>
        );
    }

    if (!album) {
        return (
            <main className="p-6">
                <p className="text-red-400">
                    Album not found
                </p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#121212] text-white">
            {/* HERO */}
            <section className="bg-gradient-to-b from-[#3a3a3a] to-[#121212] p-4 md:p-8">
                <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
                    <img
                        src={`${user.serverUrl}/rest/getCoverArt.view?id=${album.id}&u=${encodeURIComponent(
                            user.username
                        )}&s=${user.salt}&t=${user.token}&v=1.16.1&c=binksconnect`}
                        alt={album.name}
                        className="w-40 h-40 md:w-60 md:h-60 object-cover rounded-lg shadow-2xl"
                    />

                    <div className="flex flex-col justify-end">
                        <p className="text-sm uppercase text-zinc-300">
                            Album
                        </p>

                        <h1 className="text-3xl md:text-6xl font-bold leading-tight mt-2">
                            {album.name}
                        </h1>

                        <p className="text-zinc-300 mt-3">
                            {album.artist} • {album.song?.length || 0} songs
                        </p>
                    </div>
                </div>
            </section>

            {/* ACTIONS */}
            <section className="px-4 md:px-8 py-6 flex items-center gap-4">
                <button className="w-14 h-14 rounded-full bg-[#1DB954] text-black text-2xl font-bold flex items-center justify-center hover:scale-105 transition">
                    ▶
                </button>

                <button className="text-zinc-400 hover:text-white">
                    ♡
                </button>
            </section>

            {/* TRACKLIST */}
            <section className="px-4 md:px-8 pb-32">
                <div className="space-y-2">
                    {album.song?.map((song) => (
                        <div
                            key={song.id}
                            className="grid grid-cols-[40px_1fr_60px] items-center px-4 py-3 rounded-lg hover:bg-[#1a1a1a] transition"
                        >
                            <p className="text-zinc-400">
                                {song.track}
                            </p>

                            <div className="min-w-0">
                                <p className="truncate font-medium">
                                    {song.title}
                                </p>

                                <p className="text-sm text-zinc-400 truncate">
                                    {song.artist || album.artist}
                                </p>
                            </div>

                            <p className="text-sm text-zinc-400 text-right">
                                {song.duration
                                    ? `${Math.floor(
                                        song.duration / 60
                                    )}:${String(
                                        song.duration % 60
                                    ).padStart(2, "0")}`
                                    : ""}
                            </p>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}