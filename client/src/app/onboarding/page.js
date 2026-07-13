"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { providerManager } from "@/core/providerManager";
import { getRegisteredProviders } from "@/providers/registry";

const COMING_SOON = [
    { id: "telegram", name: "Telegram", icon: "✈️", description: "Play music from your Telegram channel", color: "from-blue-600 to-blue-800" },
    { id: "jellyfin", name: "Jellyfin", icon: "📺", description: "Stream from your Jellyfin media server", color: "from-purple-600 to-purple-800" },
    { id: "local", name: "Local Library", icon: "💻", description: "Play music from your device storage", color: "from-amber-600 to-amber-800" },
];

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState("pick");
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [config, setConfig] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const activeProviders = getRegisteredProviders();
    const allProviders = [
        ...activeProviders.map((p) => ({ ...p, enabled: true })),
        ...COMING_SOON.map((p) => ({ ...p, enabled: false, comingSoon: true })),
    ];

    const selectProvider = (provider) => {
        if (!provider.enabled) return;
        setSelectedProvider(provider);
        setConfig({});
        setError("");
        setStep("configure");
    };

    const updateField = (key) => (e) => {
        setConfig((prev) => ({ ...prev, [key]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await providerManager.completeOnboarding(selectedProvider.id, config);
            router.push("/");
        } catch (err) {
            setError(err.message || "Connection failed. Please check your credentials and try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        setStep("pick");
        setSelectedProvider(null);
        setConfig({});
        setError("");
    };

    if (step === "pick") {
        return (
            <main className="min-h-screen bg-[#121212] flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-2xl">
                    {/* HEADER */}
                    <div className="text-center mb-12">
                        <div className="text-5xl mb-4">🎵</div>
                        <h1 className="text-3xl font-black text-white tracking-tight">
                            BinksConnect
                        </h1>
                        <p className="text-[#B3B3B3] text-sm mt-2">
                            Choose your music source to get started
                        </p>
                    </div>

                    {/* PROVIDER GRID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {allProviders.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => selectProvider(p)}
                                disabled={!p.enabled}
                                className={`relative text-left bg-[#181818] rounded-xl p-6 transition-all border border-transparent
                                    ${
                                        p.enabled
                                            ? "hover:bg-[#282828] hover:border-[#333] cursor-pointer group"
                                            : "opacity-50 cursor-not-allowed"
                                    }`}
                            >
                                <div className="text-4xl mb-4">{p.icon}</div>
                                <h3 className="text-white font-bold text-lg mb-1">
                                    {p.name}
                                </h3>
                                <p className="text-[#B3B3B3] text-sm">
                                    {p.description}
                                </p>
                                {p.comingSoon && (
                                    <span className="absolute top-3 right-3 bg-[#383838] text-[#B3B3B3] text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full">
                                        Soon
                                    </span>
                                )}
                                {p.enabled && (
                                    <div className="absolute inset-0 rounded-xl ring-1 ring-transparent group-hover:ring-[#1db954]/30 transition-all pointer-events-none" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </main>
        );
    }

    const schema = selectedProvider?.configSchema || [];

    return (
        <main className="min-h-screen bg-[#121212] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* HEADER */}
                <div className="text-center mb-10">
                    <button
                        onClick={handleBack}
                        className="text-[#B3B3B3] hover:text-white transition-colors text-sm mb-4 inline-block"
                    >
                        ← Back to provider selection
                    </button>
                    <div className="text-4xl mb-3">{selectedProvider.icon}</div>
                    <h1 className="text-2xl font-black text-white tracking-tight">
                        Connect to {selectedProvider.name}
                    </h1>
                    <p className="text-[#B3B3B3] text-sm mt-1">
                        Enter your server credentials
                    </p>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {schema.map((field) => (
                        <div key={field.key}>
                            <label className="text-xs font-semibold uppercase tracking-wider text-[#B3B3B3] block mb-1.5">
                                {field.label}
                            </label>
                            <input
                                type={field.type}
                                placeholder={field.placeholder}
                                value={config[field.key] || ""}
                                onChange={updateField(field.key)}
                                required={field.required}
                                className="w-full bg-[#282828] text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-[#1db954] transition placeholder-[#666] text-sm"
                            />
                        </div>
                    ))}

                    {error && (
                        <p className="text-red-400 text-sm bg-red-400/10 px-4 py-3 rounded-lg">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#1db954] hover:bg-[#1ed760] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3.5 rounded-full transition-colors text-sm mt-2"
                    >
                        {loading ? "Connecting..." : "Connect"}
                    </button>
                </form>
            </div>
        </main>
    );
}
