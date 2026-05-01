"use client";

import Link from "next/link";

export default function LibraryPage() {
    return (
        <main>
            <h1 className="text-3xl font-bold mb-6">
                Your Library
            </h1>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Link
                    href="/albums"
                    className="bg-[#181818] hover:bg-[#282828] rounded-xl p-6"
                >
                    Albums
                </Link>

                <Link
                    href="/artists"
                    className="bg-[#181818] hover:bg-[#282828] rounded-xl p-6"
                >
                    Artists
                </Link>

                <Link
                    href="/playlists"
                    className="bg-[#181818] hover:bg-[#282828] rounded-xl p-6"
                >
                    Playlists
                </Link>
            </div>
        </main>
    );
}