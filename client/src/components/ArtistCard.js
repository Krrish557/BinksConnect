"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/services/apiClient";
import { favouriteService } from "@/services/favouriteService";

export default function ArtistCard({ artist }) {
    const router = useRouter();
    const coverUrl = artist.coverArt ? apiClient.resolveUrl(artist.coverArt) : null;
    const [isFavorited, setIsFavorited] = useState(false);

    useEffect(() => {
        favouriteService.checkFavoriteArtists([artist.id]).then((res) => {
            setIsFavorited(!!res.favorited[artist.id]);
        }).catch(() => {});
    }, [artist.id]);

    const handleToggleFavorite = async (e) => {
        e.stopPropagation();
        try {
            const res = await favouriteService.toggleFavoriteArtist(artist.id);
            setIsFavorited(res.isFavorited);
        } catch (err) {
            console.error("Toggle favourite artist error:", err);
        }
    };

    return (
        <div
            onClick={() => router.push(`/artists/${artist.id}`)}
            className="flex flex-col items-center cursor-pointer group shrink-0 w-36 p-3 rounded-xl hover:bg-[#282828] transition-colors relative"
        >
            <button
                onClick={handleToggleFavorite}
                className={`absolute top-2 right-2 z-10 text-lg transition-all opacity-0 group-hover:opacity-100 ${
                    isFavorited ? "text-[#1db954] opacity-100" : "text-[#B3B3B3] hover:text-white"
                }`}
            >
                {isFavorited ? "♥" : "♡"}
            </button>
            <div className="w-28 h-28 rounded-full overflow-hidden bg-[#282828] mb-3 shadow-lg">
                {coverUrl ? (
                    <img
                        src={coverUrl}
                        alt={artist.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                        👤
                    </div>
                )}
            </div>
            <p className="font-semibold text-sm text-white text-center truncate w-full">
                {artist.name}
            </p>
            <p className="text-xs text-[#B3B3B3] mt-0.5">Artist</p>
        </div>
    );
}
