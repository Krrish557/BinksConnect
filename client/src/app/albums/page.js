"use client";

import { useEffect, useRef } from "react";
import useAuthStore from "@/store/authStore";
import useLibraryStore from "@/store/libraryStore";
import { fetchAlbums } from "@/services/navidromeService";
import { useRouter } from "next/navigation";
import { normalizeAlbums } from "@/utils/normalizeAlbums";

export default function AlbumsPage() {
    const user = useAuthStore((state) => state.user);

    const loadMoreRef = useRef(null);
    const router = useRouter();

    const {
        albums,
        loading,
        offset,
        setAlbums,
        appendAlbums,
        setLoading,
        nextPage
    } = useLibraryStore();

    // ✅ FETCH + NORMALIZE (FIXED)
    useEffect(() => {
        async function loadAlbums() {
            if (!user) return;

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
            }
        }

        loadAlbums();
    }, [user, offset]);

    // ✅ INFINITE SCROLL OBSERVER
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loading) {
                    nextPage();
                }
            },
            {
                threshold: 1
            }
        );

        const currentRef = loadMoreRef.current;

        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
            observer.disconnect();
        };
    }, [loading, nextPage]);

    return (
        <main>
            <h1 className="text-3xl mb-6">Albums</h1>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {albums.map((album) => (
                    <div
                        key={`${album.name}-${album.artist}`} // ✅ FIXED KEY
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
                className="h-16 flex justify-center items-center"
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