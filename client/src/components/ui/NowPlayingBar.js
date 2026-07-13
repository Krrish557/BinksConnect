"use client";

// Animated equalizer bars shown on the currently playing song
export default function NowPlayingBar({ isPlaying = true, className = "" }) {
    return (
        <span
            className={`inline-flex items-end gap-[2px] h-4 ${className}`}
            aria-label="Now playing"
        >
            {[1, 2, 3].map((i) => (
                <span
                    key={i}
                    className="w-[3px] rounded-sm bg-[#1db954]"
                    style={{
                        height: isPlaying ? undefined : "4px",
                        animation: isPlaying
                            ? `equalize${i} 0.${7 + i}s ease-in-out infinite alternate`
                            : "none",
                    }}
                />
            ))}
            <style jsx>{`
                @keyframes equalize1 {
                    from { height: 4px; }
                    to   { height: 14px; }
                }
                @keyframes equalize2 {
                    from { height: 8px; }
                    to   { height: 4px; }
                }
                @keyframes equalize3 {
                    from { height: 12px; }
                    to   { height: 6px; }
                }
            `}</style>
        </span>
    );
}
