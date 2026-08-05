"use client";

import { useEffect, useRef, useState } from "react";
import useAuthStore from "@/store/authStore";
import { usePlayerStore } from "@/store/playerStore";
import { trackService } from "@/services/trackService";
import { cacheService } from "@/services/cacheService";
import SongRow from "@/components/SongRow";
import LoadingState from "@/components/ui/LoadingState";
import EmptyState from "@/components/ui/EmptyState";

export default function SongsPage() {
    const user = useAuthStore((s) => s.user);
    const setQueue = usePlayerStore((s) => s.setQueue);

    const [songs, setSongs] = useState(() => cacheService.get("tracks_0")?.data || []);
    const [offset, setOffset] = useState(0);
    const [loading, setLoading] = useState(() => !cacheService.get("tracks_0")?.data);
    const [hasMore, setHasMore] = useState(true);

    const loaderRef = useRef(null);
    const isFetchingRef = useRef(false);

    useEffect(() => {
        async function load() {
            if (!user || isFetchingRef.current || !hasMore) return;
            isFetchingRef.current = true;
            if (songs.length === 0) setLoading(true);

            try {
                const data = await trackService.getTracks(offset);

                if (data.length < 50) setHasMore(false);
                if (offset === 0) {
                    setSongs(data);
                } else {
                    setSongs((prev) => [...prev, ...data]);
                }
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
        <main className="px-4 sm:px-6 pt-6 sm:pt-8 pb-24 sm:pb-10">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="v-heading text-2xl sm:text-3xl font-black tracking-tight">All Songs</h1>
                    <p className="text-xs text-[#94866B] mt-0.5">Your complete track library</p>
                </div>
                {songs.length > 0 && (
                    <span className="text-xs font-semibold bg-[#262B2C] text-[#94866B] px-3 py-1 rounded-full border border-[#D8C8A0]/10">
                        {songs.length} songs
                    </span>
                )}
            </div>

            {songs.length === 0 && !loading && (
                <EmptyState icon="🎵" title="No songs found" />
            )}

            {loading && songs.length === 0 ? (
                <LoadingState message="Loading your song library..." />
            ) : (
                <div className="space-y-1 animate-fade-in">
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
            )}

            <div ref={loaderRef} className="h-16 flex items-center justify-center mt-2">
                {loading && songs.length > 0 && <LoadingState message="Loading more songs..." />}
                {!hasMore && songs.length > 0 && (
                    <p className="text-xs text-[#94866B]">
                        All {songs.length} songs loaded
                    </p>
                )}
            </div>
        </main>
    );
}
