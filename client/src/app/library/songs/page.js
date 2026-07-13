"use client";

import { useEffect, useRef, useState } from "react";
import useAuthStore from "@/store/authStore";
import { usePlayerStore } from "@/store/playerStore";
import { trackService } from "@/services/trackService";
import SongRow from "@/components/SongRow";
import LoadingState from "@/components/ui/LoadingState";
import EmptyState from "@/components/ui/EmptyState";

export default function SongsPage() {
    const user = useAuthStore((s) => s.user);
    const setQueue = usePlayerStore((s) => s.setQueue);

    const [songs, setSongs] = useState([]);
    const [offset, setOffset] = useState(0);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const loaderRef = useRef(null);
    const isFetchingRef = useRef(false);

    useEffect(() => {
        async function load() {
            if (!user || isFetchingRef.current || !hasMore) return;
            isFetchingRef.current = true;
            setLoading(true);

            try {
                const data = await trackService.getTracks(offset);

                if (data.length < 50) setHasMore(false);
                setSongs((prev) => [...prev, ...data]);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
                isFetchingRef.current = false;
            }
        }

        load();
    }, [user, offset]);

    useEffect(() => {
        if (!loaderRef.current) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !loading && hasMore && !isFetchingRef.current) {
                    setOffset((prev) => prev + 50);
                }
            },
            { threshold: 0.5 }
        );
        observer.observe(loaderRef.current);
        return () => observer.disconnect();
    }, [loading, hasMore]);

    return (
        <main className="px-6 pt-8 pb-10">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-white">All Songs</h1>
                {songs.length > 0 && (
                    <p className="text-sm text-[#B3B3B3]">{songs.length} songs</p>
                )}
            </div>

            {songs.length === 0 && !loading && (
                <EmptyState icon="🎵" title="No songs found" />
            )}

            <div className="space-y-1">
                {songs.map((song, index) => (
                    <SongRow
                        key={`${song.id}-${index}`}
                        song={song}
                        index={index}
                        showIndex
                        showAlbum
                        onPlay={() => setQueue(songs, index)}
                    />
                ))}
            </div>

            <div ref={loaderRef} className="h-16 flex items-center justify-center">
                {loading && <LoadingState message="Loading more songs..." />}
                {!hasMore && songs.length > 0 && (
                    <p className="text-xs text-[#B3B3B3]">
                        All {songs.length} songs loaded
                    </p>
                )}
            </div>
        </main>
    );
}
