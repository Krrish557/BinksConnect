"use client";

import { useEffect, useRef, useState } from "react";
import useAuthStore from "@/store/authStore";
import { usePlayerStore } from "@/store/playerStore";
import { fetchSongs } from "@/services/navidromeService";

export default function SongsPage() {
    const user = useAuthStore((state) => state.user);
    const setQueue = usePlayerStore((state) => state.setQueue);

    const [songs, setSongs] = useState([]);
    const [offset, setOffset] = useState(0);
    const [loading, setLoading] = useState(false);

    const loaderRef = useRef(null);
    const isFetchingRef = useRef(false);

    // ================= FETCH SONGS =================
    useEffect(() => {
        async function loadSongs() {
            if (!user) return;
            if (isFetchingRef.current) return;

            isFetchingRef.current = true;
            setLoading(true);

            try {
                const data = await fetchSongs(user, offset);

                const formatted = data.map((song) => ({
                    id: song.id,
                    title: song.title,
                    artist: song.artist,
                    cover: `${user.serverUrl}/rest/getCoverArt.view?id=${song.albumId}&u=${encodeURIComponent(
                        user.username
                    )}&s=${user.salt}&t=${user.token}&v=1.16.1&c=binksconnect`,
                    url:
                        `${user.serverUrl}/rest/stream.view` +
                        `?id=${song.id}` +
                        `&u=${user.username}` +
                        `&s=${user.salt}` +
                        `&t=${user.token}` +
                        `&v=1.16.1&c=binksconnect`,
                }));

                setSongs((prev) => [...prev, ...formatted]);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
                isFetchingRef.current = false;
            }
        }

        loadSongs();
    }, [user, offset]);

    // ================= OBSERVER =================
    useEffect(() => {
        if (!loaderRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];

                if (
                    entry.isIntersecting &&
                    !loading &&
                    !isFetchingRef.current
                ) {
                    setOffset((prev) => prev + 50); // 🔥 pagination step
                }
            },
            { threshold: 0.5 }
        );

        observer.observe(loaderRef.current);

        return () => observer.disconnect();
    }, [loading]);

    const playSong = (index) => {
        setQueue(songs, index);
    };

    return (
        <main className="p-6">
            <h1 className="text-3xl mb-6">All Songs</h1>

            <div className="space-y-2">
                {songs.map((song, index) => (
                    <div
                        key={`${song.id}-${index}`}
                        onClick={() => playSong(index)}
                        className="flex items-center gap-4 p-2 rounded-lg hover:bg-[#282828] cursor-pointer transition"
                    >
                        {/* COVER */}
                        <img
                            src={song.cover}
                            alt={song.title}
                            className="w-12 h-12 rounded-md object-cover bg-[#181818]"
                        />

                        {/* TEXT */}
                        <div className="flex flex-col flex-1 overflow-hidden">
                            <p className="font-medium truncate">
                                {song.title}
                            </p>
                            <p className="text-sm text-gray-400 truncate">
                                {song.artist}
                            </p>
                        </div>

                        <div className="text-gray-400 text-sm">▶</div>
                    </div>
                ))}
            </div>

            {/* LOADER */}
            <div
                ref={loaderRef}
                className="h-20 flex items-center justify-center"
            >
                {loading && (
                    <p className="text-gray-400">Loading more songs...</p>
                )}
            </div>
        </main>
    );
}