"use client";

import { useRouter } from "next/navigation";

const ITEMS = [
    { title: "All Songs",        path: "/library/songs",       icon: "🎵", desc: "Every track in your library" },
    { title: "Albums",           path: "/albums",              icon: "💿", desc: "Browse by album" },
    { title: "Artists",          path: "/artists",             icon: "🎤", desc: "Browse by artist" },
    { title: "Playlists",        path: "/playlists",           icon: "📁", desc: "Your custom playlists" },
    { title: "Favourite Songs",  path: "/library/favourites",  icon: "❤️", desc: "Songs you've starred" },
    { title: "Favourite Artists",path: "/library/fav-artists", icon: "⭐", desc: "Artists you follow" },
];

export default function LibraryPage() {
    const router = useRouter();

    return (
        <main className="px-6 pt-8 pb-10">
            <h1 className="v-heading text-3xl font-bold mb-8">Your Library</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ITEMS.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => router.push(item.path)}
                        className="flex items-center gap-4 bg-[#1C2123] hover:bg-[#262B2C] transition-colors rounded-xl p-5 text-left group"
                    >
                        <div className="text-3xl w-12 h-12 flex items-center justify-center bg-[#262B2C] group-hover:bg-[#2E3435] rounded-xl transition-colors shrink-0">
                            {item.icon}
                        </div>
                        <div>
                            <p className="font-semibold text-white">{item.title}</p>
                            <p className="text-xs text-[#94866B] mt-0.5">{item.desc}</p>
                        </div>
                    </button>
                ))}
            </div>
        </main>
    );
}
