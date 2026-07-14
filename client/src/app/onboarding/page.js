"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";

const COMING_SOON = [
    { id: "jellyfin", name: "Jellyfin", icon: "📺", description: "Stream from your Jellyfin media server", color: "from-purple-600 to-purple-800" },
    { id: "local", name: "Local Library", icon: "💻", description: "Play music from your device storage", color: "from-amber-600 to-amber-800" },
];

const PROVIDERS = [
    {
        id: "navidrome",
        name: "Navidrome",
        icon: "🎵",
        description: "Connect to your Navidrome server",
        enabled: true,
        fields: [
            { key: "serverUrl", label: "Server URL", type: "text", placeholder: "https://music.example.com", required: true },
            { key: "username", label: "Username", type: "text", placeholder: "admin", required: true },
            { key: "password", label: "Password", type: "password", placeholder: "••••••••", required: true },
        ],
    },
    {
        id: "telegram",
        name: "Telegram",
        icon: "✈️",
        description: "Play music stored in your Telegram channels",
        enabled: true,
        fields: [],
    },
];

export default function OnboardingPage() {
    const router = useRouter();
    const { login, isAuthenticated } = useAuthStore();
    const [step, setStep] = useState("pick");
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [config, setConfig] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isAuthenticated) {
            router.replace("/");
        }
    }, [isAuthenticated, router]);

    const selectProvider = (provider) => {
        if (!provider.enabled) return;
        setSelectedProvider(provider);
        setConfig({});
        setError("");
        if (provider.fields.length === 0) {
            handleSubmitTelegram();
        } else {
            setStep("configure");
        }
    };

    const updateField = (key) => (e) => {
        setConfig((prev) => ({ ...prev, [key]: e.target.value }));
    };

    const handleSubmitTelegram = async () => {
        setError("");
        setLoading(true);
        try {
            await login(null, null, null, "telegram");
            router.push("/");
        } catch (err) {
            setError(err.message || "Telegram not configured on server.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await login(config.serverUrl, config.username, config.password, selectedProvider.id);
            router.push("/");
        } catch (err) {
            setError(err.message || "Connection failed. Check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#121212] flex items-center justify-center px-4">
            <div className="w-full max-w-lg">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black text-white mb-2">
                        Binks<span className="text-[#1db954]">Connect</span>
                    </h1>
                    <p className="text-[#B3B3B3]">
                        {step === "pick"
                            ? "Choose your music provider"
                            : `Connect to ${selectedProvider?.name}`}
                    </p>
                </div>

                {step === "pick" && (
                    <div className="space-y-3">
                        {PROVIDERS.map((provider) => (
                            <button
                                key={provider.id}
                                onClick={() => selectProvider(provider)}
                                className="w-full flex items-center gap-4 p-5 bg-[#181818] hover:bg-[#282828] rounded-xl transition-colors text-left group"
                            >
                                <span className="text-3xl">{provider.icon}</span>
                                <div className="flex-1">
                                    <p className="font-bold text-white group-hover:text-[#1db954] transition-colors">
                                        {provider.name}
                                    </p>
                                    <p className="text-sm text-[#B3B3B3]">
                                        {provider.description}
                                    </p>
                                </div>
                                <span className="text-[#B3B3B3] group-hover:text-white transition-colors">
                                    →
                                </span>
                            </button>
                        ))}

                        {COMING_SOON.map((provider) => (
                            <div
                                key={provider.id}
                                className="w-full flex items-center gap-4 p-5 bg-[#181818] rounded-xl opacity-50 cursor-not-allowed text-left"
                            >
                                <span className="text-3xl">{provider.icon}</span>
                                <div className="flex-1">
                                    <p className="font-bold text-white">
                                        {provider.name}
                                    </p>
                                    <p className="text-sm text-[#B3B3B3]">
                                        {provider.description}
                                    </p>
                                </div>
                                <span className="text-xs bg-[#282828] text-[#B3B3B3] px-3 py-1 rounded-full">
                                    Coming Soon
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {step === "configure" && selectedProvider && (
                    <div>
                        <button
                            onClick={() => {
                                setStep("pick");
                                setError("");
                            }}
                            className="text-[#B3B3B3] hover:text-white text-sm mb-6 flex items-center gap-1"
                        >
                            ← Back
                        </button>

                        {error && (
                            <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-4 text-sm">
                                {error}
                            </div>
                        )}

                        {loading && (
                            <div className="text-center py-8">
                                <p className="text-[#B3B3B3]">Connecting to {selectedProvider.name}...</p>
                            </div>
                        )}

                        {!loading && (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {selectedProvider.fields.map((field) => (
                                    <div key={field.key}>
                                        <label className="block text-sm font-medium text-[#B3B3B3] mb-1.5">
                                            {field.label}
                                        </label>
                                        <input
                                            type={field.type}
                                            value={config[field.key] || ""}
                                            onChange={updateField(field.key)}
                                            placeholder={field.placeholder}
                                            required={field.required}
                                            className="w-full px-4 py-3 bg-[#282828] text-white rounded-lg outline-none focus:ring-2 focus:ring-[#1db954] transition text-sm"
                                        />
                                    </div>
                                ))}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#1db954] hover:bg-[#1ed760] disabled:opacity-50 text-black font-bold py-3 rounded-full transition-colors mt-6"
                                >
                                    {loading ? "Connecting..." : "Connect"}
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
