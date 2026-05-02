"use client";

export default function QueueItem({
    track,
    isActive,
    index,
    onClick,
}) {
    return (
        <div
            onClick={onClick}
            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${isActive ? "bg-[#282828]" : "hover:bg-[#1f1f1f]"
                }`}
        >
            {/* COVER */}
            <img
                src={track.cover}
                alt={track.title}
                className="w-10 h-10 rounded-md object-cover"
            />

            {/* TEXT */}
            <div className="flex flex-col flex-1 overflow-hidden">
                <p
                    className={`truncate ${isActive ? "text-green-500" : "text-white"
                        }`}
                >
                    {track.title}
                </p>
                <p className="text-sm text-gray-400 truncate">
                    {track.artist}
                </p>
            </div>

            {/* INDEX */}
            <span className="text-xs text-gray-500">
                {index + 1}
            </span>
        </div>
    );
}