"use client";

import { useState } from "react";
import Link from "next/link";
import { authService } from "@/services/authService";
import AuthLayout from "@/components/AuthLayout";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const inputClass =
        "w-full px-4 py-3 bg-[#282828] text-white rounded-lg outline-none focus:ring-2 focus:ring-[#1db954] transition text-sm placeholder-[#7a7a7a]";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!email.trim()) {
            setError("Enter the email associated with your account.");
            return;
        }
        setLoading(true);
        try {
            await authService.forgotPassword(email.trim());
            setSent(true);
        } catch (err) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Reset your password"
            subtitle="We'll email you a link to set a new password"
        >
            {sent ? (
                <div className="text-center space-y-4">
                    <div className="text-4xl">📬</div>
                    <p className="text-sm text-[#B3B3B3]">
                        If an account exists for{" "}
                        <span className="text-white font-medium">{email.trim()}</span>,
                        you&apos;ll receive a password reset link shortly.
                    </p>
                    <Link
                        href="/login"
                        className="inline-block py-3 px-6 rounded-full bg-[#1db954] text-black font-bold text-sm hover:bg-[#1ed760] transition"
                    >
                        Back to login
                    </Link>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-[#B3B3B3] mb-1.5">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            autoComplete="email"
                            className={inputClass}
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-full bg-[#1db954] text-black font-bold text-sm hover:bg-[#1ed760] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Sending..." : "Send reset link"}
                    </button>

                    <p className="text-sm text-center text-[#B3B3B3]">
                        Remembered it?{" "}
                        <Link href="/login" className="text-[#1db954] hover:underline font-medium">
                            Log in
                        </Link>
                    </p>
                </form>
            )}
        </AuthLayout>
    );
}
