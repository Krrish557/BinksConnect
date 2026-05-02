"use client";

import { useRouter } from "next/navigation";

export default function LibraryPage() {
    const router = useRouter();

    const items = [
        { title: "All Songs", path: "/library/songs", icon: "🎵" },
        { title: "Albums", path: "/albums", icon: "💿" },
        { title: "Artists", path: "/artists", icon: "🎤" },
        { title: "Favourite Songs", path: "/library/favourites", icon: "❤️" },
        { title: "Favourite Artists", path: "/library/fav-artists", icon: "⭐" },
    ];

    return (
        <main className="p-6">
            <h1 className="text-3xl mb-6">Your Library</h1>

            <div className="grid grid-cols-2 gap-4">
                {items.map((item) => (
                    <div
                        key={item.title}
                        onClick={() => router.push(item.path)}
                        className="bg-[#181818] hover:bg-[#282828] transition rounded-xl p-6 cursor-pointer"
                    >
                        <div className="text-2xl mb-2">{item.icon}</div>
                        <p className="font-semibold">{item.title}</p>
                    </div>
                ))}
            </div>
        </main>
    );
}