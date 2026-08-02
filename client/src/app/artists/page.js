"use client";

import { useEffect, useState } from "react";
import useAuthStore from "@/store/authStore";
import { artistService } from "@/services/artistService";
import { cacheService } from "@/services/cacheService";
import ArtistCard from "@/components/ArtistCard";
import LoadingState from "@/components/ui/LoadingState";
import EmptyState from "@/components/ui/EmptyState";

export default function ArtistsPage() {
    const user = useAuthStore((s) => s.user);
    const [artists, setArtists] = useState(() => cacheService.get("artists_all")?.data || []);
    const [loading, setLoading] = useState(() => !cacheService.get("artists_all")?.data);
    const [filter, setFilter] = useState("");

    useEffect(() => {
        async function load() {
            if (!user) return;
            if (artists.length === 0) setLoading(true);
            try {
                const data = await artistService.getArtists();
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

    return (
        <main className="px-4 sm:px-6 pt-6 sm:pt-8 pb-24 sm:pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Artists</h1>
                    <p className="text-xs text-[#B3B3B3] mt-0.5">Discover your favorite artists</p>
                </div>
                <input
                    type="text"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Search artists..."
                    className="bg-[#242424] text-white px-4 py-2.5 rounded-full text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#1db954] transition w-full sm:w-64 border border-white/5"
                />
            </div>

            {loading && artists.length === 0 ? (
                <LoadingState message="Loading artists..." />
            ) : filtered.length === 0 ? (
                <EmptyState icon="🎤" title="No artists found" subtitle={filter ? `No results for "${filter}"` : undefined} />
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4 animate-fade-in">
                    {filtered.map((artist) => (
                        <ArtistCard key={artist.id} artist={artist} />
                    ))}
                </div>
            )}
        </main>
    );
}
