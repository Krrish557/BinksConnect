"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import useAuthStore from "@/store/authStore";
import { usePlayerStore } from "@/store/playerStore";
import { fetchAlbumTracks } from "@/services/navidromeService";

export default function AlbumDetailPage() {
    const { id } = useParams();

    const user = useAuthStore((state) => state.user);
    const setQueue = usePlayerStore((state) => state.setQueue);

    const [album, setAlbum] = useState(null);
    const [songs, setSongs] = useState([]);

    // ================= FETCH ALBUM =================
    useEffect(() => {
        async function loadAlbum() {
            if (!user || !id) return;

            try {
                const data = await fetchAlbumTracks(user, id);

                if (!data) return;

                setAlbum(data);

                const formattedSongs = data.song.map((song) => ({
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

                setSongs(formattedSongs);
            } catch (err) {
                console.error(err);
            }
        }

        loadAlbum();
    }, [user, id]);

    // ================= PLAY FUNCTIONS =================
    const playAlbum = () => {
        if (songs.length === 0) return;
        setQueue(songs, 0);
    };

    const playSong = (index) => {
        setQueue(songs, index);
    };

    if (!album) {
        return (
            <div className="p-6 text-gray-400">
                Loading album...
            </div>
        );
    }

    return (
        <main className="p-6">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row gap-6 mb-8">

                <img
                    src={`${user.serverUrl}/rest/getCoverArt.view?id=${album.id}&u=${encodeURIComponent(
                        user.username
                    )}&s=${user.salt}&t=${user.token}&v=1.16.1&c=binksconnect`}
                    alt={album.name}
                    className="w-48 h-48 rounded-lg object-cover"
                />

                <div className="flex flex-col justify-end">
                    <p className="text-sm text-gray-400">Album</p>
                    <h1 className="text-4xl font-bold">{album.name}</h1>
                    <p className="text-gray-400 mt-2">{album.artist}</p>

                    <button
                        onClick={playAlbum}
                        className="mt-4 bg-green-500 hover:bg-green-600 px-6 py-2 rounded-full w-fit"
                    >
                        ▶ Play
                    </button>
                </div>
            </div>

            {/* SONG LIST */}
            <div className="space-y-2">
                {songs.map((song, index) => (
                    <div
                        key={song.id}
                        onClick={() => playSong(index)}
                        className="flex items-center gap-4 p-2 rounded-lg hover:bg-[#282828] cursor-pointer transition"
                    >
                        <img
                            src={song.cover}
                            alt={song.title}
                            className="w-10 h-10 rounded-md object-cover"
                        />

                        <div className="flex flex-col flex-1 overflow-hidden">
                            <p className="font-medium truncate">
                                {song.title}
                            </p>
                            <p className="text-sm text-gray-400 truncate">
                                {song.artist}
                            </p>
                        </div>

                        <span className="text-gray-400 text-sm">
                            {index + 1}
                        </span>
                    </div>
                ))}
            </div>
        </main>
    );
}