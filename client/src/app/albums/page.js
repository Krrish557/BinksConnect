"use client";

import { useEffect, useRef } from "react";
import useAuthStore from "@/store/authStore";
import useLibraryStore from "@/store/libraryStore";
import { musicEngine } from "@/core/engine";
import { normalizeAlbums } from "@/utils/normalizeAlbums";
import AlbumCard from "@/components/AlbumCard";
import LoadingState from "@/components/ui/LoadingState";

export default function AlbumsPage() {
    const user = useAuthStore((s) => s.user);

    const isFetchingRef = useRef(false);

    const {
        albums,
        loading,
        offset,
        setAlbums,
        appendAlbums,
        setLoading,
        nextPage,
    } = useLibraryStore();

    const loadMoreRef = useRef(null);

    useEffect(() => {
        async function load() {
            if (!user || isFetchingRef.current) return;
            isFetchingRef.current = true;
            setLoading(true);
            try {
                const normalized = await musicEngine.getAlbums(offset);
                offset === 0 ? setAlbums(normalized) : appendAlbums(normalized);
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
        if (!loadMoreRef.current) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !loading && !isFetchingRef.current) {
                    nextPage();
                }
            },
            { threshold: 0.5 }
        );
        observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [loading, nextPage]);

    return (
        <main className="px-6 pt-8 pb-10">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-white">Albums</h1>
                {albums.length > 0 && (
                    <p className="text-sm text-[#B3B3B3]">{albums.length} albums</p>
                )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {albums.map((album) => (
                    <AlbumCard
                        key={album.id}
                        album={album}
                        coverUrl={album.coverUrl}
                    />
                ))}
            </div>

            <div ref={loadMoreRef} className="h-16 flex items-center justify-center mt-4">
                {loading && <LoadingState message="Loading more albums..." />}
            </div>
        </main>
    );
}
