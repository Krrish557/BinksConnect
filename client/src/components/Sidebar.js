"use client";

import Link from "next/link";

export default function Sidebar() {
    return (
        <aside className="w-64 bg-zinc-900 min-h-screen p-6">
            <h1 className="text-2xl font-bold mb-8">
                BinksConnect
            </h1>

            <nav className="space-y-4">
                <Link href="/">Home</Link>
                <br />
                <Link href="/library">Library</Link>
                <br />
                <Link href="/albums">Albums</Link>
                <br />
                <Link href="/artists">Artists</Link>
                <br />
                <Link href="/playlists">Playlists</Link>
                <br />
                <Link href="/lyrics">Lyrics</Link>
                <br />
                <Link href="/settings">Settings</Link>
            </nav>
        </aside>
    );
}