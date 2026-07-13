"use client";

import { useRouter } from "next/navigation";

export default function ArtistCard({ artist, coverUrl }) {
    const router = useRouter();

    return (
        <div
            onClick={() => router.push(`/artists/${artist.id}`)}
            className="flex flex-col items-center cursor-pointer group shrink-0 w-36 p-3 rounded-xl hover:bg-[#282828] transition-colors"
        >
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
