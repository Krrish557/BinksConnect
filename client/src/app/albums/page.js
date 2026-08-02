"use client";

import { useEffect, useRef, useState } from "react";
import useAuthStore from "@/store/authStore";
import useLibraryStore from "@/store/libraryStore";
import { albumService } from "@/services/albumService";
import { cacheService } from "@/services/cacheService";
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

    const [hasLoadedInitial, setHasLoadedInitial] = useState(() => {
        const cached = cacheService.get("albums_0");
        if (cached?.data && albums.length === 0) {
            setAlbums(cached.data);
            return true;
        }
        return albums.length > 0;
    });

    const loadMoreRef = useRef(null);

    useEffect(() => {
        async function load() {
            if (!user || isFetchingRef.current) return;
            isFetchingRef.current = true;
            if (albums.length === 0) setLoading(true);

            try {
                const normalized = await albumService.getAlbums(offset);
                if (offset === 0) {
                    setAlbums(normalized);
                } else {
                    appendAlbums(normalized);
                }
                setHasLoadedInitial(true);
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
        <main className="px-4 sm:px-6 pt-6 sm:pt-8 pb-24 sm:pb-10">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Albums</h1>
                    <p className="text-xs text-[#B3B3B3] mt-0.5">Explore your music collection by album</p>
                </div>
                {albums.length > 0 && (
                    <span className="text-xs font-semibold bg-[#282828] text-[#B3B3B3] px-3 py-1 rounded-full border border-white/5">
                        {albums.length} albums
                    </span>
                )}
            </div>

            {albums.length === 0 && loading ? (
                <LoadingState message="Loading your album collection..." />
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 animate-fade-in">
                    {albums.map((album) => (
                        <AlbumCard
                            key={album.id}
                            album={album}
                        />
                    ))}
                </div>
            )}

            <div ref={loadMoreRef} className="h-16 flex items-center justify-center mt-4">
                {loading && albums.length > 0 && <LoadingState message="Loading more albums..." />}
            </div>
        </main>
    );
}
