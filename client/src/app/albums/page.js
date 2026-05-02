"use client";

import { useEffect, useRef } from "react";
import useAuthStore from "@/store/authStore";
import useLibraryStore from "@/store/libraryStore";
import { fetchAlbums } from "@/services/navidromeService";
import { useRouter } from "next/navigation";
import { normalizeAlbums } from "@/utils/normalizeAlbums";

export default function AlbumsPage() {
    const user = useAuthStore((state) => state.user);
    const router = useRouter();

    const loadMoreRef = useRef(null);
    const isFetchingRef = useRef(false); // ✅ CRITICAL FIX

    const {
        albums,
        loading,
        offset,
        setAlbums,
        appendAlbums,
        setLoading,
        nextPage
    } = useLibraryStore();

    // ================= FETCH =================
    useEffect(() => {
        async function loadAlbums() {
            if (!user) return;

            if (isFetchingRef.current) return; // ✅ prevent duplicate calls
            isFetchingRef.current = true;

            setLoading(true);

            try {
                const rawData = await fetchAlbums(user, offset);
                const normalizedData = normalizeAlbums(rawData);

                if (offset === 0) {
                    setAlbums(normalizedData);
                } else {
                    appendAlbums(normalizedData);
                }
            } catch (error) {
                console.error("Failed to fetch albums:", error);
            } finally {
                setLoading(false);
                isFetchingRef.current = false; // ✅ release lock
            }
        }

        loadAlbums();
    }, [user, offset]);

    // ================= OBSERVER =================
    useEffect(() => {
        if (!loadMoreRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];

                if (
                    entry.isIntersecting &&
                    !loading &&
                    !isFetchingRef.current
                ) {
                    nextPage();
                }
            },
            {
                threshold: 0.5 // ✅ less aggressive
            }
        );

        observer.observe(loadMoreRef.current);

        return () => {
            observer.disconnect();
        };
    }, [loading, nextPage]);

    return (
        <main className="p-6">
            <h1 className="text-3xl mb-6">Albums</h1>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {albums.map((album) => (
                    <div
                        key={album.id} // ✅ FIXED KEY (important)
                        className="bg-[#181818] hover:bg-[#282828] transition rounded-xl p-4 cursor-pointer"
                        onClick={() => router.push(`/albums/${album.id}`)}
                    >
                        <img
                            src={`${user.serverUrl}/rest/getCoverArt.view?id=${album.id}&u=${encodeURIComponent(
                                user.username
                            )}&s=${user.salt}&t=${user.token}&v=1.16.1&c=binksconnect`}
                            alt={album.name}
                            className="w-full aspect-square object-cover rounded-lg mb-3"
                        />

                        <p className="font-semibold truncate">
                            {album.name}
                        </p>

                        <p className="text-sm text-[#B3B3B3] truncate">
                            {album.artist}
                        </p>
                    </div>
                ))}
            </div>

            <div
                ref={loadMoreRef}
                className="h-20 flex justify-center items-center"
            >
                {loading && (
                    <p className="text-[#B3B3B3]">
                        Loading more albums...
                    </p>
                )}
            </div>
        </main>
    );
}