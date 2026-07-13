"use client";

import { useRef } from "react";

export default function HorizontalScroller({ title, children, seeAllHref }) {
    const scrollRef = useRef(null);

    const scroll = (dir) => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollBy({ left: dir * 300, behavior: "smooth" });
    };

    return (
        <section className="mb-10">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-xl font-bold text-white">{title}</h2>
                <div className="flex items-center gap-3">
                    {seeAllHref && (
                        <a
                            href={seeAllHref}
                            className="text-xs text-[#B3B3B3] hover:text-white transition font-semibold uppercase tracking-wider"
                        >
                            See all
                        </a>
                    )}
                    <button
                        onClick={() => scroll(-1)}
                        className="w-7 h-7 rounded-full bg-[#282828] hover:bg-[#383838] flex items-center justify-center text-sm transition"
                    >
                        ‹
                    </button>
                    <button
                        onClick={() => scroll(1)}
                        className="w-7 h-7 rounded-full bg-[#282828] hover:bg-[#383838] flex items-center justify-center text-sm transition"
                    >
                        ›
                    </button>
                </div>
            </div>

            {/* SCROLL CONTAINER */}
            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
                {children}
            </div>
        </section>
    );
}
