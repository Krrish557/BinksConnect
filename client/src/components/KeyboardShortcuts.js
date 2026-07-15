"use client";

import { useEffect, useState } from "react";
import { usePlayerStore } from "@/store/playerStore";

const SHORTCUTS = [
    { key: "Space", action: "Play / Pause" },
    { key: "→", action: "Seek forward 5s" },
    { key: "←", action: "Seek backward 5s" },
    { key: "Shift + →", action: "Next track" },
    { key: "Shift + ←", action: "Previous track" },
    { key: "M", action: "Mute / Unmute" },
    { key: "F", action: "Toggle fullscreen player" },
    { key: "S", action: "Toggle shuffle" },
    { key: "R", action: "Cycle repeat" },
    { key: "?", action: "Show shortcuts" },
];

export default function KeyboardShortcuts() {
    const [showHelp, setShowHelp] = useState(false);

    const togglePlay = usePlayerStore((s) => s.togglePlay);
    const next = usePlayerStore((s) => s.next);
    const previous = usePlayerStore((s) => s.previous);
    const seekForward = usePlayerStore((s) => s.seekForward);
    const seekBackward = usePlayerStore((s) => s.seekBackward);
    const toggleMute = usePlayerStore((s) => s.toggleMute);
    const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
    const toggleRepeat = usePlayerStore((s) => s.toggleRepeat);
    const isPlayerOpen = usePlayerStore((s) => s.isPlayerOpen);
    const openPlayer = usePlayerStore((s) => s.openPlayer);
    const closePlayer = usePlayerStore((s) => s.closePlayer);

    useEffect(() => {
        const handler = (e) => {
            const tag = e.target.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable) return;

            switch (e.key) {
                case " ":
                    e.preventDefault();
                    togglePlay();
                    break;
                case "ArrowRight":
                    e.preventDefault();
                    if (e.shiftKey) next();
                    else seekForward();
                    break;
                case "ArrowLeft":
                    e.preventDefault();
                    if (e.shiftKey) previous();
                    else seekBackward();
                    break;
                case "m":
                case "M":
                    e.preventDefault();
                    toggleMute();
                    break;
                case "f":
                case "F":
                    e.preventDefault();
                    if (isPlayerOpen) closePlayer();
                    else openPlayer();
                    break;
                case "s":
                case "S":
                    e.preventDefault();
                    toggleShuffle();
                    break;
                case "r":
                case "R":
                    e.preventDefault();
                    toggleRepeat();
                    break;
                case "?":
                    e.preventDefault();
                    setShowHelp((v) => !v);
                    break;
                case "Escape":
                    if (showHelp) {
                        e.preventDefault();
                        setShowHelp(false);
                    }
                    break;
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [showHelp, isPlayerOpen]);

    if (!showHelp) return null;

    return (
        <div
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60"
            onClick={() => setShowHelp(false)}
        >
            <div
                className="bg-[#282828] rounded-2xl p-6 w-80 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Keyboard Shortcuts</h3>
                    <button
                        onClick={() => setShowHelp(false)}
                        className="text-[#B3B3B3] hover:text-white text-xl"
                    >
                        ✕
                    </button>
                </div>
                <div className="space-y-2">
                    {SHORTCUTS.map(({ key, action }) => (
                        <div key={key} className="flex items-center justify-between">
                            <span className="text-sm text-[#B3B3B3]">{action}</span>
                            <kbd className="px-2 py-0.5 text-xs font-mono bg-[#1a1a1a] text-white rounded border border-white/10">
                                {key}
                            </kbd>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
