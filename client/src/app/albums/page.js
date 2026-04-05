"use client";

import { useEffect, useRef } from "react";
import useAuthStore from "@/store/authStore";
import useLibraryStore from "@/store/libraryStore";
import { fetchAlbums } from "@/services/navidromeService";

export default function AlbumsPage() {
    const user = useAuthStore((state) => state.user);

    const loadMoreRef = useRef(null);

    const {
        albums,
        loading,
        offset,
        setAlbums,
        appendAlbums,
        setLoading,
        nextPage
    } = useLibraryStore();

    useEffect(() => {
        async function loadAlbums() {
            if (!user) return;

            setLoading(true);

            const data = await fetchAlbums(
                user,
                offset
            );

            if (offset === 0) {
                setAlbums(data);
            } else {
                appendAlbums(data);
            }

            setLoading(false);
        }

        loadAlbums();
    }, [user, offset]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (
                    entries[0].isIntersecting &&
                    !loading
                ) {
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
            <h1 className="text-3xl mb-6">
                Albums
            </h1>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {albums.map((album) => (
                    <div
                        key={album.id}
                        className="bg-[#181818] hover:bg-[#282828] transition rounded-xl p-4 cursor-pointer"
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