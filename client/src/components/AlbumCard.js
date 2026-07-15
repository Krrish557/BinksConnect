"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/services/apiClient";
import { favouriteService } from "@/services/favouriteService";

export default function AlbumCard({ album, onClick }) {
    const router = useRouter();
    const handleClick = onClick || (() => router.push(`/albums/${album.id}`));
    const coverUrl = apiClient.resolveUrl(album.coverUrl);
    const [isFavorited, setIsFavorited] = useState(false);

    useEffect(() => {
        favouriteService.checkFavoriteAlbums([album.id]).then((res) => {
            setIsFavorited(!!res.favorited[album.id]);
        }).catch(() => {});
    }, [album.id]);

    const handleToggleFavorite = async (e) => {
        e.stopPropagation();
        try {
            const res = await favouriteService.toggleFavoriteAlbum(album.id);
            setIsFavorited(res.isFavorited);
        } catch (err) {
            console.error("Toggle favourite album error:", err);
        }
    };

    return (
        <div
            onClick={handleClick}
            className="bg-[#181818] hover:bg-[#282828] transition-colors rounded-xl p-4 cursor-pointer group shrink-0 w-44 relative"
        >
            <button
                onClick={handleToggleFavorite}
                className={`absolute top-5 right-5 z-10 text-lg transition-all opacity-0 group-hover:opacity-100 ${
                    isFavorited ? "text-[#1db954] opacity-100" : "text-[#B3B3B3] hover:text-white"
                }`}
            >
                {isFavorited ? "♥" : "♡"}
            </button>
            <div className="relative">
                <img
                    src={coverUrl}
                    alt={album.name}
                    className="w-full aspect-square object-cover rounded-lg mb-3 shadow-lg"
                />
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleClick();
                    }}
                    className="absolute bottom-5 right-2 bg-[#1db954] text-black w-10 h-10 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200"
                >
                    ▶
                </button>
            </div>

            <p className="font-semibold truncate text-sm text-white">
                {album.name}
            </p>
            <p className="text-xs text-[#B3B3B3] truncate mt-0.5">
                {album.artist}
            </p>
        </div>
    );
}
