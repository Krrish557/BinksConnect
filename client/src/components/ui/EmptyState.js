"use client";

export default function EmptyState({ icon = "🎵", title, subtitle }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">{icon}</span>
            {title && (
                <h3 className="text-xl font-semibold text-white mb-2">
                    {title}
                </h3>
            )}
            {subtitle && (
                <p className="text-[#B3B3B3] text-sm max-w-xs">{subtitle}</p>
            )}
        </div>
    );
}
