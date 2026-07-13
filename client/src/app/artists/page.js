"use client";

import { useEffect, useState } from "react";
import useAuthStore from "@/store/authStore";
import { musicEngine } from "@/core/engine";
import ArtistCard from "@/components/ArtistCard";
import LoadingState from "@/components/ui/LoadingState";
import EmptyState from "@/components/ui/EmptyState";

export default function ArtistsPage() {
    const user = useAuthStore((s) => s.user);
    const [artists, setArtists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");

    useEffect(() => {
        async function load() {
            if (!user) return;
            setLoading(true);
            try {
                const data = await musicEngine.getArtists();
                setArtists(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [user]);

    const filtered = artists.filter((a) =>
        a.name.toLowerCase().includes(filter.toLowerCase())
    );

    if (loading) return <LoadingState message="Loading artists..." />;

    return (
        <main className="px-6 pt-8 pb-10">
            <div className="flex items-center justify-between mb-6 gap-4">
                <h1 className="text-3xl font-bold text-white shrink-0">Artists</h1>
                <input
                    type="text"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Filter artists..."
                    className="bg-[#282828] text-white px-4 py-2 rounded-full text-sm outline-none focus:ring-2 focus:ring-[#1db954] transition w-full max-w-xs"
                />
            </div>

            {filtered.length === 0 ? (
                <EmptyState icon="🎤" title="No artists found" />
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2">
                    {filtered.map((artist) => (
                        <ArtistCard key={artist.id} artist={artist} />
                    ))}
                </div>
            )}
        </main>
    );
}
