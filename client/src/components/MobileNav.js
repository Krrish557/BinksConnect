"use client";

import Link from "next/link";

export default function MobileNav() {
    return (
        <nav className="fixed bottom-20 left-0 right-0 h-16 bg-[#181818] border-t border-zinc-700 flex justify-around items-center md:hidden z-50">
            <Link href="/">Home</Link>
            <Link href="/search">Search</Link>
            <Link href="/library">Library</Link>
        </nav>
    );
}