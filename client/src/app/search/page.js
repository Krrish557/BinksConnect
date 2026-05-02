"use client";

export default function SearchPage() {
    return (
        <main className="p-6">
            <h1 className="text-3xl mb-6">Search</h1>

            <input
                type="text"
                placeholder="Search songs, albums, artists..."
                className="w-full p-3 rounded-lg bg-[#181818] outline-none"
            />

            <p className="mt-6 text-gray-400">
                Search functionality will be implemented next.
            </p>
        </main>
    );
}