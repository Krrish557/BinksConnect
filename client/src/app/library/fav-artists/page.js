"use client";

import { useEffect, useState } from "react";
import useAuthStore from "@/store/authStore";
import { musicEngine } from "@/core/engine";
import ArtistCard from "@/components/ArtistCard";
import LoadingState from "@/components/ui/LoadingState";
import EmptyState from "@/components/ui/EmptyState";

export default function FavouriteArtistsPage() {
    const user = useAuthStore((s) => s.user);

    const [artists, setArtists] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            if (!user) return;
            setLoading(true);
            try {
                const data = await musicEngine.getStarredItems();
                setArtists(data.artists);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [user]);

    if (loading) return <LoadingState message="Loading favourite artists..." />;

    return (
        <main className="px-6 pt-8 pb-10">
            <div className="flex items-center gap-4 mb-8">
                <div className="text-4xl">⭐</div>
                <div>
                    <h1 className="text-3xl font-bold text-white">
                        Favourite Artists
                    </h1>
                    <p className="text-sm text-[#B3B3B3] mt-0.5">
                        {artists.length} artists
                    </p>
                </div>
            </div>

            {artists.length === 0 ? (
                <EmptyState
                    icon="⭐"
                    title="No favourite artists yet"
                    subtitle="Star artists to see them here"
                />
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                    {artists.map((artist) => (
                        <ArtistCard key={artist.id} artist={artist} />
                    ))}
                </div>
            )}
        </main>
    );
}
