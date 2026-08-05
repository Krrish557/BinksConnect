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
                <h2 className="v-heading text-xl font-bold">{title}</h2>
                <div className="flex items-center gap-3">
                    {seeAllHref && (
                        <a
                            href={seeAllHref}
                            className="text-xs text-[#94866B] hover:text-[#CAAA6E] transition font-semibold uppercase tracking-wider"
                        >
                            See all
                        </a>
                    )}
                    <button
                        onClick={() => scroll(-1)}
                        className="w-7 h-7 rounded-full bg-[#262B2C] hover:bg-[#2E3435] hover:text-[#CAAA6E] flex items-center justify-center text-sm transition"
                    >
                        ‹
                    </button>
                    <button
                        onClick={() => scroll(1)}
                        className="w-7 h-7 rounded-full bg-[#262B2C] hover:bg-[#2E3435] hover:text-[#CAAA6E] flex items-center justify-center text-sm transition"
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
