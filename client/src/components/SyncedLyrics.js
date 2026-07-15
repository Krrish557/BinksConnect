"use client";

import { useEffect, useRef, useMemo } from "react";

export default function SyncedLyrics({ lyrics, currentTime }) {
    const containerRef = useRef(null);
    const activeLineRef = useRef(null);

    const lines = useMemo(() => {
        if (!lyrics) return [];
        if (lyrics.syncedLines && lyrics.syncedLines.length > 0) {
            return lyrics.syncedLines;
        }
        if (lyrics.plain) {
            return lyrics.plain.split("\n").filter(Boolean).map((text, i) => ({
                time: i * 4,
                text,
            }));
        }
        return [];
    }, [lyrics]);

    const activeIndex = useMemo(() => {
        if (lines.length === 0) return -1;
        let idx = -1;
        for (let i = 0; i < lines.length; i++) {
            if (currentTime >= lines[i].time) {
                idx = i;
            } else {
                break;
            }
        }
        return idx;
    }, [lines, currentTime]);

    useEffect(() => {
        if (activeLineRef.current && containerRef.current) {
            const container = containerRef.current;
            const el = activeLineRef.current;
            const containerRect = container.getBoundingClientRect();
            const elRect = el.getBoundingClientRect();
            const offset =
                elRect.top - containerRect.top - containerRect.height / 2 + elRect.height / 2;
            container.scrollBy({ top: offset, behavior: "smooth" });
        }
    }, [activeIndex]);

    if (lyrics?.instrumental) {
        return (
            <div className="flex items-center justify-center h-full text-[#B3B3B3] text-lg italic">
                This track is instrumental
            </div>
        );
    }

    if (!lyrics || lines.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-[#B3B3B3] text-lg">
                No lyrics available for this track
            </div>
        );
    }

    if (!lyrics.synced) {
        return (
            <div
                ref={containerRef}
                className="h-full overflow-y-auto py-8 px-4 text-center"
            >
                <p className="text-xl leading-relaxed text-white/80 whitespace-pre-wrap">
                    {lyrics.plain}
                </p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="h-full overflow-y-auto py-8 px-4 text-center"
        >
            {lines.map((line, i) => {
                const isActive = i === activeIndex;
                return (
                    <p
                        key={`${i}-${line.time}`}
                        ref={isActive ? activeLineRef : null}
                        className={`py-2 text-xl leading-relaxed transition-all duration-300 cursor-pointer ${
                            isActive
                                ? "text-white font-bold scale-105"
                                : i < activeIndex
                                ? "text-white/30"
                                : "text-white/50"
                        }`}
                        onClick={() => {
                            if (lyrics.syncedLines?.length > 0) {
                                const event = new CustomEvent("lyricsSeek", {
                                    detail: { time: line.time },
                                });
                                window.dispatchEvent(event);
                            }
                        }}
                    >
                        {line.text}
                    </p>
                );
            })}
        </div>
    );
}
