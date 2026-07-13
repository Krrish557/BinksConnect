"use client";

export default function LoadingState({ message = "Loading..." }) {
    return (
        <div className="flex flex-col items-center justify-center py-20">
            <div className="flex gap-1 mb-4">
                {[0, 1, 2].map((i) => (
                    <span
                        key={i}
                        className="w-2 h-2 rounded-full bg-[#1db954]"
                        style={{
                            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                        }}
                    />
                ))}
            </div>
            <p className="text-[#B3B3B3] text-sm">{message}</p>
            <style jsx>{`
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
            `}</style>
        </div>
    );
}
