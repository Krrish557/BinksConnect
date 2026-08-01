"use client";

export default function AuthLayout({ title, subtitle, children }) {
    return (
        <main className="min-h-screen w-full bg-[#121212] text-white flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white">🎵 BinksConnect</h1>
                    <h2 className="text-xl font-semibold text-white mt-4">{title}</h2>
                    {subtitle && (
                        <p className="text-sm text-[#B3B3B3] mt-2">{subtitle}</p>
                    )}
                </div>
                <div className="bg-[#181818] rounded-2xl p-6 md:p-8 border border-white/5">
                    {children}
                </div>
            </div>
        </main>
    );
}
